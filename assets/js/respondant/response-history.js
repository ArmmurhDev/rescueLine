/**
 * RescueLine - Response History JavaScript
 * Provides archive data, real-time filtering, multi-column sorting, and dynamic display area rendering.
 */

// Mock History Dataset
const MOCK_HISTORY = [
  {
    id: 'RL-0019',
    type: 'Medical',
    location: 'Barnawa, Kaduna',
    state: 'Kaduna',
    respondent: { name: 'Amina Bello', initials: 'AB' },
    received: { date: '2024-01-15', time: '10:38 AM' },
    resolved: { date: '2024-01-15', time: '11:02 AM' },
    duration: 1440, // seconds
    priority: 'normal',
    status: 'resolved'
  },
  {
    id: 'RL-0018',
    type: 'Accident',
    location: 'Kakuri, Kaduna',
    state: 'Kaduna',
    respondent: { name: 'Yusuf Danladi', initials: 'YD' },
    received: { date: '2024-01-15', time: '10:25 AM' },
    resolved: { date: '2024-01-15', time: '10:58 AM' },
    duration: 1980,
    priority: 'high',
    status: 'resolved'
  },
  {
    id: 'RL-0017',
    type: 'Flood',
    location: 'Tudun Wada, Kaduna',
    state: 'Kaduna',
    respondent: { name: 'Sani Mohammed', initials: 'SM' },
    received: { date: '2024-01-15', time: '10:12 AM' },
    resolved: { date: '2024-01-15', time: '10:45 AM' },
    duration: 1980,
    priority: 'normal',
    status: 'resolved'
  },
  {
    id: 'RL-0016',
    type: 'Security',
    location: 'Malali, Kaduna',
    state: 'Kaduna',
    respondent: { name: 'Fatima Ahmed', initials: 'FA' },
    received: { date: '2024-01-15', time: '09:58 AM' },
    resolved: { date: '2024-01-15', time: '10:35 AM' },
    duration: 2220,
    priority: 'high',
    status: 'resolved'
  },
  {
    id: 'RL-0015',
    type: 'Fire',
    location: 'Ungwan Rimi, Kaduna',
    state: 'Kaduna',
    respondent: { name: 'Musa Ibrahim', initials: 'MI' },
    received: { date: '2024-01-15', time: '09:42 AM' },
    resolved: { date: '2024-01-15', time: '10:18 AM' },
    duration: 2160,
    priority: 'critical',
    status: 'resolved'
  },
  {
    id: 'RL-0014',
    type: 'Medical',
    location: 'Kaduna South Market',
    state: 'Kaduna',
    respondent: { name: 'Amina Bello', initials: 'AB' },
    received: { date: '2024-01-14', time: '03:25 PM' },
    resolved: { date: '2024-01-14', time: '03:48 PM' },
    duration: 1380,
    priority: 'high',
    status: 'resolved'
  },
  {
    id: 'RL-0013',
    type: 'Accident',
    location: 'Zaria City',
    state: 'Kaduna',
    respondent: { name: 'Yusuf Danladi', initials: 'YD' },
    received: { date: '2024-01-14', time: '02:15 PM' },
    resolved: { date: '2024-01-14', time: '02:52 PM' },
    duration: 2220,
    priority: 'critical',
    status: 'resolved'
  },
  {
    id: 'RL-0012',
    type: 'Fire',
    location: 'Chikun LGA',
    state: 'Kaduna',
    respondent: { name: 'Musa Ibrahim', initials: 'MI' },
    received: { date: '2024-01-14', time: '01:08 PM' },
    resolved: { date: '2024-01-14', time: '01:45 PM' },
    duration: 2220,
    priority: 'critical',
    status: 'resolved'
  },
  {
    id: 'RL-0011',
    type: 'Flood',
    location: 'Kawo Area',
    state: 'Kaduna',
    respondent: { name: 'Sani Mohammed', initials: 'SM' },
    received: { date: '2024-01-14', time: '11:30 AM' },
    resolved: { date: '2024-01-14', time: '12:05 PM' },
    duration: 2100,
    priority: 'normal',
    status: 'closed'
  },
  {
    id: 'RL-0010',
    type: 'Security',
    location: 'Sabon Tasha',
    state: 'Kaduna',
    respondent: { name: 'Fatima Ahmed', initials: 'FA' },
    received: { date: '2024-01-14', time: '10:15 AM' },
    resolved: { date: '2024-01-14', time: '10:48 AM' },
    duration: 1980,
    priority: 'high',
    status: 'resolved'
  }
];

