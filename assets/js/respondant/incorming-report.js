/**
 * RescueLine - Incoming Reports Script
 * Handles table/card rendering, search filters, pagination, and bulk selection.
 */

// Template generator for instant rendering
window.getIncomingReportsHTML = function() {
  return `
    <div class="page-container" id="incomingReportsContainer">

      <!-- PAGE HEADER -->
      <div class="page-header">
        <div class="page-header-left">
          <h1>Incoming Emergency Reports</h1>
          <p>Manage and respond to emergency reports submitted via USSD</p>
        </div>
        <div class="page-header-actions">
          <button type="button" class="btn btn-secondary">
            <i data-lucide="download"></i>
            Export
          </button>
          <button type="button" class="btn btn-primary" onclick="window.initIncomingReports && window.initIncomingReports()">
            <i data-lucide="refresh-cw"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- STATS SUMMARY -->
      <div class="stats-row">
        <div class="stat-mini">
          <div class="stat-mini-icon green"><i data-lucide="inbox"></i></div>
          <div class="stat-mini-info">
            <div class="value">12</div>
            <div class="label">Total New</div>
          </div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-icon red"><i data-lucide="alert-octagon"></i></div>
          <div class="stat-mini-info">
            <div class="value">3</div>
            <div class="label">Critical</div>
          </div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-icon orange"><i data-lucide="clock"></i></div>
          <div class="stat-mini-info">
            <div class="value">5</div>
            <div class="label">Awaiting Response</div>
          </div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-icon blue"><i data-lucide="user-check"></i></div>
          <div class="stat-mini-info">
            <div class="value">4</div>
            <div class="label">Assigned Today</div>
          </div>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div class="filter-card">
        <div class="filter-bar">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search by ID, location, or type..." id="searchInput" autocomplete="off" />
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
            <option value="Security">Security</option>
          </select>
          <select class="filter-select" id="statusFilter" aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
          </select>
          <div class="filter-actions">
            <button type="button" class="icon-btn-small" title="Reset filters" id="resetFilters">
              <i data-lucide="rotate-ccw"></i>
            </button>
            <button type="button" class="icon-btn-small" title="More filters">
              <i data-lucide="sliders-horizontal"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- BULK ACTIONS -->
      <div class="bulk-actions" id="bulkActions">
        <div class="bulk-info">
          <i data-lucide="check-square"></i>
          <span id="selectedCount">0 reports selected</span>
        </div>
        <div class="bulk-actions-buttons">
          <button type="button" class="bulk-btn bulk-btn-accept">
            <i data-lucide="check-circle"></i>
            Accept Selected
          </button>
          <button type="button" class="bulk-btn bulk-btn-assign">
            <i data-lucide="user-plus"></i>
            Assign
          </button>
          <button type="button" class="bulk-btn bulk-btn-clear" id="clearSelection">
            <i data-lucide="x"></i>
            Clear
          </button>
        </div>
      </div>

      <!-- REPORTS TABLE -->
      <div class="reports-card">
        <div class="table-wrap">
          <table class="reports-table">
            <thead>
              <tr>
                <th><input type="checkbox" id="selectAll" /></th>
                <th>Report ID</th>
                <th>Emergency Type</th>
                <th>Location</th>
                <th>Reporter</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="reportsBody"></tbody>
          </table>
        </div>

        <div class="report-cards" id="reportCards"></div>

        <!-- PAGINATION -->
        <div class="pagination-bar">
          <div class="pagination-info">
            Showing <strong>1-10</strong> of <strong>47</strong> reports
          </div>
          <div class="pagination-controls">
            <button type="button" class="page-btn" disabled>
              <i data-lucide="chevron-left"></i>
            </button>
            <button type="button" class="page-btn active">1</button>
            <button type="button" class="page-btn">2</button>
            <button type="button" class="page-btn">3</button>
            <button type="button" class="page-btn">4</button>
            <button type="button" class="page-btn">5</button>
            <button type="button" class="page-btn">
              <i data-lucide="chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
};

function initIncomingReports() {
  /* =========================================================
     MOCK DATA
     ========================================================= */
  const MOCK_REPORTS = [
    { id: 'RL-0025', type: 'Fire',      location: 'Kaduna South Market', state: 'Kaduna', phone: '0803***219', time: '11:42 AM', priority: 'critical', status: 'new' },
    { id: 'RL-0024', type: 'Accident',  location: 'Zaria City',          state: 'Kaduna', phone: '0812***445', time: '11:34 AM', priority: 'critical', status: 'new' },
    { id: 'RL-0023', type: 'Medical',   location: 'Chikun LGA',          state: 'Kaduna', phone: '0705***882', time: '11:27 AM', priority: 'high',     status: 'new' },
    { id: 'RL-0022', type: 'Flood',     location: 'Kawo Area',           state: 'Kaduna', phone: '0909***117', time: '11:17 AM', priority: 'normal',   status: 'new' },
    { id: 'RL-0021', type: 'Security',  location: 'Sabon Tasha',         state: 'Kaduna', phone: '0806***334', time: '11:05 AM', priority: 'high',     status: 'assigned' },
    { id: 'RL-0020', type: 'Fire',      location: 'Ungwan Rimi',         state: 'Kaduna', phone: '0813***556', time: '10:52 AM', priority: 'critical', status: 'in-progress' },
    { id: 'RL-0019', type: 'Medical',   location: 'Barnawa',             state: 'Kaduna', phone: '0708***778', time: '10:38 AM', priority: 'normal',   status: 'new' },
    { id: 'RL-0018', type: 'Accident',  location: 'Kakuri',              state: 'Kaduna', phone: '0902***991', time: '10:25 AM', priority: 'high',     status: 'assigned' },
    { id: 'RL-0017', type: 'Flood',     location: 'Tudun Wada',          state: 'Kaduna', phone: '0805***223', time: '10:12 AM', priority: 'normal',   status: 'new' },
    { id: 'RL-0016', type: 'Security',  location: 'Malali',              state: 'Kaduna', phone: '0814***667', time: '09:58 AM', priority: 'high',     status: 'in-progress' }
  ];

  /* Helpers */
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

  function capitalize(s) { 
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1); 
  }

  function formatStatus(status) {
    const map = {
      'new': 'New',
      'assigned': 'Assigned',
      'in-progress': 'In Progress'
    };
    return map[status] || status;
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
     RENDER REPORTS
     ========================================================= */
  const reportsBody = document.getElementById('reportsBody');
  const reportCards = document.getElementById('reportCards');

  function renderReports(reports) {
    if (!reports || reports.length === 0) {
      const emptyMsg = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i data-lucide="inbox"></i>
              <h3>No Incoming Reports</h3>
              <p>No matching emergency reports found.</p>
            </div>
          </td>
        </tr>
      `;
      if (reportsBody) reportsBody.innerHTML = emptyMsg;
      if (reportCards) {
        reportCards.innerHTML = `
          <div class="empty-state">
            <i data-lucide="inbox"></i>
            <h3>No Incoming Reports</h3>
            <p>No matching emergency reports found.</p>
          </div>
        `;
      }
      refreshIcons();
      return;
    }

    // Render Table
    if (reportsBody) {
      reportsBody.innerHTML = reports.map(r => `
        <tr>
          <td><input type="checkbox" class="report-checkbox" data-id="${escapeHTML(r.id)}" /></td>
          <td><span class="report-id" onclick="window.viewReport('${escapeHTML(r.id)}')">${escapeHTML(r.id)}</span></td>
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
          <td>
            <div class="reporter-info">
              <span class="phone">${escapeHTML(r.phone)}</span>
              <span class="time">${escapeHTML(r.time)}</span>
            </div>
          </td>
          <td>
            <div class="action-buttons">
              <a href="report-details.php?id=${encodeURIComponent(r.id)}" class="action-btn action-btn-view" onclick="if(window.displayReportDetails){event.preventDefault();window.displayReportDetails('${escapeHTML(r.id)}');}">
                <i data-lucide="eye"></i>
                View
              </a>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Render Mobile Cards
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
              <div class="label">Reporter</div>
              <div class="value">${escapeHTML(r.phone)}</div>
            </div>
            <div class="report-card-field">
              <div class="label">Time</div>
              <div class="value">${escapeHTML(r.time)}</div>
            </div>
            <div class="report-card-field">
              <div class="label">Status</div>
              <div class="value"><span class="status-badge ${escapeHTML(r.status)}">${escapeHTML(formatStatus(r.status))}</span></div>
            </div>
          </div>
          <div class="report-card-actions">
            <a href="report-details.php?id=${encodeURIComponent(r.id)}" class="action-btn action-btn-view" onclick="if(window.displayReportDetails){event.preventDefault();window.displayReportDetails('${escapeHTML(r.id)}');}">
              <i data-lucide="eye"></i>
              View Details
            </a>
          </div>
        </div>
      `).join('');
    }

    refreshIcons();
    updateBulkActions();
  }

  // Initial render
  renderReports(MOCK_REPORTS);

  /* =========================================================
     SEARCH & FILTERS
     ========================================================= */
  const searchInput = document.getElementById('searchInput');
  const priorityFilter = document.getElementById('priorityFilter');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const resetFilters = document.getElementById('resetFilters');

  function applyFilters() {
    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const p = priorityFilter ? priorityFilter.value : '';
    const t = typeFilter ? typeFilter.value : '';
    const s = statusFilter ? statusFilter.value : '';
    
    const filtered = MOCK_REPORTS.filter(r => {
      const matchQ = !q || 
        r.id.toLowerCase().includes(q) || 
        r.type.toLowerCase().includes(q) || 
        r.location.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q);
      const matchP = !p || r.priority === p;
      const matchT = !t || r.type === t;
      const matchS = !s || r.status === s;
      return matchQ && matchP && matchT && matchS;
    });
    
    renderReports(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
  if (typeFilter) typeFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);

  if (resetFilters) {
    resetFilters.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (priorityFilter) priorityFilter.value = '';
      if (typeFilter) typeFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      applyFilters();
    });
  }

  /* =========================================================
     CHECKBOX BULK SELECTION
     ========================================================= */
  const selectAll = document.getElementById('selectAll');
  const bulkActions = document.getElementById('bulkActions');
  const selectedCount = document.getElementById('selectedCount');
  const clearSelection = document.getElementById('clearSelection');

  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.report-checkbox');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      updateBulkActions();
    });
  }

  document.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('report-checkbox')) {
      updateBulkActions();
    }
  });

  if (clearSelection) {
    clearSelection.addEventListener('click', () => {
      if (selectAll) selectAll.checked = false;
      document.querySelectorAll('.report-checkbox').forEach(cb => cb.checked = false);
      updateBulkActions();
    });
  }

  function updateBulkActions() {
    const checked = document.querySelectorAll('.report-checkbox:checked');
    if (bulkActions && selectedCount) {
      if (checked.length > 0) {
        bulkActions.classList.add('active');
        selectedCount.textContent = `${checked.length} report${checked.length > 1 ? 's' : ''} selected`;
      } else {
        bulkActions.classList.remove('active');
      }
    }
  }

  /* =========================================================
     GLOBAL ACTION HANDLERS
     ========================================================= */
  window.viewReport = function(id) {
    if (typeof window.displayReportDetails === 'function') {
      window.displayReportDetails(id);
    } else {
      window.location.href = `report-details.php?id=${encodeURIComponent(id)}`;
    }
  };

  window.acceptReport = function(id) {
    alert(`Accepting report ${id}...\n\nIn production, this triggers: api/accept_report.php?id=${id}`);
  };

  refreshIcons();
}

// Export function to global window
window.initIncomingReports = initIncomingReports;

// Auto-run if document already has incomingReportsContainer
if (document.getElementById('incomingReportsContainer')) {
  initIncomingReports();
}
