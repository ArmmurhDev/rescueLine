/**
 * RescueLine - Active Responses Script (Redesigned SaaS Interface)
 * Handles live response monitoring, timers, cards & table view switching, and filters.
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
          <button type="button" class="btn btn-secondary">
            <i data-lucide="map-pin"></i>
            Live Map
          </button>
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
            <div class="value">5</div>
            <div class="label">Active Responses</div>
          </div>
        </div>
        <div class="stat-mini red">
          <div class="stat-mini-icon red"><i data-lucide="alert-triangle"></i></div>
          <div class="stat-mini-info">
            <div class="value">2</div>
            <div class="label">Urgent / Critical</div>
          </div>
        </div>
        <div class="stat-mini orange">
          <div class="stat-mini-icon orange"><i data-lucide="map-pin"></i></div>
          <div class="stat-mini-info">
            <div class="value">3</div>
            <div class="label">On Scene</div>
          </div>
        </div>
        <div class="stat-mini blue">
          <div class="stat-mini-icon blue"><i data-lucide="clock"></i></div>
          <div class="stat-mini-info">
            <div class="value">14m</div>
            <div class="label">Avg Response Time</div>
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
            <option value="normal">Normal</option>
          </select>
          <select class="filter-select" id="statusFilter" aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="dispatched">Dispatched</option>
            <option value="on-scene">On Scene</option>
            <option value="in-progress">In Progress</option>
            <option value="pending">Pending</option>
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
                <th>Elapsed</th>
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

function initActiveResponses() {
  /* =========================================================
     MOCK DATA
     ========================================================= */
  const MOCK_RESPONSES = [
    {
      id: 'RL-0025',
      type: 'Fire',
      location: 'Kaduna South Market',
      state: 'Kaduna',
      respondent: { name: 'Musa Ibrahim', initials: 'MI', role: 'Fire Unit Lead', online: true },
      elapsed: 842, // seconds
      status: 'on-scene',
      priority: 'critical',
      steps: ['accepted', 'dispatched', 'on-scene', 'resolved'],
      currentStep: 2,
      lastUpdate: '2 min ago'
    },
    {
      id: 'RL-0024',
      type: 'Accident',
      location: 'Zaria City, Katsina Road',
      state: 'Kaduna',
      respondent: { name: 'Amina Bello', initials: 'AB', role: 'Medical Team', online: true },
      elapsed: 1520,
      status: 'in-progress',
      priority: 'critical',
      steps: ['accepted', 'dispatched', 'on-scene', 'resolved'],
      currentStep: 3,
      lastUpdate: '5 min ago'
    },
    {
      id: 'RL-0023',
      type: 'Medical',
      location: 'Chikun LGA, Ganawuri',
      state: 'Kaduna',
      respondent: { name: 'Yusuf Danladi', initials: 'YD', role: 'Paramedic', online: true },
      elapsed: 2340,
      status: 'dispatched',
      priority: 'high',
      steps: ['accepted', 'dispatched', 'on-scene', 'resolved'],
      currentStep: 1,
      lastUpdate: '8 min ago'
    },
    {
      id: 'RL-0021',
      type: 'Security',
      location: 'Sabon Tasha, Kaduna',
      state: 'Kaduna',
      respondent: { name: 'Fatima Ahmed', initials: 'FA', role: 'Security Officer', online: false },
      elapsed: 3600,
      status: 'in-progress',
      priority: 'high',
      steps: ['accepted', 'dispatched', 'on-scene', 'resolved'],
      currentStep: 3,
      lastUpdate: '12 min ago'
    },
    {
      id: 'RL-0020',
      type: 'Flood',
      location: 'Kawo Area, Kaduna',
      state: 'Kaduna',
      respondent: { name: 'Sani Mohammed', initials: 'SM', role: 'Rescue Team', online: true },
      elapsed: 4800,
      status: 'on-scene',
      priority: 'normal',
      steps: ['accepted', 'dispatched', 'on-scene', 'resolved'],
      currentStep: 2,
      lastUpdate: '18 min ago'
    }
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

  function formatElapsed(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  function isUrgentElapsed(seconds) {
    return seconds > 1800; // > 30 min
  }

  function capitalize(s) { 
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1); 
  }

  function formatStatus(status) {
    const map = {
      'dispatched': 'Dispatched',
      'on-scene': 'On Scene',
      'in-progress': 'In Progress',
      'pending': 'Pending'
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
     RENDER CARD VIEW (Clean SaaS Hierarchy)
     ========================================================= */
  const responsesGrid = document.getElementById('responsesGrid');

  function renderCardView(responses) {
    if (!responsesGrid) return;
    
    if (!responses || responses.length === 0) {
      responsesGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <i data-lucide="check-circle-2"></i>
          <h3>No active responses</h3>
          <p>All emergency reports have been resolved or are awaiting assignment.</p>
        </div>
      `;
      refreshIcons();
      return;
    }

    const stepIcons = ['check', 'truck', 'map-pin', 'flag'];
    const stepLabels = ['Accepted', 'Dispatched', 'On Scene', 'Resolved'];

    responsesGrid.innerHTML = responses.map(r => {
      const totalSteps = (r.steps || []).length || 4;
      const progressPercent = Math.min(100, Math.max(0, (r.currentStep / (totalSteps - 1)) * 100));

      const stepsHtml = (r.steps || []).map((step, i) => {
        let cls = '';
        if (i < r.currentStep) cls = 'completed';
        else if (i === r.currentStep) cls = 'active';

        return `
          <div class="rc-step ${cls}">
            <div class="rc-step-bullet">
              <i data-lucide="${stepIcons[i] || 'circle'}"></i>
            </div>
            <span class="rc-step-text">${stepLabels[i] || step}</span>
          </div>
        `;
      }).join('');

      const isEscalatable = r.priority === 'critical' || r.priority === 'high';

      return `
        <div class="response-card priority-${escapeHTML(r.priority)}">
          
          <!-- Card Header -->
          <div class="rc-header">
            <div class="rc-header-main">
              <div class="rc-type-pill ${escapeHTML(r.type.toLowerCase())}">
                <i data-lucide="${escapeHTML(getIconForType(r.type))}"></i>
                <span>${escapeHTML(r.type)}</span>
              </div>
              <span class="rc-id" onclick="window.viewReport('${escapeHTML(r.id)}')">${escapeHTML(r.id)}</span>
              <span class="rc-priority-tag ${escapeHTML(r.priority)}">${escapeHTML(capitalize(r.priority))}</span>
            </div>
            <div class="rc-header-meta">
              <div class="rc-timer-badge ${isUrgentElapsed(r.elapsed) ? 'urgent' : ''}" data-elapsed="${r.elapsed}">
                <i data-lucide="timer"></i>
                <span>${escapeHTML(formatElapsed(r.elapsed))}</span>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="rc-body">
            
            <!-- Compact Location & Update Info -->
            <div class="rc-info-grid">
              <div class="rc-info-item">
                <i data-lucide="map-pin" class="rc-icon"></i>
                <div class="rc-info-text">
                  <span class="rc-location-primary" title="${escapeHTML(r.location)}">${escapeHTML(r.location)}</span>
                  <span class="rc-location-state">${escapeHTML(r.state)} State</span>
                </div>
              </div>
              <div class="rc-info-item rc-update">
                <i data-lucide="clock" class="rc-icon"></i>
                <div class="rc-info-text">
                  <span class="rc-label">Updated</span>
                  <span class="rc-update-val">${escapeHTML(r.lastUpdate)}</span>
                </div>
              </div>
            </div>

            <!-- Compact Respondent Block -->
            <div class="rc-respondent-block">
              <div class="rc-resp-avatar">${escapeHTML(r.respondent.initials)}</div>
              <div class="rc-resp-info">
                <div class="rc-resp-name">${escapeHTML(r.respondent.name)}</div>
                <div class="rc-resp-role">${escapeHTML(r.respondent.role)}</div>
              </div>
              <div class="rc-resp-status ${r.respondent.online ? 'online' : 'offline'}">
                <span class="rc-status-dot"></span>
                <span>${r.respondent.online ? 'Online' : 'Offline'}</span>
              </div>
            </div>

            <!-- Streamlined Visual Progress Timeline -->
            <div class="rc-timeline-section">
              <div class="rc-timeline-track">
                <div class="rc-track-bar" style="width: calc(${progressPercent}% - 24px * ${progressPercent / 100});"></div>
                <div class="rc-track-steps">
                  ${stepsHtml}
                </div>
              </div>
            </div>

          </div>

          <!-- Card Footer Actions -->
          <div class="rc-footer">
            <a href="report-details.php?id=${encodeURIComponent(r.id)}" class="rc-btn rc-btn-view" title="View details">
              <i data-lucide="eye"></i>
              <span>View</span>
            </a>
            <button type="button" class="rc-btn rc-btn-update" onclick="window.updateStatus('${escapeHTML(r.id)}')">
              <i data-lucide="edit-3"></i>
              <span>Update</span>
            </button>
            <button type="button" class="rc-btn rc-btn-resolve" onclick="window.resolveReport('${escapeHTML(r.id)}')">
              <i data-lucide="check-circle-2"></i>
              <span>Resolve</span>
            </button>
            ${isEscalatable ? `
              <button type="button" class="rc-btn rc-btn-escalate" onclick="window.escalateReport('${escapeHTML(r.id)}')">
                <i data-lucide="alert-triangle"></i>
                <span>Escalate</span>
              </button>
            ` : ''}
          </div>

        </div>
      `;
    }).join('');
    
    refreshIcons();
  }

  /* =========================================================
     RENDER TABLE VIEW
     ========================================================= */
  const tableBody = document.getElementById('tableBody');

  function renderTableView(responses) {
    if (!tableBody) return;
    
    if (!responses || responses.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state" style="padding: 48px 20px;">
              <i data-lucide="check-circle-2"></i>
              <h3>No active responses found</h3>
              <p>No emergency reports match the specified search or filter criteria.</p>
            </div>
          </td>
        </tr>
      `;
      refreshIcons();
      return;
    }

    tableBody.innerHTML = responses.map(r => {
      const isUrgent = isUrgentElapsed(r.elapsed);

      return `
        <tr>
          <td>
            <span class="report-id-link" onclick="window.viewReport('${escapeHTML(r.id)}')">
              ${escapeHTML(r.id)}
            </span>
          </td>
          <td>
            <span class="emergency-type-badge ${escapeHTML(r.type.toLowerCase())}">
              <i data-lucide="${escapeHTML(getIconForType(r.type))}"></i>
              ${escapeHTML(r.type)}
            </span>
          </td>
          <td>
            <div class="table-location-cell">
              <span class="table-location-primary" title="${escapeHTML(r.location)}">${escapeHTML(r.location)}</span>
              <span class="table-location-state">${escapeHTML(r.state)} State</span>
            </div>
          </td>
          <td>
            <span class="table-timer-badge ${isUrgent ? 'urgent' : ''}" data-elapsed="${r.elapsed}">
              <i data-lucide="timer"></i>
              <span>${escapeHTML(formatElapsed(r.elapsed))}</span>
            </span>
          </td>
          <td>
            <span class="status-badge ${escapeHTML(r.status)}">
              ${escapeHTML(formatStatus(r.status))}
            </span>
          </td>
          <td>
            <span class="priority-badge ${escapeHTML(r.priority)}">
              ${escapeHTML(capitalize(r.priority))}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <a href="report-details.php?id=${encodeURIComponent(r.id)}" class="action-btn-view" title="View details" onclick="if(window.displayReportDetails){event.preventDefault();window.displayReportDetails('${escapeHTML(r.id)}');}">
                <i data-lucide="eye"></i>
                <span>View</span>
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    refreshIcons();
  }

  /* =========================================================
     LIVE TIMER (updates elapsed time every second)
     ========================================================= */
  if (window._activeResponsesTimerInterval) {
    clearInterval(window._activeResponsesTimerInterval);
  }

  window._activeResponsesTimerInterval = setInterval(() => {
    document.querySelectorAll('[data-elapsed]').forEach(el => {
      let elapsed = parseInt(el.getAttribute('data-elapsed'), 10) || 0;
      elapsed += 1;
      el.setAttribute('data-elapsed', elapsed);
      const textSpan = el.querySelector('span');
      if (textSpan) {
        textSpan.textContent = formatElapsed(elapsed);
      }
      
      if (isUrgentElapsed(elapsed) && !el.classList.contains('urgent')) {
        el.classList.add('urgent');
      }
    });
  }, 1000);

  /* =========================================================
     FILTERS
     ========================================================= */
  const searchInput = document.getElementById('searchInput');
  const priorityFilter = document.getElementById('priorityFilter');
  const statusFilter = document.getElementById('statusFilter');

  function applyFilters() {
    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const p = priorityFilter ? priorityFilter.value : '';
    const s = statusFilter ? statusFilter.value : '';
    
    const filtered = MOCK_RESPONSES.filter(r => {
      const matchQ = !q || 
        r.id.toLowerCase().includes(q) || 
        r.type.toLowerCase().includes(q) || 
        r.location.toLowerCase().includes(q) ||
        r.respondent.name.toLowerCase().includes(q);
      const matchP = !p || r.priority === p;
      const matchS = !s || r.status === s;
      return matchQ && matchP && matchS;
    });
    
    renderTableView(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);

  /* =========================================================
     INITIAL RENDER
     ========================================================= */
  renderTableView(MOCK_RESPONSES);
  refreshIcons();
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

window.updateStatus = function(id) {
  alert(`Update status for ${id}\n\nIn production, this opens a modal to update status.\nEndpoint: api/update_status.php`);
};

window.resolveReport = function(id) {
  if (confirm(`Mark ${id} as resolved?`)) {
    alert(`Report ${id} resolved.\nEndpoint: api/resolve_report.php?id=${id}`);
  }
};

window.escalateReport = function(id) {
  if (confirm(`Escalate ${id} to higher priority?`)) {
    alert(`Report ${id} escalated.\nEndpoint: api/escalate_report.php?id=${id}`);
  }
};

// Export to window
window.initActiveResponses = initActiveResponses;

// Auto-run if container exists on page load
if (document.getElementById('activeResponsesContainer')) {
  initActiveResponses();
}
