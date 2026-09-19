/**
 * RescueLine - Respondent Dashboard & Navigation Script
 * Handles UI interactions, filters, charts, theme toggling, and seamless instant page switching.
 */

// Dashboard template generator for instant switching
window.getDashboardHTML = function() {
  return `
    <!-- WELCOME BANNER -->
    <div class="welcome-card">
      <div class="welcome-left">
        <div class="welcome-avatar">AA</div>
        <div class="welcome-info">
          <h3>Welcome back, Abdulrauf 👋</h3>
          <p>You have <strong style="color: var(--green);">5 active emergency reports</strong> requiring attention.</p>
          <div class="status-line">
            <span class="status-indicator"><span class="status-dot"></span> You are ONLINE</span>
            <span>Last active: Just now</span>
          </div>
        </div>
      </div>
      <button class="btn btn-danger" id="offlineBtn">
        <i data-lucide="wifi-off"></i>
        Go Offline
      </button>
    </div>

    <!-- KEY METRICS / STATS GRID -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon green"><i data-lucide="inbox"></i></div>
          <span class="stat-trend">+4 today</span>
        </div>
        <div class="stat-value">12</div>
        <div class="stat-label">New Reports</div>
        <div class="stat-sub">4 received today</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon green"><i data-lucide="activity"></i></div>
          <span class="stat-trend red">2 urgent</span>
        </div>
        <div class="stat-value">5</div>
        <div class="stat-label">Active Responses</div>
        <div class="stat-sub">Currently being handled</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon green"><i data-lucide="check-circle-2"></i></div>
          <span class="stat-trend">+12%</span>
        </div>
        <div class="stat-value">18</div>
        <div class="stat-label">Resolved Today</div>
        <div class="stat-sub">12% increase</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon red"><i data-lucide="alert-octagon"></i></div>
          <span class="stat-trend red">Urgent</span>
        </div>
        <div class="stat-value" style="color: var(--red);">3</div>
        <div class="stat-label">Critical</div>
        <div class="stat-sub">Needs action</div>
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
          <a href="incorming-report.php" class="card-link" onclick="if(window.RescueNav) { window.RescueNav.navigateTo('incorming-report.php', 'incoming_reports'); return false; }">View All <i data-lucide="arrow-right"></i></a>
        </div>

        <div class="filter-bar">
          <div class="search-box">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" placeholder="Search reports..." id="searchInput" autocomplete="off" />
          </div>
          <select class="filter-select" id="priorityFilter" aria-label="Filter by priority">
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
          <select class="filter-select" id="typeFilter" aria-label="Filter by emergency type">
            <option value="">All Types</option>
            <option value="Fire">Fire</option>
            <option value="Accident">Accident</option>
            <option value="Medical">Medical</option>
            <option value="Flood">Flood</option>
          </select>
        </div>

        <div class="table-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Emergency Type</th>
                <th>Location</th>
                <th>Time</th>
                <th>Priority</th>
                <th>Status</th>
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

    <!-- CHARTS & LOCATION BREAKDOWN -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span class="dot"></span>
            Emergency Types
          </div>
          <select class="filter-select" style="min-width: 100px;">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        </div>
        <div class="chart-wrap">
          <canvas id="emergencyChart" class="emergencyChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span class="dot"></span>
            Reports by Location
          </div>
        </div>
        <div class="location-list" id="locationList"></div>
      </div>
    </div>
  `;
};

