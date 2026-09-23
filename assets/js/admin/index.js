/**
 * RescueLine - Admin Dashboard Scripts
 * Handles charts, theme switching, responsive sidebar, notifications, and data rendering.
 */

/* =========================================================
   MOCK DATA
   (Replace with backend API calls as endpoints become available)
   ========================================================= */
const MOCK_STATES = [
  { state: 'Kaduna',    total: 342, pending: 28, responding: 12, resolved: 302 },
  { state: 'Kano',      total: 287, pending: 18, responding: 8,  resolved: 261 },
  { state: 'FCT Abuja', total: 234, pending: 15, responding: 6,  resolved: 213 },
  { state: 'Lagos',     total: 198, pending: 12, responding: 4,  resolved: 182 },
  { state: 'Niger',     total: 156, pending: 8,  responding: 3,  resolved: 145 },
  { state: 'Plateau',   total: 124, pending: 5,  responding: 1,  resolved: 118 },
  { state: 'Oyo',       total: 98,  pending: 4,  responding: 0,  resolved: 94  },
  { state: 'Rivers',    total: 87,  pending: 2,  responding: 0,  resolved: 85  }
];

const MOCK_TYPES = {
  labels: ['Fire', 'Accident', 'Medical', 'Security', 'Flood', 'Other'],
  values: [324, 258, 198, 167, 92, 48],
  colors: ['#E53935', '#F59E0B', '#3B82F6', '#8B5CF6', '#06B6D4', '#9AA7A0'],
  icons: ['flame', 'car', 'heart-pulse', 'shield-alert', 'waves', 'more-horizontal']
};

const MOCK_TREND = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
  responseTime: [42, 38, 35, 31, 28, 26, 24, 22],
  target: [30, 30, 30, 30, 30, 30, 30, 30]
};

// Global chart references for re-render on theme change
let typeChart = null;
let trendChart = null;

/* =========================================================
   INITIALIZATION
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initNotifications();
  renderStates();
  renderCharts();
  initIcons();
});

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
      renderCharts();
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
   SIDEBAR NAVIGATION (Responsive)
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
}

/* =========================================================
   RENDER STATE TABLE
   ========================================================= */
function renderStates() {
  const stateBody = document.getElementById('stateBody');
  if (!stateBody) return;

  const maxTotal = Math.max(...MOCK_STATES.map(s => s.total));

  stateBody.innerHTML = MOCK_STATES.map(s => {
    const pct = (s.total / maxTotal) * 100;
    return `
      <tr>
        <td>
          <div class="state-name">
            <span class="state-flag"></span>
            ${s.state}
          </div>
        </td>
        <td><span class="state-total">${s.total}</span></td>
        <td><span class="status-pill pending">${s.pending}</span></td>
        <td><span class="status-pill responding">${s.responding}</span></td>
        <td><span class="status-pill resolved">${s.resolved}</span></td>
        <td class="bar-cell">
          <div class="bar-wrap">
            <div class="bar"><div class="bar-fill" style="width: 0%;" data-width="${pct}%"></div></div>
            <span class="bar-value">${Math.round(pct)}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Animate progress bars
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(el => {
      el.style.width = el.dataset.width;
    });
  }, 100);
}

/* =========================================================
   CHARTS (Chart.js)
   ========================================================= */
function renderCharts() {
  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#9AA7A0' : '#6B7770';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';

  // Destroy existing charts if re-rendering
  if (typeChart) typeChart.destroy();
  if (trendChart) trendChart.destroy();

  /* ---- TYPE CHART (Donut) ---- */
  const typeCanvas = document.getElementById('typeChart');
  if (typeCanvas) {
    const typeCtx = typeCanvas.getContext('2d');
    typeChart = new Chart(typeCtx, {
      type: 'doughnut',
      data: {
        labels: MOCK_TYPES.labels,
        datasets: [{
          data: MOCK_TYPES.values,
          backgroundColor: MOCK_TYPES.colors,
          borderColor: isDark ? '#121A17' : '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#121A17' : '#FFFFFF',
            titleColor: isDark ? '#F5F7F6' : '#17211B',
            bodyColor: isDark ? '#C9D2CD' : '#4A5650',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed} reports`
            }
          }
        }
      }
    });

    // Render legend
    const legendEl = document.getElementById('typeLegend');
    if (legendEl) {
      const total = MOCK_TYPES.values.reduce((a, b) => a + b, 0);
      legendEl.innerHTML = MOCK_TYPES.labels.map((label, i) => {
        const pct = ((MOCK_TYPES.values[i] / total) * 100).toFixed(1);
        return `
          <div class="legend-item">
            <div class="legend-left">
              <span class="legend-dot" style="background: ${MOCK_TYPES.colors[i]};"></span>
              <span class="legend-label">${label}</span>
            </div>
            <span class="legend-value">${MOCK_TYPES.values[i]} <span style="color: var(--muted); font-weight: 500; font-size: 11px;">(${pct}%)</span></span>
          </div>
        `;
      }).join('');
    }
  }

  /* ---- TREND CHART (Line) ---- */
  const trendCanvas = document.getElementById('trendChart');
  if (trendCanvas) {
    const trendCtx = trendCanvas.getContext('2d');

    // Create gradient
    const gradient = trendCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 135, 81, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 135, 81, 0)');

    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: MOCK_TREND.labels,
        datasets: [
          {
            label: 'Avg Response Time (min)',
            data: MOCK_TREND.responseTime,
            borderColor: '#008751',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#008751',
            pointBorderColor: isDark ? '#121A17' : '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Target (30 min)',
            data: MOCK_TREND.target,
            borderColor: '#E53935',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 4],
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: textColor,
              font: { size: 11, weight: '500' },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16
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
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} min`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11, weight: '500' } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11 },
              callback: (v) => v + ' min'
            },
            beginAtZero: true
          }
        }
      }
    });
  }
}

/* =========================================================
   LUCIDE ICONS
   ========================================================= */
function initIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}
