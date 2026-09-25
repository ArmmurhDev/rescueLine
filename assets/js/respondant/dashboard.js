/**
 * RescueLine - Respondent Dashboard & Navigation Script (Real-time DB Connection)
 * Handles UI interactions, live database rendering, doughnut charts, and real-time background sync.
 */

// Global chart reference
let emergencyTypeChart = null;

// Dashboard template generator for instant switching
window.getDashboardHTML = function() {
  const isOnline = (window._currentUserStatus !== 'inactive');
  const userName = window._currentUserName || 'Musa Ibrahim';
  const userInitials = window._currentUserInitials || 'MI';
  const activeCount = window._currentActiveCount || 0;

  return `
    <!-- WELCOME BANNER -->
    <div class="welcome-card ${!isOnline ? 'offline' : ''}" id="welcomeCard">
      <div class="welcome-left">
        <div class="welcome-avatar ${!isOnline ? 'offline' : ''}" id="welcomeAvatar">${escapeHTML(userInitials)}</div>
        <div class="welcome-info">
          <h3 id="welcomeName">Welcome back, ${escapeHTML(userName)} 👋</h3>
          <p>You have <strong style="color: var(--green);" id="activeCountMsg">${activeCount} active emergency reports</strong> requiring attention.</p>
          <div class="status-line">
            <span class="status-indicator ${!isOnline ? 'offline' : ''}" id="statusIndicator">
              <span class="status-dot ${!isOnline ? 'offline' : ''}" id="statusDot"></span> 
              <span id="statusText">You are ${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </span>
            <span id="statusLastActive">Last active: ${isOnline ? 'Just now' : 'Offline'}</span>
          </div>
        </div>
      </div>
      <button class="btn ${isOnline ? 'btn-danger' : 'btn-success'}" id="offlineBtn">
        <i data-lucide="${isOnline ? 'wifi-off' : 'wifi'}" id="offlineBtnIcon"></i>
        <span id="offlineBtnText">${isOnline ? 'Go Offline' : 'Go Online'}</span>
      </button>
    </div>

    <!-- KEY METRICS / STATS GRID -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon green"><i data-lucide="inbox"></i></div>
          <span class="stat-trend">Live</span>
        </div>
        <div class="stat-value" id="statNewReports">0</div>
        <div class="stat-label">New Reports</div>
        <div class="stat-sub">Awaiting response</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon green"><i data-lucide="activity"></i></div>
          <span class="stat-trend red">Urgent</span>
        </div>
        <div class="stat-value" id="statActiveResponses">0</div>
        <div class="stat-label">Active Responses</div>
        <div class="stat-sub">Currently being handled</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon green"><i data-lucide="check-circle-2"></i></div>
          <span class="stat-trend">+100%</span>
        </div>
        <div class="stat-value" id="statResolvedToday">0</div>
        <div class="stat-label">Resolved Today</div>
        <div class="stat-sub">Incident closures</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon red"><i data-lucide="alert-octagon"></i></div>
          <span class="stat-trend red">Urgent</span>
        </div>
        <div class="stat-value" style="color: var(--red);" id="statCritical">0</div>
        <div class="stat-label">Critical</div>
        <div class="stat-sub">Needs priority action</div>
      </div>
    </div>

    <!-- REPORTS + ACTIVITY SECTION -->
    <div class="grid-2">
      <!-- REPORTS TABLE & CARDS -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span class="dot"></span>
            Incoming Emergency Reports
          </div>
          <a href="incorming-report.php" class="card-link" onclick="if(window.displayIncomingReportsContent){window.displayIncomingReportsContent(); return false;}">View All <i data-lucide="arrow-right"></i></a>
        </div>

        <div class="table-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Emergency Type</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="reportsBody"></tbody>
          </table>
        </div>

        <div class="report-cards" id="reportCards"></div>
      </div>

      <!-- ACTIVITY TIMELINE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span class="dot"></span>
            Response Activity
          </div>
        </div>
        <div class="timeline" id="timeline"></div>
      </div>
    </div>

    <!-- EMERGENCY TYPES CHART -->
    <div class="card" style="margin-top: 24px;">
      <div class="card-header">
        <div class="card-title">
          <span class="dot"></span>
          Emergency Types Distribution
        </div>
      </div>
      <div class="chart-wrap" style="position: relative; height: 300px; width: 100%;">
        <canvas id="emergencyChart" class="emergencyChart"></canvas>
      </div>
    </div>
  `;
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDashboard();
});

