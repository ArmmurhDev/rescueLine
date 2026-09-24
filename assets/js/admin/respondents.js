/**
 * RescueLine - Admin Reports Management Scripts
 * Handles emergency reports table, cascading LGA filters, sorting,
 * slide-over detail panel, reassign modal, and status timeline.
 */

// Nigerian States and LGAs
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

const RESPONDENTS = [
  { id: 1, name: 'Musa Ibrahim', phone: '08031234567', email: 'musa.ibrahim@rescueline.ng', state: 'Kaduna', status: 'active' },
  { id: 2, name: 'Amina Bello', phone: '08123456789', email: 'amina.bello@rescueline.ng', state: 'Kaduna', status: 'active' },
  { id: 3, name: 'Yusuf Danladi', phone: '07056789012', email: 'yusuf.danladi@rescueline.ng', state: 'Kano', status: 'active' },
  { id: 4, name: 'Fatima Ahmed', phone: '09098765432', email: 'fatima.ahmed@rescueline.ng', state: 'FCT Abuja', status: 'active' },
  { id: 5, name: 'Sani Mohammed', phone: '08065432109', email: 'sani.mohammed@rescueline.ng', state: 'Kaduna', status: 'active' },
  { id: 6, name: 'Chinedu Okafor', phone: '08134567890', email: 'chinedu.okafor@rescueline.ng', state: 'Lagos', status: 'active' },
  { id: 7, name: 'Aisha Okonkwo', phone: '07087654321', email: 'aisha.okonkwo@rescueline.ng', state: 'FCT Abuja', status: 'active' },
  { id: 8, name: 'Emeka Nwosu', phone: '09023456781', email: 'emeka.nwosu@rescueline.ng', state: 'Rivers', status: 'active' },
  { id: 9, name: 'Halima Yusuf', phone: '08056781234', email: 'halima.yusuf@rescueline.ng', state: 'Kano', status: 'active' },
  { id: 10, name: 'Tunde Adeyemi', phone: '08145678901', email: 'tunde.adeyemi@rescueline.ng', state: 'Oyo', status: 'active' },
  { id: 11, name: 'Zainab Aliyu', phone: '07067890123', email: 'zainab.aliyu@rescueline.ng', state: 'Plateau', status: 'active' },
  { id: 12, name: 'Ibrahim Musa', phone: '09034567890', email: 'ibrahim.musa@rescueline.ng', state: 'Niger', status: 'active' }
];

