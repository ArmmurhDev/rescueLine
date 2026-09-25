/**
 * RescueLine - Admin Emergency Reports Management Scripts
 * Handles real-time MySQL database report queries, cascading filters,
 * slide-over detail panel with live timeline, responder reassignment, and status transitions.
 */

// Nigerian States and LGAs structure
const STATES_LGA = {
  'Kaduna': ['Kaduna South', 'Kaduna North', 'Zaria', 'Chikun', 'Kaura', 'Igabi', 'Makarfi', 'Sanga'],
  'Kano': ['Kano Municipal', 'Fagge', 'Gwale', 'Tarauni', 'Nassarawa', 'Dala', 'Ungogo'],
  'FCT Abuja': ['Abaji', 'Abuja Municipal', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali'],
  'Lagos': ['Ikeja', 'Etiosa', 'Lagos Mainland', 'Surulere', 'Apapa', 'Kosofe'],
  'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Oyigbo', 'Tai'],
  'Plateau': ['Jos North', 'Jos South', 'Jos East', 'Barkin Ladi', 'Bokkos'],
  'Niger': ['Minna', 'Bida', 'Suleja', 'Chanchaga', 'Paikoro'],
  'Oyo': ['Ibadan North', 'Ibadan South', 'Ibadan South-West', 'Egbeda', 'Oluyole'],
  'Enugu': ['Enugu North', 'Enugu South', 'Enugu East', 'Nkanu', 'Udi'],
  'Borno': ['Maiduguri', 'Jere', 'Bama', 'Gubio', 'Monguno']
};

let reports = [];
let availableRespondents = [];
let filteredReports = [];
let currentPage = 1;
let perPage = 20;
let currentDetailReport = null;
let currentReassignReportId = null;
let activeStatusFilter = '';

/* =========================================================
   INITIALIZATION
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initStateDropdown();
  initEventListeners();
  initModalListeners();
  loadReportsData();
});

/* =========================================================
   HELPERS
   ========================================================= */
function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatShortDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function maskPhone(phone) {
  if (!phone) return '—';
  const clean = String(phone).trim();
  if (clean.length >= 7) {
    return clean.slice(0, 4) + '*****' + clean.slice(-3);
  }
  return clean;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function getTypeIcon(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('fire')) return 'flame';
  if (t.includes('accident') || t.includes('crash')) return 'car';
  if (t.includes('medical') || t.includes('health')) return 'heart-pulse';
  if (t.includes('flood') || t.includes('water')) return 'droplets';
  if (t.includes('security') || t.includes('robbery') || t.includes('crime')) return 'shield-alert';
  return 'alert-circle';
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.className = 'toast show' + (type === 'error' ? ' error' : '');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function initModalListeners() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      closeDetailPanel();
    }
  });
}

/* =========================================================
   DATABASE DATA LOADING
   ========================================================= */
async function loadReportsData() {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const lgaFilter = document.getElementById('lgaFilter');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');

  const q = searchInput ? encodeURIComponent(searchInput.value.trim()) : '';
  const s = stateFilter ? encodeURIComponent(stateFilter.value) : '';
  const l = lgaFilter ? encodeURIComponent(lgaFilter.value) : '';
  const t = typeFilter ? encodeURIComponent(typeFilter.value) : '';
  const st = encodeURIComponent(activeStatusFilter || (statusFilter ? statusFilter.value : ''));

  try {
    const res = await fetch(`../api/reports.php?action=list&search=${q}&state=${s}&lga=${l}&type=${t}&status=${st}`);
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      reports = (json.data.reports || []).map(r => normalizeReport(r));
      availableRespondents = json.data.respondents || [];
      filteredReports = [...reports];
      renderTable();
      updateStats(json.data.stats);
    }
  } catch (err) {
    console.error('Error fetching reports:', err);
    showToast('Failed to load emergency reports from server.', 'error');
  }
}