// Helper Functions
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

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function getDurationClass(seconds) {
  if (seconds < 1200) return 'fast'; // < 20 min
  if (seconds < 2400) return 'normal'; // < 40 min
  return 'slow';
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatStatus(status) {
  const map = {
    'resolved': 'Resolved',
    'closed': 'Closed'
  };
  return map[status] || capitalize(status);
}

// Navigation Helper to View Incident Details
window.viewReport = function(id) {
  if (window.RescueNav && typeof window.RescueNav.displayReportDetails === 'function') {
    window.RescueNav.displayReportDetails(id);
    if (window.history && window.history.pushState) {
      window.history.pushState({ page: 'report_details', id: id }, '', `report-details.php?id=${encodeURIComponent(id)}&mode=history`);
    }
  } else if (typeof window.displayReportDetails === 'function') {
    window.displayReportDetails(id);
    if (window.history && window.history.pushState) {
      window.history.pushState({ page: 'report_details', id: id }, '', `report-details.php?id=${encodeURIComponent(id)}&mode=history`);
    }
  } else {
    window.location.href = `report-details.php?id=${encodeURIComponent(id)}&mode=history`;
  }
};
window.viewHistoryReport = window.viewReport;

// Template Generator for Dynamic Rendering
window.getResponseHistoryHTML = function() {
  return `
  <div class="page-container" id="responseHistoryContainer">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div class="page-header-left">
        <h1>
          <i data-lucide="history" style="width: 24px; height: 24px; color: var(--green);"></i>
          Response History
        </h1>
        <p>Archive of all resolved emergency responses</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="exportBtn" type="button">
          <i data-lucide="download"></i>
          Export
        </button>
        <button class="btn btn-primary" id="refreshBtn" type="button">
          <i data-lucide="refresh-cw"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- STATS ROW -->
    <div class="stats-row">
      <div class="stat-mini green">
        <div class="stat-mini-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-mini-info">
          <div class="value">247</div>
          <div class="label">Total Resolved</div>
          <div class="trend up">↑ 18% this month</div>
        </div>
      </div>
      <div class="stat-mini blue">
        <div class="stat-mini-icon blue"><i data-lucide="clock"></i></div>
        <div class="stat-mini-info">
          <div class="value">24m</div>
          <div class="label">Avg Resolution Time</div>
          <div class="trend down">↓ 8% faster</div>
        </div>
      </div>
      <div class="stat-mini orange">
        <div class="stat-mini-icon orange"><i data-lucide="trending-up"></i></div>
        <div class="stat-mini-info">
          <div class="value">94%</div>
          <div class="label">Resolution Rate</div>
          <div class="trend up">↑ 3% improvement</div>
        </div>
      </div>
      <div class="stat-mini purple">
        <div class="stat-mini-icon purple"><i data-lucide="users"></i></div>
        <div class="stat-mini-info">
          <div class="value">12</div>
          <div class="label">Active Respondents</div>
          <div class="trend up">↑ 2 new this week</div>
        </div>
      </div>
    </div>

    <!-- FILTER CARD -->
    <div class="filter-card">
      <!-- Quick Filters -->
      <div class="quick-filters">
        <button class="quick-filter-btn active" data-range="all" type="button">All Time</button>
        <button class="quick-filter-btn" data-range="today" type="button">Today</button>
        <button class="quick-filter-btn" data-range="week" type="button">This Week</button>
        <button class="quick-filter-btn" data-range="month" type="button">This Month</button>
        <button class="quick-filter-btn" data-range="quarter" type="button">Last 3 Months</button>
      </div>
    </div>

    <!-- HISTORY TABLE -->
    <div class="history-card">
      <div class="table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th class="sorted" data-sort="id">Report ID <i data-lucide="arrow-down"></i></th>
              <th data-sort="type">Type <i data-lucide="arrow-down"></i></th>
              <th data-sort="location">Location <i data-lucide="arrow-down"></i></th>
              <th data-sort="received">Received <i data-lucide="arrow-down"></i></th>
              <th data-sort="resolved">Resolved <i data-lucide="arrow-down"></i></th>
              <th data-sort="duration">Duration <i data-lucide="arrow-down"></i></th>
              <th data-sort="priority">Priority <i data-lucide="arrow-down"></i></th>
              <th data-sort="status">Status <i data-lucide="arrow-down"></i></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="historyBody"></tbody>
        </table>
      </div>

      <div class="history-cards" id="historyCards"></div>

      <!-- PAGINATION -->
      <div class="pagination-bar">
        <div class="pagination-info" id="paginationInfo">
          Showing <strong>1-10</strong> of <strong>247</strong> responses
        </div>
        <div class="pagination-controls">
          <button class="page-btn" disabled type="button">
            <i data-lucide="chevron-left"></i>
          </button>
          <button class="page-btn active" type="button">1</button>
          <button class="page-btn" type="button">2</button>
          <button class="page-btn" type="button">3</button>
          <button class="page-btn" type="button">...</button>
          <button class="page-btn" type="button">25</button>
          <button class="page-btn" type="button">
            <i data-lucide="chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

  </div>
  `;
};

// Render Table and Mobile Cards
function renderHistory(history) {
  const historyBody = document.getElementById('historyBody');
  const historyCards = document.getElementById('historyCards');
  const paginationInfo = document.getElementById('paginationInfo');

  if (!historyBody && !historyCards) return;

  if (paginationInfo) {
    paginationInfo.innerHTML = `Showing <strong>1-${history.length}</strong> of <strong>${history.length}</strong> responses`;
  }

  if (history.length === 0) {
    if (historyBody) {
      historyBody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <i data-lucide="inbox"></i>
              <h3>No records found</h3>
              <p>Try adjusting your filters or date range.</p>
            </div>
          </td>
        </tr>
      `;
    }
    if (historyCards) {
      historyCards.innerHTML = `
        <div class="empty-state">
          <i data-lucide="inbox"></i>
          <h3>No records found</h3>
          <p>Try adjusting your filters or date range.</p>
        </div>
      `;
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    return;
  }

  // Render Table Rows
  if (historyBody) {
    historyBody.innerHTML = history.map(h => `
      <tr>
        <td><span class="report-id" onclick="window.viewReport('${h.id}')">${h.id}</span></td>
        <td>
          <div class="emergency-type ${h.type.toLowerCase()}">
            <i data-lucide="${getIconForType(h.type)}"></i>
            ${h.type}
          </div>
        </td>
        <td>
          <div class="location-text">
            <span class="primary">${h.location}</span>
            <span class="secondary">${h.state}</span>
          </div>
        </td>
        <td>
          <div class="time-info">
            <span class="date">${h.received.date}</span>
            <span class="time">${h.received.time}</span>
          </div>
        </td>
        <td>
          <div class="time-info">
            <span class="date">${h.resolved.date}</span>
            <span class="time">${h.resolved.time}</span>
          </div>
        </td>
        <td>
          <span class="duration-badge ${getDurationClass(h.duration)}">
            <i data-lucide="clock"></i>
            ${formatDuration(h.duration)}
          </span>
        </td>
        <td><span class="priority-badge ${h.priority}">${capitalize(h.priority)}</span></td>
        <td><span class="status-badge ${h.status}">${formatStatus(h.status)}</span></td>
        <td>
          <a href="report-details.php?id=${h.id}&mode=history" class="action-btn action-btn-view" onclick="event.preventDefault(); window.viewReport('${h.id}');">
            <i data-lucide="eye"></i>
            View
          </a>
        </td>
      </tr>
    `).join('');
  }

  // Render Mobile Cards
  if (historyCards) {
    historyCards.innerHTML = history.map(h => `
      <div class="history-card-item">
        <div class="history-card-top">
          <span class="history-card-id" onclick="window.viewReport('${h.id}')">${h.id}</span>
          <span class="priority-badge ${h.priority}">${capitalize(h.priority)}</span>
        </div>
        <div class="history-card-body">
          <div class="history-card-field">
            <div class="label">Type</div>
            <div class="value emergency-type ${h.type.toLowerCase()}">
              <i data-lucide="${getIconForType(h.type)}"></i> ${h.type}
            </div>
          </div>
          <div class="history-card-field">
            <div class="label">Location</div>
            <div class="value">${h.location}</div>
          </div>
          <div class="history-card-field">
            <div class="label">Duration</div>
            <div class="value">
              <span class="duration-badge ${getDurationClass(h.duration)}">
                <i data-lucide="clock"></i>
                ${formatDuration(h.duration)}
              </span>
            </div>
          </div>
          <div class="history-card-field">
            <div class="label">Received</div>
            <div class="value">${h.received.date} ${h.received.time}</div>
          </div>
          <div class="history-card-field">
            <div class="label">Resolved</div>
            <div class="value">${h.resolved.date} ${h.resolved.time}</div>
          </div>
        </div>
        <div class="history-card-actions">
          <a href="report-details.php?id=${h.id}&mode=history" class="action-btn action-btn-view" onclick="event.preventDefault(); window.viewReport('${h.id}');">
            <i data-lucide="eye"></i>
            View Details
          </a>
        </div>
      </div>
    `).join('');
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Initializer Function for Response History Interactivity
function initResponseHistory() {
  const filterToggle = document.getElementById('filterToggle');
  const filterBody = document.getElementById('filterBody');
  const quickFilterBtns = document.querySelectorAll('.quick-filter-btn');
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const statusFilter = document.getElementById('statusFilter');
  const respondentFilter = document.getElementById('respondentFilter');
  const locationFilter = document.getElementById('locationFilter');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  const resetFilters = document.getElementById('resetFilters');
  const applyFilters = document.getElementById('applyFilters');
  const exportBtn = document.getElementById('exportBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  // Filter Toggle
  if (filterToggle && filterBody) {
    let filtersVisible = false;
    filterToggle.addEventListener('click', () => {
      filtersVisible = !filtersVisible;
      filterBody.classList.toggle('active', filtersVisible);
      const span = filterToggle.querySelector('span');
      const icon = filterToggle.querySelector('i');
      if (span) span.textContent = filtersVisible ? 'Hide Filters' : 'Show Filters';
      if (icon) icon.setAttribute('data-lucide', filtersVisible ? 'chevron-up' : 'chevron-down');
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    });
  }

  // Filtering Logic
  function applyAllFilters() {
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const t = typeFilter ? typeFilter.value : '';
    const p = priorityFilter ? priorityFilter.value : '';
    const s = statusFilter ? statusFilter.value : '';
    const r = respondentFilter ? respondentFilter.value : '';
    const l = locationFilter ? locationFilter.value : '';

    const filtered = MOCK_HISTORY.filter(h => {
      const matchQ = !q || 
        h.id.toLowerCase().includes(q) || 
        h.type.toLowerCase().includes(q) || 
        h.location.toLowerCase().includes(q) ||
        h.respondent.name.toLowerCase().includes(q);
      const matchT = !t || h.type === t;
      const matchP = !p || h.priority === p;
      const matchS = !s || h.status === s;
      const matchR = !r || h.respondent.name === r;
      const matchL = !l || h.location.includes(l);
      return matchQ && matchT && matchP && matchS && matchR && matchL;
    });

    renderHistory(filtered);
  }

  if (applyFilters) applyFilters.addEventListener('click', applyAllFilters);
  if (searchInput) searchInput.addEventListener('input', applyAllFilters);
  if (typeFilter) typeFilter.addEventListener('change', applyAllFilters);
  if (priorityFilter) priorityFilter.addEventListener('change', applyAllFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyAllFilters);
  if (respondentFilter) respondentFilter.addEventListener('change', applyAllFilters);
  if (locationFilter) locationFilter.addEventListener('change', applyAllFilters);

  // Quick Filter Buttons
  quickFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      quickFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyAllFilters();
    });
  });

  // Reset Filters
  if (resetFilters) {
    resetFilters.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeFilter) typeFilter.value = '';
      if (priorityFilter) priorityFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      if (respondentFilter) respondentFilter.value = '';
      if (locationFilter) locationFilter.value = '';
      if (dateFrom) dateFrom.value = '';
      if (dateTo) dateTo.value = '';
      quickFilterBtns.forEach(b => b.classList.remove('active'));
      if (quickFilterBtns[0]) quickFilterBtns[0].classList.add('active');
      renderHistory(MOCK_HISTORY);
    });
  }

  // Sorting
  const headers = document.querySelectorAll('.history-table th[data-sort]');
  let currentSort = { column: 'id', direction: 'desc' };

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      
      // Toggle direction
      if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
      }

      // Update UI
      headers.forEach(h => {
        h.classList.remove('sorted');
        const icon = h.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', 'arrow-down');
      });
      header.classList.add('sorted');
      const activeIcon = header.querySelector('i');
      if (activeIcon) {
        activeIcon.setAttribute('data-lucide', currentSort.direction === 'asc' ? 'arrow-up' : 'arrow-down');
      }
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      // Sort data
      const sorted = [...MOCK_HISTORY].sort((a, b) => {
        let aVal = '', bVal = '';
        switch (column) {
          case 'id': aVal = a.id; bVal = b.id; break;
          case 'type': aVal = a.type; bVal = b.type; break;
          case 'location': aVal = a.location; bVal = b.location; break;
          case 'respondent': aVal = a.respondent.name; bVal = b.respondent.name; break;
          case 'received': aVal = a.received.date + a.received.time; bVal = b.received.date + b.received.time; break;
          case 'resolved': aVal = a.resolved.date + a.resolved.time; bVal = b.resolved.date + b.resolved.time; break;
          case 'duration': aVal = a.duration; bVal = b.duration; break;
          case 'priority': {
            const priorityOrder = { 'critical': 3, 'high': 2, 'normal': 1 };
            aVal = priorityOrder[a.priority] || 0;
            bVal = priorityOrder[b.priority] || 0;
            break;
          }
          case 'status': aVal = a.status; bVal = b.status; break;
        }
        
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      renderHistory(sorted);
    });
  });

  // Export Button
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      alert('Export Archive\n\nIn production, this generates a CSV/PDF of the filtered emergency response history.');
    });
  }

  // Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      applyAllFilters();
    });
  }

  // Initial Render
  renderHistory(MOCK_HISTORY);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Global exports
window.initResponseHistory = initResponseHistory;
window.renderResponseHistory = renderHistory;

// Auto-run when standalone page is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('historyBody') || document.getElementById('responseHistoryContainer')) {
    initResponseHistory();
  }
});
if (document.getElementById('historyBody') || document.getElementById('responseHistoryContainer')) {
  initResponseHistory();
}