// Generate realistic mock reports
function generateReports() {
  const types = ['Fire', 'Accident', 'Medical', 'Security', 'Flood'];
  const statuses = ['pending', 'responding', 'resolved'];
  const states = Object.keys(STATES_LGA);
  const reporters = ['0803***219', '0812***445', '0705***882', '0909***117', '0806***334', '0813***556', '0708***778', '0902***991'];
  const descriptions = {
    'Fire': 'Large fire reported at the location. Multiple structures involved. Smoke visible from several kilometers away. Evacuation in progress.',
    'Accident': 'Multi-vehicle accident reported. Injuries reported. Traffic completely blocked. Ambulance and rescue team needed urgently.',
    'Medical': 'Medical emergency reported. Person in critical condition requiring immediate medical attention. Vital signs unstable.',
    'Security': 'Security incident reported. Dangerous situation in progress. Immediate law enforcement response required.',
    'Flood': 'Flooding reported in the area. Water levels rising rapidly. Several buildings affected. Rescue operations needed.'
  };

  const generated = [];
  const baseDate = new Date('2024-01-15T08:00:00');

  for (let i = 1; i <= 48; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const lgas = STATES_LGA[state];
    const lga = lgas[Math.floor(Math.random() * lgas.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const reporter = reporters[Math.floor(Math.random() * reporters.length)];
    const receivedDate = new Date(baseDate.getTime() - i * 3600000 * 2);

    let respondent = null;
    let dateAssigned = null, dateResponded = null, dateResolved = null;

    if (status !== 'pending') {
      const stateRespondents = RESPONDENTS.filter(r => r.state === state && r.status === 'active');
      if (stateRespondents.length > 0) {
        respondent = stateRespondents[Math.floor(Math.random() * stateRespondents.length)];
        dateAssigned = new Date(receivedDate.getTime() + 300000 + Math.random() * 600000);
      }
    }

    if (status === 'responding' && respondent) {
      dateResponded = new Date(dateAssigned.getTime() + 600000 + Math.random() * 1200000);
    }

    if (status === 'resolved' && respondent) {
      dateResponded = new Date(dateAssigned.getTime() + 600000 + Math.random() * 1200000);
      dateResolved = new Date(dateResponded.getTime() + 1800000 + Math.random() * 3600000);
    }

    generated.push({
      id: `RL-${String(i).padStart(4, '0')}`,
      type,
      state,
      lga,
      location: `${lga} Area, ${state}`,
      reporter,
      respondent,
      status,
      dateReceived: receivedDate,
      dateAssigned,
      dateResponded,
      dateResolved,
      description: descriptions[type]
    });
  }

  return generated;
}

let reports = generateReports();
let filteredReports = [...reports];
let currentPage = 1;
let perPage = 20;
let currentSort = { column: 'date', direction: 'desc' };
let currentDetailReport = null;
let currentReassignReport = null;
let activeStatusFilter = '';

/* =========================================================
   INITIALIZE STATE DROPDOWN
   ========================================================= */
function initStateDropdown() {
  const stateFilter = document.getElementById('stateFilter');
  if (!stateFilter) return;

  // Clear existing options except default
  stateFilter.innerHTML = '<option value="">All States</option>';

  Object.keys(STATES_LGA).sort().forEach(state => {
    const opt = document.createElement('option');
    opt.value = state;
    opt.textContent = state;
    stateFilter.appendChild(opt);
  });
}

/* =========================================================
   FILTERS
   ========================================================= */
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const lgaFilter = document.getElementById('lgaFilter');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  const clearFiltersBtn = document.getElementById('clearFilters');

  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const state = stateFilter ? stateFilter.value : '';
  const lga = lgaFilter ? lgaFilter.value : '';
  const type = typeFilter ? typeFilter.value : '';
  const status = statusFilter ? statusFilter.value : '';
  const from = (dateFrom && dateFrom.value) ? new Date(dateFrom.value) : null;
  const to = (dateTo && dateTo.value) ? new Date(dateTo.value + 'T23:59:59') : null;

  filteredReports = reports.filter(r => {
    const matchQ = !q ||
      r.id.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q) ||
      r.lga.toLowerCase().includes(q) ||
      r.reporter.includes(q) ||
      (r.respondent && r.respondent.name.toLowerCase().includes(q));
    const matchState = !state || r.state === state;
    const matchLga = !lga || r.lga === lga;
    const matchType = !type || r.type === type;
    const matchStatus = !status || r.status === status;
    const matchFrom = !from || r.dateReceived >= from;
    const matchTo = !to || r.dateReceived <= to;

    return matchQ && matchState && matchLga && matchType && matchStatus && matchFrom && matchTo;
  });

  sortReports();
  currentPage = 1;
  renderTable();
  updateStats();

  const hasFilters = Boolean(q || state || lga || type || status || (dateFrom && dateFrom.value) || (dateTo && dateTo.value) || activeStatusFilter);
  if (clearFiltersBtn) {
    clearFiltersBtn.classList.toggle('visible', hasFilters);
  }
}

function filterByStatus(status) {
  activeStatusFilter = status;
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) statusFilter.value = status;

  document.querySelectorAll('.stat-mini').forEach(el => el.classList.remove('active-filter'));
  if (status) {
    const activeMini = document.querySelector(`.stat-mini[data-filter-status="${status}"]`);
    if (activeMini) activeMini.classList.add('active-filter');
  } else {
    const totalMini = document.querySelector('.stat-mini.total');
    if (totalMini) totalMini.classList.add('active-filter');
  }
  applyFilters();
}