function normalizeReport(r) {
  return {
    dbId: r.id,
    id: r.reportCode || ('RL-' + String(r.id).padStart(4, '0')),
    type: r.type || r.category_name || 'Emergency',
    state: r.state || '',
    lga: r.lga || '',
    location: r.landmark || `${r.lga}, ${r.state}`,
    reporter: r.reporter || r.reporter_phone || 'Citizen',
    reporterName: r.reporter_name || 'Citizen',
    respondent: r.assignedRespondent ? {
      id: r.assignedRespondentId,
      name: r.assignedRespondent,
      phone: r.respondentPhone
    } : null,
    status: r.status || 'pending',
    priority: r.priority || 'medium',
    dateReceived: r.receivedAt ? new Date(r.receivedAt) : new Date(),
    dateAssigned: r.assigned_at ? new Date(r.assigned_at) : null,
    dateResponded: r.responding_at ? new Date(r.responding_at) : null,
    dateResolved: r.resolved_at ? new Date(r.resolved_at) : null,
    description: r.description || '',
    source: r.source || 'web'
  };
}

/* =========================================================
   STATE & LGA DROPDOWNS
   ========================================================= */
function initStateDropdown() {
  const stateFilter = document.getElementById('stateFilter');
  if (!stateFilter) return;

  stateFilter.innerHTML = '<option value="">All States</option>';
  Object.keys(STATES_LGA).forEach(state => {
    const opt = document.createElement('option');
    opt.value = state;
    opt.textContent = state;
    stateFilter.appendChild(opt);
  });
}

function initEventListeners() {
  const filterToggle = document.getElementById('filterToggle');
  const advFilters = document.getElementById('advancedFilters');
  if (filterToggle && advFilters) {
    filterToggle.addEventListener('click', () => {
      advFilters.classList.toggle('open');
      filterToggle.classList.toggle('active');
    });
  }

  const stateFilter = document.getElementById('stateFilter');
  const lgaFilter = document.getElementById('lgaFilter');
  if (stateFilter && lgaFilter) {
    stateFilter.addEventListener('change', () => {
      const state = stateFilter.value;
      if (state && STATES_LGA[state]) {
        lgaFilter.innerHTML = '<option value="">All LGAs</option>';
        STATES_LGA[state].forEach(lga => {
          const opt = document.createElement('option');
          opt.value = lga;
          opt.textContent = lga;
          lgaFilter.appendChild(opt);
        });
        lgaFilter.disabled = false;
      } else {
        lgaFilter.innerHTML = '<option value="">Select state first</option>';
        lgaFilter.disabled = true;
      }
      applyFilters();
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(applyFilters, 300);
    });
  }

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter) typeFilter.addEventListener('change', applyFilters);

  if (lgaFilter) lgaFilter.addEventListener('change', applyFilters);

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      activeStatusFilter = statusFilter.value;
      applyFilters();
    });
  }

  const perPageSel = document.getElementById('perPage');
  if (perPageSel) {
    perPageSel.addEventListener('change', () => {
      perPage = parseInt(perPageSel.value, 10) || 20;
      currentPage = 1;
      renderTable();
    });
  }
}

function filterByStatus(status) {
  activeStatusFilter = status;
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) statusFilter.value = status;

  document.querySelectorAll('.stat-mini').forEach(card => {
    card.classList.toggle('active-filter', card.dataset.filterStatus === status);
  });
  applyFilters();
}

function applyFilters() {
  currentPage = 1;
  loadReportsData();

  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const typeFilter = document.getElementById('typeFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');

  const hasFilters = Boolean((searchInput && searchInput.value) || (stateFilter && stateFilter.value) || (typeFilter && typeFilter.value) || activeStatusFilter);
  if (clearFiltersBtn) {
    clearFiltersBtn.classList.toggle('visible', hasFilters);
  }
}