document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================
     MOCK DATA
     ========================================================= */
  const MOCK_REPORTS = [
    { id: 'RL-0025', type: 'Fire',      location: 'Kaduna South', state: 'Kaduna', time: '2 min ago',  priority: 'critical', status: 'new' },
    { id: 'RL-0024', type: 'Accident',  location: 'Zaria',        state: 'Kaduna', time: '8 min ago',  priority: 'critical', status: 'new' },
    { id: 'RL-0023', type: 'Medical',   location: 'Chikun',       state: 'Kaduna', time: '15 min ago', priority: 'high',     status: 'new' },
    { id: 'RL-0022', type: 'Flood',     location: 'Kawo',         state: 'Kaduna', time: '25 min ago', priority: 'normal',   status: 'new' }
  ];

  const MOCK_ACTIVITY = [
    { id: 'RL-0021', desc: 'Report resolved',        time: '5 minutes ago',  color: 'green',  icon: 'check-circle-2' },
    { id: 'RL-0022', desc: 'Response started',       time: '12 minutes ago', color: 'blue',   icon: 'play-circle' },
    { id: 'RL-0023', desc: 'Report accepted',        time: '18 minutes ago', color: 'orange', icon: 'clipboard-check' },
    { id: 'RL-0024', desc: 'New emergency received', time: '25 minutes ago', color: 'red',    icon: 'alert-triangle' }
  ];

  const MOCK_LOCATIONS = [
    { name: 'Kaduna State',   count: 42 },
    { name: 'Kano State',     count: 31 },
    { name: 'FCT Abuja',      count: 27 },
    { name: 'Niger State',    count: 18 },
    { name: 'Plateau State',  count: 14 },
    { name: 'Other',          count: 9  }
  ];

  const CHART_DATA = {
    labels: ['Fire', 'Accident', 'Medical', 'Security', 'Flood', 'Other'],
    values: [32, 24, 18, 15, 8, 5]
  };

  /* Helper functions */
  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  /* =========================================================
     THEME TOGGLE
     ========================================================= */
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const savedTheme = localStorage.getItem('rl-theme') || 'dark';

  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('rl-theme', next);
      updateThemeIcon(next);
      renderChart();
    });
  }

  function updateThemeIcon(theme) {
    if (!themeIcon) return;
    themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    refreshIcons();
  }

  /* =========================================================
     SIDEBAR TOGGLE (Mobile)
     ========================================================= */
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

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  /* =========================================================
     NOTIFICATION DROPDOWN
     ========================================================= */
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

  /* =========================================================
     DASHBOARD VIEW INITIALIZER
     ========================================================= */
  let emergencyChart = null;

  function renderChart() {
    const canvas = document.querySelector('.emergencyChart') || document.getElementById('emergencyChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    if (emergencyChart) {
      emergencyChart.destroy();
      emergencyChart = null;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#9AA7A0' : '#6B7770';
    const cardBg = isDark ? '#121A17' : '#FFFFFF';

    emergencyChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: CHART_DATA.labels,
        datasets: [{
          label: 'Reports',
          data: CHART_DATA.values,
          backgroundColor: [
            '#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#14B8A6', '#94A3B8'
          ],
          borderColor: cardBg,
          borderWidth: 2,
          hoverOffset: 6,
          borderRadius: 4
        }]
      },
      options: {
        cutout: '68%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: textColor,
              font: { size: 11, weight: '500' },
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#121A17' : '#FFFFFF',
            titleColor: isDark ? '#F5F7F6' : '#17211B',
            bodyColor: isDark ? '#C9D2CD' : '#4A5650',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return ` ${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  function initDashboardWidgets() {
    const reportsBody = document.getElementById('reportsBody');
    const reportCards = document.getElementById('reportCards');

    function getIconForType(type) {
      const map = {
        'Fire': 'flame',
        'Accident': 'car',
        'Medical': 'heart-pulse',
        'Flood': 'waves',
        'Security': 'shield-alert'
      };
      return map[type] || 'alert-circle';
    }

    function getTypeClass(type) {
      return (type || '').toLowerCase();
    }

    function renderReports(reports) {
      if (!reports || reports.length === 0) {
        const emptyHtml = `
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <i data-lucide="inbox"></i>
                <p>No emergency reports found.</p>
              </div>
            </td>
          </tr>
        `;
        if (reportsBody) reportsBody.innerHTML = emptyHtml;
        if (reportCards) {
          reportCards.innerHTML = `
            <div class="empty-state">
              <i data-lucide="inbox"></i>
              <p>No emergency reports found.</p>
            </div>
          `;
        }
        refreshIcons();
        return;
      }

      if (reportsBody) {
        reportsBody.innerHTML = reports.map(r => `
          <tr>
            <td><span class="report-id">${escapeHTML(r.id)}</span></td>
            <td>
              <div class="emergency-type ${escapeHTML(getTypeClass(r.type))}">
                <i data-lucide="${escapeHTML(getIconForType(r.type))}"></i>
                ${escapeHTML(r.type)}
              </div>
            </td>
            <td>
              <div class="location-text">
                <span class="primary">${escapeHTML(r.location)}</span>
                <span class="secondary">${escapeHTML(r.state)}</span>
              </div>
            </td>
            <td><span class="time-text">${escapeHTML(r.time)}</span></td>
            <td><span class="priority-badge ${escapeHTML(r.priority)}">${escapeHTML(capitalize(r.priority))}</span></td>
            <td><span class="status-badge ${escapeHTML(r.status)}">${escapeHTML(capitalize(r.status))}</span></td>
            <td>
              <a href="report-details.php?id=${encodeURIComponent(r.id)}" class="view-btn">
                View <i data-lucide="arrow-right"></i>
              </a>
            </td>
          </tr>
        `).join('');
      }

      if (reportCards) {
        reportCards.innerHTML = reports.map(r => `
          <div class="report-card-item">
            <div class="report-card-top">
              <span class="report-card-id">${escapeHTML(r.id)}</span>
              <span class="priority-badge ${escapeHTML(r.priority)}">${escapeHTML(capitalize(r.priority))}</span>
            </div>
            <div class="report-card-body">
              <div class="report-card-field">
                <div class="label">Type</div>
                <div class="value emergency-type ${escapeHTML(getTypeClass(r.type))}">
                  <i data-lucide="${escapeHTML(getIconForType(r.type))}"></i> ${escapeHTML(r.type)}
                </div>
              </div>
              <div class="report-card-field">
                <div class="label">Location</div>
                <div class="value">${escapeHTML(r.location)}, ${escapeHTML(r.state)}</div>
              </div>
              <div class="report-card-field">
                <div class="label">Time</div>
                <div class="value">${escapeHTML(r.time)}</div>
              </div>
              <div class="report-card-field">
                <div class="label">Status</div>
                <div class="value"><span class="status-badge ${escapeHTML(r.status)}">${escapeHTML(capitalize(r.status))}</span></div>
              </div>
            </div>
            <div class="report-card-actions">
              <a href="report-details.php?id=${encodeURIComponent(r.id)}" class="view-btn">
                View Details <i data-lucide="arrow-right"></i>
              </a>
            </div>
          </div>
        `).join('');
      }

      refreshIcons();
    }

    renderReports(MOCK_REPORTS);

    // Search and filters
    const searchInput = document.getElementById('searchInput');
    const priorityFilter = document.getElementById('priorityFilter');
    const typeFilter = document.getElementById('typeFilter');

    function applyFilters() {
      const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const p = priorityFilter ? priorityFilter.value : '';
      const t = typeFilter ? typeFilter.value : '';

      const filtered = MOCK_REPORTS.filter(r => {
        const matchQ = !q || 
          r.id.toLowerCase().includes(q) || 
          r.type.toLowerCase().includes(q) || 
          r.location.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q);
        const matchP = !p || r.priority === p;
        const matchT = !t || r.type === t;
        return matchQ && matchP && matchT;
      });

      renderReports(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);

    // Timeline
    const timeline = document.getElementById('timeline');
    if (timeline) {
      timeline.innerHTML = MOCK_ACTIVITY.map(a => `
        <div class="timeline-item">
          <div class="timeline-dot ${escapeHTML(a.color)}">
            <i data-lucide="${escapeHTML(a.icon)}"></i>
          </div>
          <div class="timeline-content">
            <div class="timeline-title"><span>${escapeHTML(a.id)}</span></div>
            <div class="timeline-desc">${escapeHTML(a.desc)}</div>
            <div class="timeline-time">${escapeHTML(a.time)}</div>
          </div>
        </div>
      `).join('');
    }

    // Location bars
    const locationList = document.getElementById('locationList');
    if (locationList) {
      const maxCount = Math.max(...MOCK_LOCATIONS.map(l => l.count), 1);
      locationList.innerHTML = MOCK_LOCATIONS.map(l => {
        const pct = (l.count / maxCount) * 100;
        return `
          <div class="location-item">
            <div class="location-top">
              <span class="location-name">${escapeHTML(l.name)}</span>
              <span class="location-count">${escapeHTML(l.count)}</span>
            </div>
            <div class="location-bar">
              <div class="location-bar-fill" style="width: 0%;" data-width="${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

      setTimeout(() => {
        document.querySelectorAll('.location-bar-fill').forEach(el => {
          el.style.width = el.dataset.width;
        });
      }, 100);
    }

    // Online/Offline Button
    const offlineBtn = document.getElementById('offlineBtn');
    let isOnline = true;

    if (offlineBtn) {
      offlineBtn.addEventListener('click', () => {
        isOnline = !isOnline;
        const dot = document.querySelector('.status-dot');
        const indicator = document.querySelector('.status-indicator');

        if (isOnline) {
          offlineBtn.innerHTML = '<i data-lucide="wifi-off"></i> Go Offline';
          offlineBtn.classList.remove('btn-primary');
          offlineBtn.classList.add('btn-danger');
          if (indicator) {
            indicator.innerHTML = '<span class="status-dot"></span> You are ONLINE';
            indicator.style.color = 'var(--green)';
          }
          if (dot) {
            dot.style.background = 'var(--green)';
            dot.style.boxShadow = '0 0 0 3px var(--green-soft)';
          }
        } else {
          offlineBtn.innerHTML = '<i data-lucide="wifi"></i> Go Online';
          offlineBtn.classList.remove('btn-danger');
          offlineBtn.classList.add('btn-primary');
          if (indicator) {
            indicator.innerHTML = '<span class="status-dot" style="background: var(--muted); box-shadow: 0 0 0 3px rgba(154,167,160,0.2); animation: none;"></span> You are OFFLINE';
            indicator.style.color = 'var(--muted)';
          }
        }
        refreshIcons();
      });
    }

    renderChart();
    refreshIcons();
  }

  /* Export initializer */
  window.initDashboard = initDashboardWidgets;

  /* =========================================================
     INSTANT PAGE SWITCHER & NAVIGATION
     ========================================================= */
  function updateSidebarActive(pageKey) {
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      item.classList.remove('active');
    });

    let targetLink = null;
    if (pageKey === 'dashboard') {
      targetLink = document.querySelector('.sidebar a[href*="dashboard.php"]');
    } else if (pageKey === 'incoming_reports' || pageKey === 'incorming-report') {
      targetLink = document.querySelector('.sidebar a[href*="incorming-report"]') || 
                   document.querySelector('.sidebar a[href*="incoming-reports"]');
    }

    if (targetLink) {
      targetLink.classList.add('active');
      const parentSub = targetLink.closest('.nav-sub');
      if (parentSub) {
        const parentTrigger = parentSub.previousElementSibling;
        if (parentTrigger && parentTrigger.classList.contains('nav-item')) {
          parentTrigger.classList.add('active');
        }
      }
    }
  }

  function displayIncomingReportsContent() {
    const target = document.querySelector('.content');
    if (!target) return;

    // 1. Ensure incoming reports stylesheet is present
    if (!document.getElementById('css-incoming-reports')) {
      const link = document.createElement('link');
      link.id = 'css-incoming-reports';
      link.rel = 'stylesheet';
      link.href = '../assets/css/respondant/incorming-report.css';
      document.head.appendChild(link);
    }

    // 2. Render Incoming Reports template HTML directly (Instant, Zero Network Failure)
    if (typeof window.getIncomingReportsHTML === 'function') {
      target.innerHTML = window.getIncomingReportsHTML();
    }

    // 3. Update Topnav title
    const pageTitleH2 = document.querySelector('.page-title h2');
    const pageTitleP = document.querySelector('.page-title p');
    if (pageTitleH2) pageTitleH2.textContent = 'Incoming Reports';
    if (pageTitleP) pageTitleP.textContent = 'Manage and respond to emergency reports submitted via USSD';

    // 4. Update sidebar active item
    updateSidebarActive('incoming_reports');

    // 5. Initialize script logic
    if (typeof window.initIncomingReports === 'function') {
      window.initIncomingReports();
    } else {
      const script = document.createElement('script');
      script.src = '../assets/js/respondant/incorming-report.js';
      script.onload = () => {
        if (typeof window.initIncomingReports === 'function') {
          window.initIncomingReports();
        }
      };
      document.body.appendChild(script);
    }

    refreshIcons();
  }

  function displayDashboardContent() {
    const target = document.querySelector('.content');
    if (!target) return;

    if (typeof window.getDashboardHTML === 'function') {
      target.innerHTML = window.getDashboardHTML();
    }

    const pageTitleH2 = document.querySelector('.page-title h2');
    const pageTitleP = document.querySelector('.page-title p');
    if (pageTitleH2) pageTitleH2.textContent = 'Dashboard';
    if (pageTitleP) pageTitleP.textContent = 'Emergency response overview';

    updateSidebarActive('dashboard');
    initDashboardWidgets();
    refreshIcons();
  }

  function navigateTo(url, pageKey, updateHistory = true) {
    if (pageKey === 'incoming_reports' || url.includes('incorming-report') || url.includes('incoming-reports')) {
      displayIncomingReportsContent();
      if (updateHistory) {
        window.history.pushState({ page: 'incoming_reports', url: 'incorming-report.php' }, '', 'incorming-report.php');
      }
    } else {
      displayDashboardContent();
      if (updateHistory) {
        window.history.pushState({ page: 'dashboard', url: 'dashboard.php' }, '', 'dashboard.php');
      }
    }
  }

  // Export navigation router to window
  window.RescueNav = {
    navigateTo: navigateTo,
    displayIncomingReportsContent: displayIncomingReportsContent,
    displayDashboardContent: displayDashboardContent
  };

  // Attach click listener to sidebar links
  document.querySelectorAll('.sidebar .nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript') || href.includes('logout.php')) return;

      if (href.includes('incorming-report') || href.includes('incoming-reports') || href.includes('dashboard.php')) {
        e.preventDefault();
        closeSidebar();
        const pageKey = href.includes('dashboard') ? 'dashboard' : 'incoming_reports';
        navigateTo(href, pageKey, true);
      }
    });
  });

  // Browser Back / Forward Button Handling
  window.addEventListener('popstate', (e) => {
    const path = window.location.pathname;
    if (path.includes('incorming-report') || path.includes('incoming-reports')) {
      navigateTo('incorming-report.php', 'incoming_reports', false);
    } else {
      navigateTo('dashboard.php', 'dashboard', false);
    }
  });

  /* =========================================================
     PAGE BOOTSTRAP DETERMINATION
     ========================================================= */
  const incomingContainer = document.getElementById('incomingReportsContainer');
  const emergencyChartEl = document.getElementById('emergencyChart');

  if (incomingContainer) {
    // Current page is Incoming Reports
    updateSidebarActive('incoming_reports');
    if (typeof window.initIncomingReports === 'function') {
      window.initIncomingReports();
    }
  } else if (emergencyChartEl || document.querySelector('.welcome-card')) {
    // Current page is Dashboard
    updateSidebarActive('dashboard');
    initDashboardWidgets();
  }

  refreshIcons();
});