// Global event delegation for Go Online / Go Offline button
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#offlineBtn');
  if (btn) {
    e.preventDefault();
    toggleOnlineStatus();
  }
});

async function toggleOnlineStatus() {
  const btn = document.getElementById('offlineBtn');
  if (!btn || btn.disabled) return;

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<span style="display:inline-block; font-size:12px;">Processing...</span>`;

  try {
    const res = await fetch('../api/dashboard.php?action=toggle_online_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      const isOnline = json.data.is_online;
      window._currentUserStatus = json.data.status;
      updateWelcomeCardUI(isOnline);
    } else {
      alert(json.message || 'Failed to update status.');
      btn.innerHTML = originalHtml;
    }
  } catch (err) {
    console.error('Status toggle error:', err);
    alert('Network error updating online status.');
    btn.innerHTML = originalHtml;
  } finally {
    btn.disabled = false;
  }
}

function updateWelcomeCardUI(isOnline) {
  const card = document.getElementById('welcomeCard');
  const avatar = document.getElementById('welcomeAvatar');
  const indicator = document.getElementById('statusIndicator');
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const lastActive = document.getElementById('statusLastActive');
  const btn = document.getElementById('offlineBtn');

  if (card) card.classList.toggle('offline', !isOnline);
  if (avatar) avatar.classList.toggle('offline', !isOnline);
  if (indicator) indicator.classList.toggle('offline', !isOnline);
  if (dot) dot.classList.toggle('offline', !isOnline);
  if (text) text.textContent = isOnline ? 'You are ONLINE' : 'You are OFFLINE';
  if (lastActive) lastActive.textContent = isOnline ? 'Last active: Just now' : 'Last active: Offline';

  if (btn) {
    btn.className = `btn ${isOnline ? 'btn-danger' : 'btn-success'}`;
    btn.innerHTML = `<i data-lucide="${isOnline ? 'wifi-off' : 'wifi'}" id="offlineBtnIcon"></i> <span id="offlineBtnText">${isOnline ? 'Go Offline' : 'Go Online'}</span>`;
  }

  refreshIcons();
}

function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const savedTheme = localStorage.getItem('rl-theme') || 'dark';

  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', savedTheme === 'dark' ? 'sun' : 'moon');
    refreshIcons();
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('rl-theme', next);
      if (themeIcon) {
        themeIcon.setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon');
        refreshIcons();
      }
      // Re-render chart on theme change for label colors
      if (window._lastTypesData) {
        renderEmergencyChart(window._lastTypesData);
      }
    });
  }
}

async function initDashboard() {
  const reportsBody = document.getElementById('reportsBody');
  const reportCards = document.getElementById('reportCards');
  const timeline = document.getElementById('timeline');

  try {
    const res = await fetch('../api/dashboard.php?action=respondent_stats');
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      const user = json.data.user || {};
      const counts = json.data.counts || {};
      const incoming = json.data.incoming_reports || [];
      const active = json.data.active_incidents || [];
      const types = json.data.types || [];
      window._lastTypesData = types;

      // Update user state and welcome card
      if (user.status) {
        window._currentUserStatus = user.status;
        window._currentUserName = user.name;
        window._currentUserInitials = user.initials;
        window._currentActiveCount = counts.active || 0;

        const welcomeName = document.getElementById('welcomeName');
        const welcomeAvatar = document.getElementById('welcomeAvatar');
        const navName = document.getElementById('navName');
        const navAvatar = document.getElementById('navAvatar');

        if (welcomeName && user.name) welcomeName.textContent = `Welcome back, ${user.name} 👋`;
        if (welcomeAvatar && user.initials) welcomeAvatar.textContent = user.initials;
        if (navName && user.name) navName.textContent = user.name;
        if (navAvatar && user.initials) navAvatar.textContent = user.initials;

        updateWelcomeCardUI(user.is_online !== false && user.status === 'active');
      }

      // Update stat counters
      const newEl = document.getElementById('statNewReports');
      const actEl = document.getElementById('statActiveResponses');
      const resEl = document.getElementById('statResolvedToday');
      const critEl = document.getElementById('statCritical');
      const actMsg = document.getElementById('activeCountMsg');

      if (newEl) newEl.textContent = counts.incoming || 0;
      if (actEl) actEl.textContent = counts.active || 0;
      if (resEl) resEl.textContent = counts.resolved_today || 0;
      if (critEl) critEl.textContent = counts.critical || 0;
      if (actMsg) actMsg.textContent = `${counts.active || 0} active emergency reports`;

      // Render incoming reports table
      renderIncomingReports(incoming, reportsBody, reportCards);

      // Render response timeline
      renderTimeline(incoming.concat(active), timeline);

      // Render Emergency Types Chart
      renderEmergencyChart(types);
    }
  } catch (err) {
    console.error('Error loading respondent dashboard:', err);
  }

  refreshIcons();

  if (window._dashPollInterval) {
    clearInterval(window._dashPollInterval);
  }
  window._dashPollInterval = setInterval(() => {
    if (document.getElementById('reportsBody') && !document.getElementById('incomingReportsContainer')) {
      initDashboard();
    }
  }, 4000);
}

function renderIncomingReports(reports, tableBody, cardsContainer) {
  if (!tableBody && !cardsContainer) return;

  if (!reports || reports.length === 0) {
    const empty = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">No new incoming reports.</td></tr>`;
    if (tableBody) tableBody.innerHTML = empty;
    if (cardsContainer) cardsContainer.innerHTML = '<div class="empty-state"><p>No new incoming reports.</p></div>';
    return;
  }

  if (tableBody) {
    tableBody.innerHTML = reports.map(r => `
      <tr>
        <td><span class="report-id">${escapeHTML(r.report_code || ('RL-' + r.id))}</span></td>
        <td>
          <div class="emergency-type ${escapeHTML((r.category_name || '').toLowerCase().replace(/[^a-z0-9]/g, ''))}">
            <i data-lucide="${escapeHTML(getTypeIcon(r.category_name))}"></i>
            ${escapeHTML(r.category_name || 'Emergency')}
          </div>
        </td>
        <td>
          <div class="location-text">
            <span class="primary">${escapeHTML(r.address_landmark || r.lga)}</span>
            <span class="secondary">${escapeHTML(r.state)}</span>
          </div>
        </td>
        <td><span class="priority-badge ${escapeHTML(r.priority)}">${escapeHTML(capitalize(r.priority))}</span></td>
        <td>
          <button type="button" class="btn btn-primary btn-sm" onclick="acceptIncidentFromDashboard(${r.id})">
            <i data-lucide="check"></i> Accept
          </button>
        </td>
      </tr>
    `).join('');
  }

  if (cardsContainer) {
    cardsContainer.innerHTML = reports.map(r => `
      <div class="report-card-item">
        <div class="report-card-top">
          <span class="report-card-id">${escapeHTML(r.report_code || ('RL-' + r.id))}</span>
          <span class="priority-badge ${escapeHTML(r.priority)}">${escapeHTML(capitalize(r.priority))}</span>
        </div>
        <div class="report-card-body">
          <div class="report-card-field">
            <div class="label">Type</div>
            <div class="value">${escapeHTML(r.category_name || 'Emergency')}</div>
          </div>
          <div class="report-card-field">
            <div class="label">Location</div>
            <div class="value">${escapeHTML(r.address_landmark || r.lga)}, ${escapeHTML(r.state)}</div>
          </div>
        </div>
        <div class="report-card-actions">
          <button type="button" class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="acceptIncidentFromDashboard(${r.id})">
            <i data-lucide="check"></i> Accept
          </button>
        </div>
      </div>
    `).join('');
  }
}