function clearAllFilters() {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const lgaFilter = document.getElementById('lgaFilter');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');

  if (searchInput) searchInput.value = '';
  if (stateFilter) stateFilter.value = '';
  if (lgaFilter) {
    lgaFilter.innerHTML = '<option value="">Select state first</option>';
    lgaFilter.disabled = true;
  }
  if (typeFilter) typeFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  activeStatusFilter = '';

  document.querySelectorAll('.stat-mini').forEach(c => c.classList.remove('active-filter'));
  if (clearFiltersBtn) clearFiltersBtn.classList.remove('visible');
  applyFilters();
}

/* =========================================================
   RENDER TABLE & CARDS
   ========================================================= */
function renderTable() {
  const tableBody = document.getElementById('tableBody');
  const cardsContainer = document.getElementById('reportCards');
  const resultCount = document.getElementById('resultCount');

  if (resultCount) resultCount.textContent = filteredReports.length;

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const pageData = filteredReports.slice(start, end);

  if (pageData.length === 0) {
    const emptyHtml = `
      <div class="empty-state">
        <i data-lucide="file-x"></i>
        <h3>No emergency reports found</h3>
        <p>Try adjusting your search criteria or active filters.</p>
        <button class="btn btn-primary" onclick="clearAllFilters()">
          <i data-lucide="refresh-cw"></i>
          Reset Filters
        </button>
      </div>
    `;
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="8">${emptyHtml}</td></tr>`;
    if (cardsContainer) cardsContainer.innerHTML = emptyHtml;
    renderPagination();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  if (tableBody) {
    tableBody.innerHTML = pageData.map(r => `
      <tr>
        <td><span class="report-id" onclick="openDetailPanel('${r.id}')">${escapeHTML(r.id)}</span></td>
        <td>
          <div class="type-cell ${escapeHTML(r.type.toLowerCase())}">
            <i data-lucide="${getTypeIcon(r.type)}"></i>
            <span>${escapeHTML(r.type)}</span>
          </div>
        </td>
        <td>
          <div class="location-cell">
            <span class="primary">${escapeHTML(r.location)}</span>
            <span class="secondary">${escapeHTML(r.state)}</span>
          </div>
        </td>
        <td>
          <div class="reporter-cell">
            <span class="reporter-phone">${maskPhone(r.reporter)}</span>
          </div>
        </td>
        <td>
          ${r.respondent ? `
            <div class="respondent-cell">
              <div class="resp-avatar">${getInitials(r.respondent.name)}</div>
              <div>
                <div class="resp-name">${escapeHTML(r.respondent.name)}</div>
                <div style="font-size: 11px; color: var(--muted);">${maskPhone(r.respondent.phone)}</div>
              </div>
            </div>
          ` : `
            <div class="respondent-cell">
              <div class="resp-avatar unassigned"><i data-lucide="user-x" style="width: 14px; height: 14px;"></i></div>
              <span class="resp-name unassigned">Unassigned</span>
            </div>
          `}
        </td>
        <td>
          <span class="status-badge ${r.status}">
            ${capitalize(r.status)}
          </span>
        </td>
        <td>
          <div class="date-cell">
            <span>${formatDate(r.dateReceived)}</span>
          </div>
        </td>
        <td>
          <div class="action-group">
            <button class="act-btn act-btn-view" title="View details" onclick="openDetailPanel('${r.id}')">
              <i data-lucide="eye"></i> Details
            </button>
            <button class="act-btn act-btn-reassign" title="Assign Responder" onclick="openReassignModal('${r.id}')">
              <i data-lucide="user-check"></i> Assign
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (cardsContainer) {
    cardsContainer.innerHTML = pageData.map(r => `
      <div class="report-card-item">
        <div class="report-card-top">
          <div>
            <span class="report-id" onclick="openDetailPanel('${r.id}')">${escapeHTML(r.id)}</span>
            <div class="type-cell ${escapeHTML(r.type.toLowerCase())}" style="margin-top: 4px;">
              <i data-lucide="${getTypeIcon(r.type)}"></i>
              <span>${escapeHTML(r.type)}</span>
            </div>
          </div>
          <span class="status-badge ${r.status}">${capitalize(r.status)}</span>
        </div>
        <div class="report-card-body">
          <div class="report-card-field">
            <div class="label">Location</div>
            <div class="value">${escapeHTML(r.location)}</div>
          </div>
          <div class="report-card-field">
            <div class="label">Reporter</div>
            <div class="value">${maskPhone(r.reporter)}</div>
          </div>
          <div class="report-card-field">
            <div class="label">Responder</div>
            <div class="value">${escapeHTML(r.respondent ? r.respondent.name : 'Unassigned')}</div>
          </div>
          <div class="report-card-field">
            <div class="label">Received</div>
            <div class="value" style="font-size: 11px;">${formatDate(r.dateReceived)}</div>
          </div>
        </div>
        <div class="report-card-actions">
          <button class="act-btn act-btn-view" onclick="openDetailPanel('${r.id}')"><i data-lucide="eye"></i> Details</button>
          <button class="act-btn act-btn-reassign" onclick="openReassignModal('${r.id}')"><i data-lucide="user-check"></i> Assign</button>
        </div>
      </div>
    `).join('');
  }

  renderPagination();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderPagination() {
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');
  if (!paginationInfo || !paginationControls) return;

  const totalPages = Math.ceil(filteredReports.length / perPage) || 1;
  const start = filteredReports.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, filteredReports.length);

  paginationInfo.textContent = `Showing ${start}–${end} of ${filteredReports.length} reports`;

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goPage(${currentPage - 1})"><i data-lucide="chevron-left"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goPage(${currentPage + 1})"><i data-lucide="chevron-right"></i></button>`;
  paginationControls.innerHTML = html;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function goPage(p) {
  const totalPages = Math.ceil(filteredReports.length / perPage) || 1;
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderTable();
}

function updateStats(stats) {
  if (!stats) return;
  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statResponding = document.getElementById('statResponding');
  const statResolved = document.getElementById('statResolved');

  if (statTotal) statTotal.textContent = Number(stats.total || 0).toLocaleString();
  if (statPending) statPending.textContent = Number(stats.pending || 0).toLocaleString();
  if (statResponding) statResponding.textContent = Number(stats.responding || 0).toLocaleString();
  if (statResolved) statResolved.textContent = Number(stats.resolved || 0).toLocaleString();
}

/* =========================================================
   DETAIL SLIDE-OVER PANEL (LIVE FROM DB)
   ========================================================= */
async function openDetailPanel(id) {
  const r = reports.find(x => x.id === id);
  if (!r) return;

  currentDetailReport = r;

  // Set header info
  const detailId = document.getElementById('detailId');
  const detailStatus = document.getElementById('detailStatusBadge');
  const detailType = document.getElementById('detailType');
  const detailTypeIcon = document.getElementById('detailTypeIcon');

  if (detailId) detailId.textContent = r.id;
  if (detailStatus) {
    detailStatus.textContent = capitalize(r.status);
    detailStatus.className = `status-badge ${r.status}`;
  }
  if (detailType) detailType.textContent = r.type;
  if (detailTypeIcon) detailTypeIcon.setAttribute('data-lucide', getTypeIcon(r.type));

  // Action buttons in detail
  const actionBtns = document.getElementById('detailActionButtons');
  if (actionBtns) {
    actionBtns.innerHTML = `
      <button class="btn btn-sm btn-primary" onclick="openReassignModal('${r.id}')">
        <i data-lucide="user-check"></i> Assign / Reassign
      </button>
      ${r.status !== 'resolved' ? `
        <button class="btn btn-sm btn-danger" onclick="markReportResolved(${r.dbId})">
          <i data-lucide="check-circle-2"></i> Mark Resolved
        </button>
      ` : ''}
      <button class="btn btn-sm btn-ghost" onclick="closeDetailPanel()">
        <i data-lucide="arrow-left"></i> Back
      </button>
    `;
  }

  // Info grid
  const infoGrid = document.getElementById('detailInfoGrid');
  if (infoGrid) {
    infoGrid.innerHTML = `
      <div class="info-item">
        <div class="info-label">Incident Type</div>
        <div class="info-value">${escapeHTML(r.type)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Priority</div>
        <div class="info-value" style="font-weight: 700; color: ${r.priority === 'critical' ? 'var(--red)' : 'var(--text)'};">${capitalize(r.priority)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">State / LGA</div>
        <div class="info-value">${escapeHTML(r.state)} • ${escapeHTML(r.lga)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Landmark / Address</div>
        <div class="info-value">${escapeHTML(r.location)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Reporter Contact</div>
        <div class="info-value">${maskPhone(r.reporter)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Reporting Channel</div>
        <div class="info-value" style="text-transform: uppercase;">${escapeHTML(r.source)}</div>
      </div>
    `;
  }

  // Description
  const descEl = document.getElementById('detailDescription');
  if (descEl) {
    descEl.textContent = r.description || 'No additional incident description provided.';
  }

  // Assignment grid
  const assignGrid = document.getElementById('detailAssignmentGrid');
  if (assignGrid) {
    if (r.respondent) {
      assignGrid.innerHTML = `
        <div class="info-item">
          <div class="info-label">Assigned Responder</div>
          <div class="info-value" style="font-weight: 700;">${escapeHTML(r.respondent.name)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Responder Contact</div>
          <div class="info-value">${maskPhone(r.respondent.phone)}</div>
        </div>
      `;
    } else {
      assignGrid.innerHTML = `
        <div class="info-item" style="grid-column: span 2;">
          <div class="info-value" style="color: var(--muted); font-style: italic;">No emergency respondent has been assigned to this report yet.</div>
        </div>
      `;
    }
  }

  // Open panel
  const panel = document.getElementById('detailPanel');
  const overlay = document.getElementById('detailOverlay');
  if (panel) panel.classList.add('active');
  if (overlay) overlay.classList.add('active');

  // Load live timeline
  loadReportTimeline(r.dbId);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function loadReportTimeline(dbId) {
  const timelineEl = document.getElementById('detailTimeline');
  if (!timelineEl) return;

  timelineEl.innerHTML = '<div style="color: var(--muted); font-size: 12px;">Loading timeline history...</div>';

  try {
    const res = await fetch(`../api/reports.php?action=get&id=${dbId}`);
    const json = await res.json();
    if (json.status === 'success' && json.data && json.data.timeline) {
      const items = json.data.timeline;
      if (items.length === 0) {
        timelineEl.innerHTML = `
          <div class="timeline-item done">
            <div class="timeline-dot done"><i data-lucide="check"></i></div>
            <div class="timeline-content">
              <div class="timeline-title">Report Created</div>
              <div class="timeline-time">${formatDate(currentDetailReport ? currentDetailReport.dateReceived : new Date())}</div>
              <div class="timeline-notes">Initial incident report received in database.</div>
            </div>
          </div>
        `;
      } else {
        timelineEl.innerHTML = items.map((t, idx) => `
          <div class="timeline-item done">
            <div class="timeline-dot done"><i data-lucide="${t.action.includes('Assign') ? 'user-check' : (t.action.includes('Resolved') ? 'check-circle' : 'activity')}"></i></div>
            <div class="timeline-content">
              <div class="timeline-title">${escapeHTML(t.action)} ${t.new_status ? `(${capitalize(t.new_status)})` : ''}</div>
              <div class="timeline-time">${formatDate(t.created_at)}</div>
              <div class="timeline-notes">${escapeHTML(t.note || '')}</div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    timelineEl.innerHTML = '<div style="color: var(--muted); font-size: 12px;">Timeline logged upon creation.</div>';
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeDetailPanel() {
  const panel = document.getElementById('detailPanel');
  const overlay = document.getElementById('detailOverlay');
  if (panel) panel.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

/* =========================================================
   REASSIGN MODAL & LOGIC
   ========================================================= */
function openReassignModal(reportId) {
  const r = reports.find(x => x.id === reportId);
  if (!r) return;

  currentReassignReportId = r.dbId;

  const reportIdEl = document.getElementById('reassignReportId');
  if (reportIdEl) reportIdEl.textContent = r.id;

  const curAssign = document.getElementById('currentAssignment');
  if (curAssign) {
    if (r.respondent) {
      curAssign.innerHTML = `
        <div class="resp-avatar">${getInitials(r.respondent.name)}</div>
        <div>
          <div class="name">${escapeHTML(r.respondent.name)}</div>
          <div class="meta">${maskPhone(r.respondent.phone)} • ${escapeHTML(r.state)} Unit</div>
        </div>
      `;
    } else {
      curAssign.innerHTML = `
        <div class="resp-avatar unassigned"><i data-lucide="user-x"></i></div>
        <div>
          <div class="name" style="color: var(--muted);">Unassigned</div>
          <div class="meta">Awaiting responder assignment</div>
        </div>
      `;
    }
  }

  // Populate responders dropdown
  const select = document.getElementById('respondentSelect');
  if (select) {
    select.innerHTML = '<option value="">Select a responder...</option>';
    availableRespondents.forEach(resp => {
      const selected = r.respondent && Number(r.respondent.id) === Number(resp.id) ? 'selected' : '';
      select.innerHTML += `<option value="${resp.id}" ${selected}>${escapeHTML(resp.name)} (${escapeHTML(resp.state || 'National')} • ${resp.unit || 'Responder'})</option>`;
    });
  }

  const notes = document.getElementById('reassignNotes');
  if (notes) notes.value = '';

  openModal('reassignModal');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function submitReassign() {
  const select = document.getElementById('respondentSelect');
  const notes = document.getElementById('reassignNotes');

  if (!select || !select.value) {
    showToast('Please select a responder.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('action', 'assign');
  formData.append('report_id', currentReassignReportId);
  formData.append('respondent_id', select.value);
  formData.append('notes', notes ? notes.value.trim() : '');

  try {
    const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.status === 'success') {
      closeModal('reassignModal');
      showToast(json.message);
      loadReportsData();
      if (currentDetailReport && currentDetailReport.dbId === currentReassignReportId) {
        openDetailPanel(currentDetailReport.id);
      }
    } else {
      showToast(json.message || 'Assignment failed.', 'error');
    }
  } catch (err) {
    showToast('Network error assigning report.', 'error');
  }
}

/* =========================================================
   RESOLVE REPORT
   ========================================================= */
async function markReportResolved(dbId) {
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMsg = document.getElementById('confirmMessage');
  const confirmAction = document.getElementById('confirmAction');

  if (confirmTitle) confirmTitle.textContent = 'Resolve Incident?';
  if (confirmMsg) confirmMsg.textContent = 'Are you sure you want to mark this emergency report as resolved in the database?';
  if (confirmAction) {
    confirmAction.className = 'btn btn-primary';
    confirmAction.textContent = 'Mark Resolved';
    confirmAction.onclick = async () => {
      closeModal('confirmModal');
      const formData = new FormData();
      formData.append('action', 'update_status');
      formData.append('report_id', dbId);
      formData.append('status', 'resolved');
      formData.append('notes', 'Incident marked resolved by administrator');

      try {
        const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.status === 'success') {
          showToast(json.message);
          loadReportsData();
          if (currentDetailReport && currentDetailReport.dbId === dbId) {
            closeDetailPanel();
          }
        } else {
          showToast(json.message || 'Operation failed.', 'error');
        }
      } catch (e) {
        showToast('Error updating report status.', 'error');
      }
    };
  }
  openModal('confirmModal');
}

/* =========================================================
   EXPORT CSV
   ========================================================= */
function exportReportsCSV() {
  window.location.href = '../api/reports.php?action=export';
}
