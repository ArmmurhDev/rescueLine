/**
 * RescueLine - Incoming Reports Script (Real-time DB Connection)
 * Handles live table/card rendering, search filters, pagination, real-time background polling,
 * and incident responses against MySQL database.
 */

// Template generator for instant rendering
window.getIncomingReportsHTML = function() {
  return `
    <div class="page-container" id="incomingReportsContainer">

      <!-- PAGE HEADER -->
      <div class="page-header">
        <div class="page-header-left">
          <h1>
            Incoming Emergency Reports
            <span class="live-dot" title="Live Sync Active" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; margin-left: 8px; box-shadow: 0 0 8px #22c55e;"></span>
          </h1>
          <p>Manage and respond to emergency reports submitted via USSD / Web in real-time</p>
        </div>
        <div class="page-header-actions">
          <button type="button" class="btn btn-secondary" onclick="window.location.href='../api/reports.php?action=export'">
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
            <div class="value" id="statIncomingTotal">0</div>
            <div class="label">Total New</div>
          </div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-icon red"><i data-lucide="alert-octagon"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statIncomingCritical">0</div>
            <div class="label">Critical</div>
          </div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-icon orange"><i data-lucide="clock"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statIncomingPending">0</div>
            <div class="label">Awaiting Response</div>
          </div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-icon blue"><i data-lucide="user-check"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statIncomingAssigned">0</div>
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
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select class="filter-select" id="typeFilter" aria-label="Filter by emergency type">
            <option value="">All Types</option>
            <option value="Fire">Fire</option>
            <option value="Accident">Accident</option>
            <option value="Medical">Medical</option>
            <option value="Flood">Flood</option>
            <option value="Security">Security</option>
          </select>
          <div class="filter-actions">
            <button type="button" class="icon-btn-small" title="Reset filters" id="resetFilters">
              <i data-lucide="rotate-ccw"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- REPORTS TABLE -->
      <div class="reports-card">
        <div class="table-wrap">
          <table class="reports-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Emergency Type</th>
                <th>Location</th>
                <th>Receive</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="reportsBody"></tbody>
          </table>
        </div>

        <div class="report-cards" id="reportCards"></div>
      </div>

    </div>
  `;
};