function renderEmergencyChart(types) {
  const canvas = document.getElementById('emergencyChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (emergencyTypeChart) {
    emergencyTypeChart.destroy();
    emergencyTypeChart = null;
  }

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  const defaultCategories = [
    { name: 'Fire Outbreak', count: 3, color: '#ef4444' },
    { name: 'Medical Emergency', count: 4, color: '#10b981' },
    { name: 'Road Accident', count: 2, color: '#f59e0b' },
    { name: 'Security Threat', count: 3, color: '#3b82f6' },
    { name: 'Flood & Disaster', count: 1, color: '#8b5cf6' }
  ];

  const sourceData = (types && types.length > 0) ? types : defaultCategories;

  const labels = sourceData.map(t => t.name);
  const data = sourceData.map(t => Math.max(0, parseInt(t.count || 0, 10)));
  const colors = sourceData.map(t => t.color || '#3b82f6');

  // Fallback data if everything is 0
  const finalData = data.some(d => d > 0) ? data : [3, 4, 2, 3, 1];

  const ctx = canvas.getContext('2d');
  emergencyTypeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: finalData,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: isLight ? '#ffffff' : '#1e293b',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: isLight ? '#475569' : '#94a3b8',
            font: { family: 'Inter', size: 12, weight: 500 },
            boxWidth: 14,
            padding: 14
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: 'Inter', size: 13, weight: 600 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          cornerRadius: 8
        }
      },
      cutout: '68%'
    }
  });
}

