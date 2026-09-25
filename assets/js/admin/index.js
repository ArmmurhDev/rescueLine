/**
 * RescueLine - Admin Dashboard Scripts (Real-time DB Connection)
 * Handles charts, theme switching, responsive sidebar, notifications, and live database rendering.
 */

// Global state & chart references
let typeChart = null;
let trendChart = null;
let dashboardData = {
  counts: { total: 0, pending: 0, responding: 0, resolved: 0 },
  states: [],
  types: [],
  trends: [],
  notifications: []
};

/* =========================================================
   INITIALIZATION
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initNotifications();
  initTrendFilter();
  loadDashboardData();
});

/* =========================================================
   DATA LOADING (REAL-TIME API)
   ========================================================= */
async function loadDashboardData() {
  const trendDays = document.getElementById('trendRange')?.value || 30;
  try {
    const res = await fetch(`../api/dashboard.php?action=admin_stats&days=${trendDays}`);
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      dashboardData = json.data;
      updateStatCards(dashboardData.counts);
      renderStates(dashboardData.states);
      renderCharts(dashboardData.types, dashboardData.trends);
      renderNotifications(dashboardData.notifications);
    }
  } catch (err) {
    console.error('Error fetching real-time dashboard metrics:', err);
  }
}

/* =========================================================
   UPDATE STAT CARDS
   ========================================================= */
function updateStatCards(counts) {
  const totalEl = document.querySelector('.stat-card.total .stat-value');
  const pendingEl = document.querySelector('.stat-card.pending .stat-value');
  const respondingEl = document.querySelector('.stat-card.responding .stat-value');
  const resolvedEl = document.querySelector('.stat-card.resolved .stat-value');

  if (totalEl) totalEl.textContent = Number(counts.total || 0).toLocaleString();
  if (pendingEl) pendingEl.textContent = Number(counts.pending || 0).toLocaleString();
  if (respondingEl) respondingEl.textContent = Number(counts.responding || 0).toLocaleString();
  if (resolvedEl) resolvedEl.textContent = Number(counts.resolved || 0).toLocaleString();

  // Resolution rate
  const resRateEl = document.querySelector('.stat-card.resolved .stat-sub');
  if (resRateEl && counts.total > 0) {
    const rate = ((counts.resolved / counts.total) * 100).toFixed(1);
    resRateEl.textContent = `${rate}% resolution rate`;
  }
}

/* =========================================================
   THEME TOGGLE
   ========================================================= */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('rl-admin-theme') || 'dark';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('rl-admin-theme', next);
      updateThemeIcon(next);
      if (dashboardData.types && dashboardData.trends) {
        renderCharts(dashboardData.types, dashboardData.trends);
      }
    });
  }
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    initIcons();
  }
}

/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('overlay');

  if (hamburger && sidebar && overlay) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });

    overlay.addEventListener('click', closeSidebar);
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

/* =========================================================
   NOTIFICATIONS DROPDOWN
   ========================================================= */
function initNotifications() {
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.remove('open');
      }
    });
  }

  const markAllBtn = document.querySelector('.notif-header span');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      try {
        await fetch('../api/notifications.php?action=mark_all_read', { method: 'POST' });
        loadDashboardData();
      } catch (e) {
        console.error(e);
      }
    });
  }
}

function renderNotifications(notifs) {
  const list = document.querySelector('.notif-list');
  const badge = document.querySelector('#notifBtn .badge');
  if (!list) return;

  if (!notifs || notifs.length === 0) {
    list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No new notifications</div>';
    if (badge) badge.style.display = 'none';
    return;
  }

  const unread = notifs.filter(n => !n.is_read).length;
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'inline-flex' : 'none';
  }

  list.innerHTML = notifs.map(n => {
    const iconColor = n.type === 'critical' ? 'red' : (n.type === 'warning' ? 'orange' : (n.type === 'success' ? 'green' : 'blue'));
    const timeAgo = formatTimeAgo(n.created_at);
    return `
      <div class="notif-item ${n.is_read ? '' : 'unread'}">
        <div class="notif-icon ${iconColor}"><i data-lucide="${n.icon || 'bell'}"></i></div>
        <div class="notif-content">
          <div class="title">${escapeHTML(n.title)}</div>
          <div class="desc">${escapeHTML(n.message)}</div>
          <div class="time">${timeAgo}</div>
        </div>
      </div>
    `;
  }).join('');

  initIcons();
}