async function initIncomingReports() {
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
    if (!type) return 'alert-circle';
    for (const key in map) {
      if (type.toLowerCase().includes(key.toLowerCase())) return map[key];
    }
    return 'alert-circle';
  }

  function getTypeClass(type) { 
    if (!type) return 'other';
    const t = type.toLowerCase();
    if (t.includes('fire')) return 'fire';
    if (t.includes('accident')) return 'accident';
    if (t.includes('medical')) return 'medical';
    if (t.includes('flood')) return 'flood';
    if (t.includes('security')) return 'security';
    return 'other';
  }

  function capitalize(s) { 
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1); 
  }

  function maskPhoneNumber(phone) {
    if (!phone) return '—';
    const str = String(phone).trim();
    if (str.length <= 5) return '*****';
    if (str.startsWith('+')) {
      const prefix = str.slice(0, 4);
      const suffix = str.slice(-4);
      return `${prefix}*****${suffix}`;
    } else if (str.length >= 10) {
      const prefix = str.slice(0, 3);
      const suffix = str.slice(-4);
      return `${prefix}*****${suffix}`;
    } else {
      const prefix = str.slice(0, 2);
      const suffix = str.slice(-2);
      return `${prefix}*****${suffix}`;
    }
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

  let incomingList = [];
  let knownIds = new Set();

  async function loadData(isPolling = false) {
    try {
      const res = await fetch('../api/reports.php?action=list&status=pending&limit=100');
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const newList = json.data.reports || [];
        
        // Detect if there are changes
        const newIds = new Set(newList.map(r => r.id));
        const hasChanged = newList.length !== incomingList.length || 
                           newList.some((r, i) => !incomingList[i] || incomingList[i].id !== r.id);

        if (hasChanged || !isPolling) {
          incomingList = newList;
          knownIds = newIds;
          filterLocal();
          updateIncomingStats(incomingList);
        }
      }
    } catch (e) {
      console.warn('Live sync poll error:', e);
    }
  }

  function updateIncomingStats(list) {
    const totalEl = document.getElementById('statIncomingTotal');
    const critEl = document.getElementById('statIncomingCritical');
    const pendEl = document.getElementById('statIncomingPending');
    const assEl = document.getElementById('statIncomingAssigned');

    if (totalEl) totalEl.textContent = list.length;
    if (critEl) critEl.textContent = list.filter(r => r.priority === 'critical').length;
    if (pendEl) pendEl.textContent = list.filter(r => r.status === 'pending').length;
    if (assEl) assEl.textContent = list.filter(r => r.assigned_at).length;
  }

  function renderReports(reports) {
    if (!reports || reports.length === 0) {
      const emptyMsg = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i data-lucide="inbox"></i>
              <h3>No Incoming Reports</h3>
              <p>No new emergency reports pending response at this time.</p>
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
            <p>No new emergency reports pending response at this time.</p>
          </div>
        `;
      }
      refreshIcons();
      return;
    }

    if (reportsBody) {
      reportsBody.innerHTML = reports.map(r => `
        <tr>
          <td><span class="report-id">${escapeHTML(r.reportCode || ('RL-' + r.id))}</span></td>
          <td>
            <div class="emergency-type ${escapeHTML(getTypeClass(r.type))}">
              <i data-lucide="${escapeHTML(getIconForType(r.type))}"></i>
              ${escapeHTML(r.type || 'Emergency')}
            </div>
          </td>
          <td>
            <div class="location-text">
              <span class="primary">${escapeHTML(r.landmark || r.lga)}</span>
              <span class="secondary">${escapeHTML(r.state)}</span>
            </div>
          </td>
          <td>
            <span class="phone-masked" style="font-family: 'SF Mono', Monaco, monospace; font-size: 12px; font-weight: 500; color: var(--text-soft);">
              ${escapeHTML(maskPhoneNumber(r.reporter || r.reporter_phone))}
            </span>
          </td>
          <td><span class="priority-badge ${escapeHTML((r.priority || 'normal').toLowerCase())}">${escapeHTML(capitalize(r.priority || 'Normal'))}</span></td>
          <td>
            <div class="action-buttons" style="display: flex; gap: 6px;">
              <a href="report-details.php?id=${r.id}" class="btn btn-secondary btn-sm">
                <i data-lucide="eye"></i> View
              </a>
              <button type="button" class="btn btn-primary btn-sm" onclick="acceptIncident(${r.id})">
                <i data-lucide="check"></i> Accept
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    if (reportCards) {
      reportCards.innerHTML = reports.map(r => `
        <div class="report-card-item">
          <div class="report-card-top">
            <span class="report-card-id">${escapeHTML(r.reportCode || ('RL-' + r.id))}</span>
            <span class="priority-badge ${escapeHTML(r.priority)}">${escapeHTML(capitalize(r.priority))}</span>
          </div>
          <div class="report-card-body">
            <div class="report-card-field">
              <div class="label">Type</div>
              <div class="value emergency-type ${escapeHTML(getTypeClass(r.type))}">
                <i data-lucide="${escapeHTML(getIconForType(r.type))}"></i> ${escapeHTML(r.type || 'Emergency')}
              </div>
            </div>
            <div class="report-card-field">
              <div class="label">Location</div>
              <div class="value">${escapeHTML(r.landmark || r.lga)}, ${escapeHTML(r.state)}</div>
            </div>
            <div class="report-card-field">
              <div class="label">Receive</div>
              <div class="value" style="font-family: 'SF Mono', Monaco, monospace;">${escapeHTML(maskPhoneNumber(r.reporter || r.reporter_phone))}</div>
            </div>
          </div>
          <div class="report-card-actions" style="display: flex; gap: 8px;">
            <a href="report-details.php?id=${r.id}" class="btn btn-secondary" style="flex: 1; justify-content: center;">
              <i data-lucide="eye"></i> View
            </a>
            <button type="button" class="btn btn-primary" style="flex: 1; justify-content: center;" onclick="acceptIncident(${r.id})">
              <i data-lucide="check"></i> Accept
            </button>
          </div>
        </div>
      `).join('');
    }

    refreshIcons();
  }

  function formatTimeShort(d) {
    if (!d) return 'Just now';
    return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  // Filter listeners
  const searchInput = document.getElementById('searchInput');
  const priorityFilter = document.getElementById('priorityFilter');
  const typeFilter = document.getElementById('typeFilter');
  const resetFilters = document.getElementById('resetFilters');

  function filterLocal() {
    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const p = (priorityFilter ? priorityFilter.value : '').toLowerCase();
    const t = (typeFilter ? typeFilter.value : '').toLowerCase();

    const filtered = incomingList.filter(r => {
      const matchQ = !q || (r.reportCode && r.reportCode.toLowerCase().includes(q)) || 
                           (r.type && r.type.toLowerCase().includes(q)) || 
                           (r.landmark && r.landmark.toLowerCase().includes(q)) ||
                           (r.state && r.state.toLowerCase().includes(q)) ||
                           (r.lga && r.lga.toLowerCase().includes(q));
      const matchP = !p || (r.priority && r.priority.toLowerCase() === p);
      const matchT = !t || (r.type && r.type.toLowerCase().includes(t));
      return matchQ && matchP && matchT;
    });

    renderReports(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', filterLocal);
  if (priorityFilter) priorityFilter.addEventListener('change', filterLocal);
  if (typeFilter) typeFilter.addEventListener('change', filterLocal);
  if (resetFilters) {
    resetFilters.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (priorityFilter) priorityFilter.value = '';
      if (typeFilter) typeFilter.value = '';
      renderReports(incomingList);
    });
  }

  window.acceptIncident = async function(reportId) {
    const formData = new FormData();
    formData.append('action', 'update_status');
    formData.append('report_id', reportId);
    formData.append('status', 'responding');
    formData.append('notes', 'Accepted by emergency responder.');

    try {
      const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.status === 'success') {
        loadData(false);
      } else {
        alert(json.message);
      }
    } catch (e) {
      alert('Network error accepting incident.');
    }
  };

  // Initial load
  await loadData(false);

  // Real-time automatic polling every 3 seconds
  if (window._incomingPollInterval) {
    clearInterval(window._incomingPollInterval);
  }
  window._incomingPollInterval = setInterval(() => {
    // Only poll if currently on incoming reports page
    if (document.getElementById('reportsBody') || document.getElementById('incomingReportsContainer')) {
      loadData(true);
    }
  }, 3000);
}

// Auto-run if element exists on regular page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('incomingReportsContainer') || document.getElementById('reportsBody')) {
    initIncomingReports();
  }
});