window.acceptIncidentFromDashboard = async function(reportId) {
  const formData = new FormData();
  formData.append('action', 'update_status');
  formData.append('report_id', reportId);
  formData.append('status', 'responding');
  formData.append('notes', 'Accepted by emergency responder from dashboard.');

  try {
    const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.status === 'success') {
      initDashboard();
    } else {
      alert(json.message);
    }
  } catch (e) {
    alert('Network error accepting incident.');
  }
};

window.displayIncomingReportsContent = function() {
  const contentEl = document.querySelector('.content');
  if (!contentEl) {
    window.location.href = 'incorming-report.php';
    return;
  }
  if (typeof window.getIncomingReportsHTML === 'function') {
    contentEl.innerHTML = window.getIncomingReportsHTML();
    const pageTitleH2 = document.querySelector('.page-title h2');
    const pageTitleP = document.querySelector('.page-title p');
    if (pageTitleH2) pageTitleH2.textContent = 'Incoming Reports';
    if (pageTitleP) pageTitleP.textContent = 'Manage and respond to emergency reports submitted via USSD in real-time';
    
    // Update active nav
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') && item.getAttribute('href').includes('incorming-report')) {
        item.classList.add('active');
      }
    });

    if (typeof window.initIncomingReports === 'function') {
      window.initIncomingReports();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.location.href = 'incorming-report.php';
  }
};

function renderTimeline(items, container) {
  if (!container) return;
  if (!items || items.length === 0) {
    container.innerHTML = '<p style="padding: 20px; color: var(--text-muted); text-align: center;">No recent activities.</p>';
    return;
  }

  container.innerHTML = items.slice(0, 5).map(i => `
    <div class="timeline-item">
      <div class="timeline-dot ${i.priority === 'critical' ? 'red' : 'green'}">
        <i data-lucide="${i.priority === 'critical' ? 'alert-triangle' : 'activity'}"></i>
      </div>
      <div class="timeline-content">
        <div class="timeline-title"><span>${escapeHTML(i.report_code || ('RL-' + i.id))}</span> (${escapeHTML(capitalize(i.status))})</div>
        <div class="timeline-desc">${escapeHTML(i.description || '')}</div>
        <div class="timeline-time">${formatTimeAgo(i.created_at)}</div>
      </div>
    </div>
  `).join('');
}

function getTypeIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('fire')) return 'flame';
  if (t.includes('accident')) return 'car';
  if (t.includes('medical')) return 'heart-pulse';
  if (t.includes('security')) return 'shield-alert';
  if (t.includes('flood')) return 'waves';
  return 'alert-circle';
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function refreshIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}