/* =========================================================
   RENDER STATE TABLE
   ========================================================= */
function renderStates(states) {
  const stateBody = document.getElementById('stateBody');
  if (!stateBody) return;

  if (!states || states.length === 0) {
    stateBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">No state reports recorded yet.</td></tr>';
    return;
  }

  const maxTotal = Math.max(...states.map(s => Number(s.total) || 0), 1);

  stateBody.innerHTML = states.map(s => {
    const total = Number(s.total) || 0;
    const pending = Number(s.pending) || 0;
    const responding = Number(s.responding) || 0;
    const resolved = Number(s.resolved) || 0;
    const pct = ((total / maxTotal) * 100).toFixed(0);

    return `
      <tr>
        <td>
          <div class="state-name">
            <span class="state-flag"></span>
            ${escapeHTML(s.state)}
          </div>
        </td>
        <td><span class="state-total">${total}</span></td>
        <td><span class="status-pill pending">${pending}</span></td>
        <td><span class="status-pill responding">${responding}</span></td>
        <td><span class="status-pill resolved">${resolved}</span></td>
        <td class="bar-cell">
          <div class="bar-wrap">
            <div class="bar-fill" style="width: ${pct}%"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* =========================================================
   TREND FILTER
   ========================================================= */
function initTrendFilter() {
  const range = document.getElementById('trendRange');
  if (range) {
    range.addEventListener('change', () => {
      loadDashboardData();
    });
  }
}

/* =========================================================
   CHARTS (Chart.js)
   ========================================================= */
function renderCharts(types, trends) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  // 1. Donut Chart - Reports by Category
  const typeCanvas = document.getElementById('typeChart');
  if (typeCanvas && types && types.length > 0) {
    if (typeChart) typeChart.destroy();

    const labels = types.map(t => t.name);
    const data = types.map(t => Number(t.count) || 0);
    const colors = types.map(t => t.color || '#3b82f6');

    typeChart = new Chart(typeCanvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data.every(v => v === 0) ? [1] : data,
          backgroundColor: data.every(v => v === 0) ? ['#334155'] : colors,
          borderWidth: 2,
          borderColor: isDark ? '#161D2F' : '#FFFFFF',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} reports`
            }
          }
        }
      }
    });

    renderTypeLegend(types);
  }

  // 2. Line Chart - Response Time Trend
  const trendCanvas = document.getElementById('trendChart');
  if (trendCanvas) {
    if (trendChart) trendChart.destroy();

    const trendLabels = (trends && trends.length > 0) ? trends.map(t => formatDateShort(t.report_date)) : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
    const trendValues = (trends && trends.length > 0) ? trends.map(t => Math.round(Number(t.avg_response_time) || 20)) : [25, 22, 28, 20, 18];
    const targetValues = new Array(trendLabels.length).fill(15);

    trendChart = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [
          {
            label: 'Avg Response Time (min)',
            data: trendValues,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#3B82F6'
          },
          {
            label: 'SLA Target (15 min)',
            data: targetValues,
            borderColor: 'rgba(239, 68, 68, 0.6)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } }
          },
          y: {
            min: 0,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11 },
              callback: (v) => `${v}m`
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { color: textColor, boxWidth: 12, usePointStyle: true }
          }
        }
      }
    });
  }
}

function renderTypeLegend(types) {
  const legend = document.getElementById('typeLegend');
  if (!legend || !types) return;

  const total = types.reduce((acc, t) => acc + (Number(t.count) || 0), 0) || 1;

  legend.innerHTML = types.map(t => {
    const count = Number(t.count) || 0;
    const pct = Math.round((count / total) * 100);
    return `
      <div class="legend-item">
        <span class="legend-dot" style="background-color: ${t.color}"></span>
        <span class="legend-label">${escapeHTML(t.name)}</span>
        <span class="legend-val">${count} <small>(${pct}%)</small></span>
      </div>
    `;
  }).join('');
}

/* =========================================================
   HELPERS & FORMATTERS
   ========================================================= */
function initIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}