function clearAllFilters() {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const lgaFilter = document.getElementById('lgaFilter');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');

  if (searchInput) searchInput.value = '';
  if (stateFilter) stateFilter.value = '';
  if (lgaFilter) {
    lgaFilter.value = '';
    lgaFilter.disabled = true;
    lgaFilter.innerHTML = '<option value="">Select state first</option>';
  }
  if (typeFilter) typeFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  if (dateFrom) dateFrom.value = '';
  if (dateTo) dateTo.value = '';
  activeStatusFilter = '';

  document.querySelectorAll('.stat-mini').forEach(el => el.classList.remove('active-filter'));
  const totalMini = document.querySelector('.stat-mini.total');
  if (totalMini) totalMini.classList.add('active-filter');
  applyFilters();
}

/* =========================================================
   SORTING
   ========================================================= */
function sortReports() {
  const { column, direction } = currentSort;
  filteredReports.sort((a, b) => {
    let aVal, bVal;
    switch (column) {
      case 'id': aVal = a.id; bVal = b.id; break;
      case 'type': aVal = a.type; bVal = b.type; break;
      case 'location': aVal = a.state + a.lga; bVal = b.state + b.lga; break;
      case 'reporter': aVal = a.reporter; bVal = b.reporter; break;
      case 'respondent': aVal = a.respondent?.name || 'zzz'; bVal = b.respondent?.name || 'zzz'; break;
      case 'date': aVal = a.dateReceived.getTime(); bVal = b.dateReceived.getTime(); break;
      case 'status': aVal = a.status; bVal = b.status; break;
      default: aVal = a.id; bVal = b.id;
    }
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/* =========================================================
   HELPERS
   ========================================================= */
function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getTypeIcon(type) {
  const map = {
    'Fire': 'flame',
    'Accident': 'car',
    'Medical': 'heart-pulse',
    'Flood': 'waves',
    'Security': 'shield-alert',
    'Other': 'help-circle'
  };
  return map[type] || 'help-circle';
}

function formatDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(d) {
  if (!d) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function initLucideIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

/* =========================================================
   RENDER TABLE
   ========================================================= */
function renderTable() {
  const tableBody = document.getElementById('tableBody');
  const reportCards = document.getElementById('reportCards');
  const resultCount = document.getElementById('resultCount');
  const paginationBar = document.getElementById('paginationBar');
  const perPageEl = document.getElementById('perPage');

  if (perPageEl) {
    perPage = parseInt(perPageEl.value);
  }

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const pageData = filteredReports.slice(start, end);

  if (resultCount) {
    resultCount.textContent = filteredReports.length.toLocaleString();
  }

  if (pageData.length === 0) {
    const emptyHtml = `
      <div class="empty-state">
        <i data-lucide="inbox"></i>
        <h3>No reports found</h3>
        <p>Try changing your search criteria or clearing the filters.</p>
        <button class="btn btn-secondary" onclick="clearAllFilters()"><i data-lucide="x"></i> Clear Filters</button>
      </div>`;

    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="7">${emptyHtml}</td></tr>`;
    }
    if (reportCards) {
      reportCards.innerHTML = emptyHtml;
    }
    if (paginationBar) {
      paginationBar.style.display = 'none';
    }
    initLucideIcons();
    return;
  }

  if (paginationBar) {
    paginationBar.style.display = 'flex';
  }

  // Desktop Table rows
  if (tableBody) {
    tableBody.innerHTML = pageData.map(r => `
      <tr>
        <td><span class="report-id" onclick="openDetail('${r.id}')">${r.id}</span></td>
        <td>
          <div class="type-cell ${r.type.toLowerCase()}">
            <i data-lucide="${getTypeIcon(r.type)}"></i>
            ${r.type}
          </div>
        </td>
        <td>
          <div class="location-cell">
            <span class="primary">${r.lga}</span>
            <span class="secondary">${r.state}</span>
          </div>
        </td>
        <td><span style="font-family: 'SF Mono', Monaco, monospace; font-size: 12px;">${r.reporter}</span></td>
        <td>
          <div class="date-cell">
            <span class="date">${formatDate(r.dateReceived)}</span>
            <span class="time">${formatTime(r.dateReceived)}</span>
          </div>
        </td>
        <td><span class="status-badge ${r.status}">${capitalize(r.status)}</span></td>
        <td>
          <div class="action-group">
            <button class="act-btn act-btn-view" title="View" onclick="openDetail('${r.id}')"><i data-lucide="eye"></i></button>
            <button class="act-btn act-btn-reassign" title="Reassign" onclick="openReassign('${r.id}')"><i data-lucide="user-check"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Mobile cards
  if (reportCards) {
    reportCards.innerHTML = pageData.map(r => `
      <div class="report-card-item">
        <div class="report-card-top">
          <div>
            <span class="report-id" onclick="openDetail('${r.id}')">${r.id}</span>
            <div class="type-cell ${r.type.toLowerCase()}" style="margin-top: 6px;">
              <i data-lucide="${getTypeIcon(r.type)}"></i>
              ${r.type}
            </div>
          </div>
          <span class="status-badge ${r.status}">${capitalize(r.status)}</span>
        </div>
        <div class="report-card-body">
          <div class="report-card-field">
            <div class="label">Location</div>
            <div class="value">${r.lga}, ${r.state}</div>
          </div>
          <div class="report-card-field">
            <div class="label">Reporter</div>
            <div class="value" style="font-family: 'SF Mono', Monaco, monospace; font-size: 12px;">${r.reporter}</div>
          </div>
          <div class="report-card-field">
            <div class="label">Respondent</div>
            <div class="value">${r.respondent ? r.respondent.name : '<em style="color: var(--muted);">Unassigned</em>'}</div>
          </div>
          <div class="report-card-field">
            <div class="label">Received</div>
            <div class="value" style="font-size: 12px;">${formatDate(r.dateReceived)} ${formatTime(r.dateReceived)}</div>
          </div>
        </div>
        <div class="report-card-actions">
          <button class="act-btn act-btn-view" onclick="openDetail('${r.id}')"><i data-lucide="eye"></i> View</button>
          <button class="act-btn act-btn-reassign" onclick="openReassign('${r.id}')"><i data-lucide="user-check"></i> Reassign</button>
        </div>
      </div>
    `).join('');
  }

  renderPagination();
  initLucideIcons();
}

/* =========================================================
   PAGINATION
   ========================================================= */
function renderPagination() {
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');
  if (!paginationInfo || !paginationControls) return;

  const totalPages = Math.ceil(filteredReports.length / perPage);
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, filteredReports.length);

  paginationInfo.textContent = `Showing ${start}–${end} of ${filteredReports.length.toLocaleString()} reports`;

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goPage(${currentPage - 1})"><i data-lucide="chevron-left"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += `<button class="page-btn" disabled>...</button>`;
      continue;
    }
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goPage(${currentPage + 1})"><i data-lucide="chevron-right"></i></button>`;
  paginationControls.innerHTML = html;
  initLucideIcons();
}

function goPage(p) {
  const totalPages = Math.ceil(filteredReports.length / perPage);
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderTable();
  const tableCard = document.querySelector('.table-card');
  if (tableCard) {
    tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* =========================================================
   STATS UPDATE
   ========================================================= */
function updateStats() {
  const total = reports.length;
  const pending = reports.filter(r => r.status === 'pending').length;
  const responding = reports.filter(r => r.status === 'responding').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statResponding = document.getElementById('statResponding');
  const statResolved = document.getElementById('statResolved');

  if (statTotal) statTotal.textContent = total.toLocaleString();
  if (statPending) statPending.textContent = pending.toLocaleString();
  if (statResponding) statResponding.textContent = responding.toLocaleString();
  if (statResolved) statResolved.textContent = resolved.toLocaleString();
}

/* =========================================================
   DETAIL PANEL
   ========================================================= */
function openDetail(id) {
  const report = reports.find(r => r.id === id);
  if (!report) return;
  currentDetailReport = report;

  const detailId = document.getElementById('detailId');
  const detailType = document.getElementById('detailType');
  const detailTypeIcon = document.getElementById('detailTypeIcon');
  const statusBadge = document.getElementById('detailStatusBadge');
  const infoGrid = document.getElementById('detailInfoGrid');
  const descEl = document.getElementById('detailDescription');
  const assignGrid = document.getElementById('detailAssignmentGrid');

  if (detailId) detailId.textContent = report.id;
  if (detailType) detailType.textContent = `${report.type} Emergency`;
  if (detailTypeIcon) detailTypeIcon.setAttribute('data-lucide', getTypeIcon(report.type));

  if (statusBadge) {
    statusBadge.className = `status-badge ${report.status}`;
    statusBadge.textContent = capitalize(report.status);
  }

  // Info grid
  if (infoGrid) {
    infoGrid.innerHTML = `
      <div class="info-item">
        <div class="info-label">Report ID</div>
        <div class="info-value mono">${report.id}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Type</div>
        <div class="info-value">${report.type}</div>
      </div>
      <div class="info-item">
        <div class="info-label">State</div>
        <div class="info-value">${report.state}</div>
      </div>
      <div class="info-item">
        <div class="info-label">LGA</div>
        <div class="info-value">${report.lga}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Specific Location</div>
        <div class="info-value">${report.location}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Reporter</div>
        <div class="info-value mono">${report.reporter}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date Received</div>
        <div class="info-value">${formatDate(report.dateReceived)} ${formatTime(report.dateReceived)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Current Status</div>
        <div class="info-value"><span class="status-badge ${report.status}">${capitalize(report.status)}</span></div>
      </div>
    `;
  }

  // Description
  if (descEl) descEl.textContent = report.description;

  // Assignment
  if (assignGrid) {
    assignGrid.innerHTML = `
      <div class="info-item">
        <div class="info-label">Assigned Respondent</div>
        <div class="info-value">${report.respondent ? report.respondent.name : '<em style="color: var(--muted);">Unassigned</em>'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Respondent State</div>
        <div class="info-value">${report.respondent ? report.respondent.state : '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date Assigned</div>
        <div class="info-value">${report.dateAssigned ? `${formatDate(report.dateAssigned)} ${formatTime(report.dateAssigned)}` : '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date Responded</div>
        <div class="info-value">${report.dateResponded ? `${formatDate(report.dateResponded)} ${formatTime(report.dateResponded)}` : '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date Resolved</div>
        <div class="info-value">${report.dateResolved ? `${formatDate(report.dateResolved)} ${formatTime(report.dateResolved)}` : '—'}</div>
      </div>
    `;
  }

  // Status Timeline
  renderTimeline(report);

  // History Log
  renderHistory(report);

  // Show panel
  const detailOverlay = document.getElementById('detailOverlay');
  const detailPanel = document.getElementById('detailPanel');
  if (detailOverlay) detailOverlay.classList.add('active');
  if (detailPanel) detailPanel.classList.add('active');
  document.body.style.overflow = 'hidden';
  initLucideIcons();
}

function renderTimeline(report) {
  const container = document.getElementById('detailTimeline');
  if (!container) return;

  const steps = [
    { key: 'received', label: 'Received', icon: 'inbox', date: report.dateReceived },
    { key: 'assigned', label: 'Assigned', icon: 'user-check', date: report.dateAssigned },
    { key: 'responded', label: 'Responded', icon: 'activity', date: report.dateResponded },
    { key: 'resolved', label: 'Resolved', icon: 'flag', date: report.dateResolved }
  ];

  let currentStepIndex = 0;
  steps.forEach((s, i) => { if (s.date) currentStepIndex = i; });

  container.innerHTML = steps.map((s, i) => {
    let cls = '';
    if (i < currentStepIndex) cls = 'completed';
    else if (i === currentStepIndex && s.date) cls = 'active';
    return `
      <div class="timeline-step ${cls}">
        <div class="timeline-dot"><i data-lucide="${s.icon}"></i></div>
        <div class="timeline-label">${s.label}</div>
        <div class="timeline-time">${s.date ? formatTime(s.date) : 'Pending'}</div>
      </div>
    `;
  }).join('');
}

function renderHistory(report) {
  const container = document.getElementById('detailHistory');
  const countEl = document.getElementById('historyCount');
  if (!container) return;

  const events = [];

  events.push({
    type: 'received',
    title: 'Report Received',
    desc: 'Report submitted through the emergency reporting channel',
    time: report.dateReceived,
    actor: 'System',
    icon: 'inbox',
    color: 'blue'
  });

  if (report.dateAssigned && report.respondent) {
    events.push({
      type: 'assigned',
      title: 'Report Assigned',
      desc: `Assigned to ${report.respondent.name}`,
      time: report.dateAssigned,
      actor: 'Dispatch System',
      icon: 'user-check',
      color: 'green'
    });
  }

  if (report.dateResponded) {
    events.push({
      type: 'responded',
      title: 'Response Started',
      desc: 'Respondent began handling the report',
      time: report.dateResponded,
      actor: report.respondent?.name || 'Respondent',
      icon: 'activity',
      color: 'orange'
    });
  }

  if (report.dateResolved) {
    events.push({
      type: 'resolved',
      title: 'Report Resolved',
      desc: 'Report marked as resolved',
      time: report.dateResolved,
      actor: report.respondent?.name || 'Respondent',
      icon: 'check-circle',
      color: 'green'
    });
  }

  events.sort((a, b) => a.time - b.time);

  if (countEl) countEl.textContent = `${events.length} event${events.length !== 1 ? 's' : ''}`;

  container.innerHTML = events.map(e => `
    <div class="history-item">
      <div class="history-icon ${e.color}"><i data-lucide="${e.icon}"></i></div>
      <div class="history-content">
        <div class="history-title">${e.title}</div>
        <div class="history-desc">${e.desc}</div>
        <div class="history-meta">${formatDate(e.time)} ${formatTime(e.time)} • by ${e.actor}</div>
      </div>
    </div>
  `).join('');
}

function closeDetail() {
  const detailOverlay = document.getElementById('detailOverlay');
  const detailPanel = document.getElementById('detailPanel');
  if (detailOverlay) detailOverlay.classList.remove('active');
  if (detailPanel) detailPanel.classList.remove('active');
  document.body.style.overflow = '';
  currentDetailReport = null;
}

function openReassignFromDetail() {
  if (currentDetailReport) openReassign(currentDetailReport.id);
}

function viewRespondentFromDetail() {
  if (currentDetailReport?.respondent) {
    showToast(`Viewing ${currentDetailReport.respondent.name}'s profile`);
  } else {
    showToast('No respondent assigned', true);
  }
}

/* =========================================================
   REASSIGN MODAL
   ========================================================= */
function openReassign(id) {
  const report = reports.find(r => r.id === id);
  if (!report) return;
  currentReassignReport = report;

  const reassignId = document.getElementById('reassignReportId');
  if (reassignId) reassignId.textContent = report.id;

  // Current assignment
  const currentEl = document.getElementById('currentAssignment');
  if (currentEl) {
    if (report.respondent) {
      currentEl.innerHTML = `
        <div class="resp-avatar">${getInitials(report.respondent.name)}</div>
        <div>
          <div class="name">${report.respondent.name}</div>
          <div class="meta">${report.respondent.state} • ${report.respondent.email}</div>
        </div>
      `;
    } else {
      currentEl.innerHTML = `
        <div class="resp-avatar unassigned"><i data-lucide="user-x" style="width: 16px; height: 16px;"></i></div>
        <div>
          <div class="name" style="color: var(--muted); font-style: italic;">Unassigned</div>
          <div class="meta">No respondent currently assigned</div>
        </div>
      `;
    }
  }

  // Reset inputs
  const searchInput = document.getElementById('respondentSearch');
  const hiddenId = document.getElementById('newRespondentId');
  const confirmBox = document.getElementById('reassignConfirm');
  const submitBtn = document.getElementById('reassignSubmitBtn');

  if (searchInput) searchInput.value = '';
  if (hiddenId) hiddenId.value = '';
  if (confirmBox) confirmBox.style.display = 'none';
  if (submitBtn) submitBtn.disabled = true;

  renderRespondentList('');
  openModal('reassignModal');
}

function renderRespondentList(query) {
  const q = query.toLowerCase().trim();
  const list = document.getElementById('respondentList');
  if (!list) return;

  const filtered = RESPONDENTS.filter(r => {
    if (r.status !== 'active') return false;
    if (!q) return true;
    return r.name.toLowerCase().includes(q) ||
           r.phone.includes(q) ||
           r.email.toLowerCase().includes(q) ||
           r.state.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="dropdown-empty">No respondents found</div>`;
    return;
  }

  list.innerHTML = filtered.map(r => `
    <div class="dropdown-item" data-id="${r.id}" onclick="selectRespondent(${r.id})">
      <div class="resp-avatar">${getInitials(r.name)}</div>
      <div class="dropdown-item-info">
        <div class="name">${r.name}</div>
        <div class="meta">${r.state} • ${r.phone}</div>
      </div>
    </div>
  `).join('');
}

function selectRespondent(id) {
  const respondent = RESPONDENTS.find(r => r.id === id);
  if (!respondent) return;

  const hiddenId = document.getElementById('newRespondentId');
  const searchInput = document.getElementById('respondentSearch');
  const list = document.getElementById('respondentList');
  const confirmBox = document.getElementById('reassignConfirm');
  const confirmText = document.getElementById('reassignConfirmText');
  const submitBtn = document.getElementById('reassignSubmitBtn');

  if (hiddenId) hiddenId.value = id;
  if (searchInput) searchInput.value = respondent.name;
  if (list) list.classList.remove('open');

  if (confirmText) confirmText.textContent = `Reassign this report to ${respondent.name}?`;
  if (confirmBox) confirmBox.style.display = 'block';
  if (submitBtn) submitBtn.disabled = false;

  initLucideIcons();
}

function submitReassign() {
  const hiddenId = document.getElementById('newRespondentId');
  const newId = hiddenId ? parseInt(hiddenId.value) : 0;
  const respondent = RESPONDENTS.find(r => r.id === newId);
  if (!respondent || !currentReassignReport) return;

  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMsg = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmAction');

  if (confirmTitle) confirmTitle.textContent = `Reassign to ${respondent.name}?`;
  if (confirmMsg) {
    confirmMsg.textContent = `Report ${currentReassignReport.id} will be reassigned from ${currentReassignReport.respondent?.name || 'Unassigned'} to ${respondent.name}. This action will be logged in the report history.`;
  }

  if (confirmBtn) {
    confirmBtn.textContent = 'Confirm Reassignment';
    confirmBtn.onclick = () => {
      currentReassignReport.respondent = respondent;
      currentReassignReport.dateAssigned = new Date();
      if (currentReassignReport.status === 'pending') {
        currentReassignReport.status = 'responding';
      }

      closeModal('reassignModal');
      closeModal('confirmModal');
      applyFilters();
      showToast(`Report ${currentReassignReport.id} reassigned to ${respondent.name}`);

      if (currentDetailReport?.id === currentReassignReport.id) {
        openDetail(currentReassignReport.id);
      }
    };
  }

  openModal('confirmModal');
}

/* =========================================================
   MODAL CONTROLS
   ========================================================= */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

/* =========================================================
   TOAST
   ========================================================= */
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/* =========================================================
   INITIALIZATION
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initStateDropdown();

  // State change event for Cascading LGA
  const stateFilter = document.getElementById('stateFilter');
  if (stateFilter) {
    stateFilter.addEventListener('change', (e) => {
      const state = e.target.value;
      const lgaFilter = document.getElementById('lgaFilter');
      if (lgaFilter) {
        lgaFilter.innerHTML = '<option value="">All LGAs</option>';
        if (state && STATES_LGA[state]) {
          lgaFilter.disabled = false;
          STATES_LGA[state].forEach(lga => {
            const opt = document.createElement('option');
            opt.value = lga;
            opt.textContent = lga;
            lgaFilter.appendChild(opt);
          });
        } else {
          lgaFilter.disabled = true;
          lgaFilter.innerHTML = '<option value="">Select state first</option>';
        }
      }
      applyFilters();
    });
  }

  // Filter Toggle (Advanced Filters)
  const filterToggle = document.getElementById('filterToggle');
  const advancedFilters = document.getElementById('advancedFilters');
  if (filterToggle && advancedFilters) {
    filterToggle.addEventListener('click', () => {
      advancedFilters.classList.toggle('open');
      filterToggle.classList.toggle('active');
    });
  }

  // Filter input listeners
  const filterElements = [
    document.getElementById('searchInput'),
    document.getElementById('typeFilter'),
    document.getElementById('statusFilter'),
    document.getElementById('lgaFilter'),
    document.getElementById('dateFrom'),
    document.getElementById('dateTo')
  ];

  filterElements.forEach(el => {
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });

  // Table header sorting click handlers
  document.querySelectorAll('.report-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
      }
      document.querySelectorAll('.report-table th').forEach(h => h.classList.remove('sorted'));
      th.classList.add('sorted');
      const icon = th.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', currentSort.direction === 'asc' ? 'arrow-up' : 'arrow-down');
      }
      sortReports();
      renderTable();
      initLucideIcons();
    });
  });

  // Per page listener
  const perPageEl = document.getElementById('perPage');
  if (perPageEl) {
    perPageEl.addEventListener('change', () => {
      currentPage = 1;
      renderTable();
    });
  }

  // Searchable dropdown input listeners
  const respSearch = document.getElementById('respondentSearch');
  const respList = document.getElementById('respondentList');
  if (respSearch) {
    respSearch.addEventListener('focus', () => {
      if (respList) respList.classList.add('open');
    });
    respSearch.addEventListener('input', (e) => {
      renderRespondentList(e.target.value);
      if (respList) respList.classList.add('open');
      const hiddenId = document.getElementById('newRespondentId');
      const confirmBox = document.getElementById('reassignConfirm');
      const submitBtn = document.getElementById('reassignSubmitBtn');
      if (hiddenId) hiddenId.value = '';
      if (confirmBox) confirmBox.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
    });
  }

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('respondentDropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      if (respList) respList.classList.remove('open');
    }
  });

  // Modal overlay click listeners
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Escape key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const panel = document.getElementById('detailPanel');
      if (panel && panel.classList.contains('active')) {
        closeDetail();
      } else {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    }
  });

  // Initial State
  const totalMini = document.querySelector('.stat-mini.total');
  if (totalMini) totalMini.classList.add('active-filter');
  applyFilters();
  initLucideIcons();
});
