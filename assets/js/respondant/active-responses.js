/**
 * RescueLine - Active Responses Script (Real-time DB Connection)
 * Handles live response monitoring, timers, cards & table view switching against MySQL database.
 */

// Template generator for instant client-side rendering
window.getActiveResponsesHTML = function() {
  return `
    <div class="page-container" id="activeResponsesContainer">

      <!-- PAGE HEADER -->
      <div class="page-header">
        <div class="page-header-left">
          <h1>
            Active Responses
            <span class="live-dot" title="Live"></span>
          </h1>
          <p>Monitor and manage ongoing emergency responses in real-time</p>
        </div>
        <div class="page-header-actions">
          <button type="button" class="btn btn-primary" onclick="window.initActiveResponses && window.initActiveResponses()">
            <i data-lucide="refresh-cw"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- STATS ROW -->
      <div class="stats-row">
        <div class="stat-mini green">
          <div class="stat-mini-icon green"><i data-lucide="activity"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statActiveTotal">0</div>
            <div class="label">Active Responses</div>
          </div>
        </div>
        <div class="stat-mini red">
          <div class="stat-mini-icon red"><i data-lucide="alert-triangle"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statActiveCritical">0</div>
            <div class="label">Urgent / Critical</div>
          </div>
        </div>
        <div class="stat-mini orange">
          <div class="stat-mini-icon orange"><i data-lucide="map-pin"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statActiveOnScene">0</div>
            <div class="label">On Scene / Responding</div>
          </div>
        </div>
        <div class="stat-mini blue">
          <div class="stat-mini-icon blue"><i data-lucide="clock"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statActiveAvgTime">15m</div>
            <div class="label">Avg Target Time</div>
          </div>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div class="filter-card">
        <div class="filter-bar">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search by ID, location, or respondent..." id="searchInput" autocomplete="off" />
          </div>
          <select class="filter-select" id="priorityFilter" aria-label="Filter by priority">
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <!-- ACTIVE RESPONSES TABLE -->
      <div class="table-card" id="tableView">
        <div class="table-wrap">
          <table class="responses-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

async function initActiveResponses() {
  const tableBody = document.getElementById('tableBody');

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

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function escapeHTML(str) {
    if (!str) return '';
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

  let activeList = [];

  async function loadData() {
    try {
      const res = await fetch('../api/reports.php?action=list&status=responding');
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        activeList = json.data.reports || [];
        renderTable(activeList);
        updateActiveStats(activeList);
      }
    } catch (e) {
      console.error('Error fetching active responses:', e);
    }
  }

  function updateActiveStats(list) {
    const totalEl = document.getElementById('statActiveTotal');
    const critEl = document.getElementById('statActiveCritical');
    const sceneEl = document.getElementById('statActiveOnScene');

    if (totalEl) totalEl.textContent = list.length;
    if (critEl) critEl.textContent = list.filter(r => r.priority === 'critical').length;
    if (sceneEl) sceneEl.textContent = list.length;
  }

  function renderTable(list) {
    if (!tableBody) return;

    if (!list || list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i data-lucide="check-circle-2"></i>
              <h3>No Active Incidents</h3>
              <p>All emergency assignments have been resolved or are currently queued.</p>
            </div>
          </td>
        </tr>
      `;
      refreshIcons();
      return;
    }

    tableBody.innerHTML = list.map(r => `
      <tr>
        <td><span class="report-id">${escapeHTML(r.reportCode || ('RL-' + r.id))}</span></td>
        <td>
          <div class="emergency-type ${(r.type || '').toLowerCase().replace(/[^a-z0-9]/g, '')}">
            <i data-lucide="${getIconForType(r.type)}"></i>
            ${escapeHTML(r.type)}
          </div>
        </td>
        <td>
          <div class="location-text">
            <span class="primary">${escapeHTML(r.landmark || r.lga)}</span>
            <span class="secondary">${escapeHTML(r.state)}</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${r.status}">
            <span class="status-dot"></span>
            ${capitalize(r.status)}
          </span>
        </td>
        <td>
          <span class="priority-badge ${r.priority}">
            ${capitalize(r.priority)}
          </span>
        </td>
        <td>
          <a href="report-details.php?id=${r.id}" class="btn btn-secondary btn-sm">
            <i data-lucide="eye"></i> View
          </a>
        </td>
      </tr>
    `).join('');

    refreshIcons();
  }

  window.markComplete = async function(id) {
    const note = prompt('Enter resolution summary:');
    if (note === null) return;

    const formData = new FormData();
    formData.append('action', 'update_status');
    formData.append('report_id', id);
    formData.append('status', 'resolved');
    formData.append('notes', note || 'Incident successfully resolved on scene.');

    try {
      const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.status === 'success') {
        alert('Incident marked as resolved.');
        loadData();
      } else {
        alert(json.message);
      }
    } catch (e) {
      alert('Network error updating status.');
    }
  };

  const searchInput = document.getElementById('searchInput');
  const priorityFilter = document.getElementById('priorityFilter');

  function filterActive() {
    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const p = priorityFilter ? priorityFilter.value : '';

    const filtered = activeList.filter(r => {
      const matchQ = !q || (r.reportCode && r.reportCode.toLowerCase().includes(q)) || (r.type && r.type.toLowerCase().includes(q)) || (r.landmark && r.landmark.toLowerCase().includes(q));
      const matchP = !p || r.priority === p;
      return matchQ && matchP;
    });

    renderTable(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', filterActive);
  if (priorityFilter) priorityFilter.addEventListener('change', filterActive);

  loadData();

  if (window._activePollInterval) {
    clearInterval(window._activePollInterval);
  }
  window._activePollInterval = setInterval(() => {
    if (document.getElementById('tableBody') && document.getElementById('activeResponsesContainer')) {
      loadData();
    }
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('activeResponsesContainer') || document.querySelector('.responses-table')) {
    initActiveResponses();
  }
});
