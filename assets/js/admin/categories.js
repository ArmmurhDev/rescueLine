/**
 * RescueLine - Admin Categories & Locations Management Scripts
 * Handles categories, states, and LGAs tables, filtering, modals, and CRUD operations.
 */

/* =========================================================
   MOCK DATA
   ========================================================= */
let categories = [
  { id: 1, name: 'Fire',      description: 'Reports involving fire outbreaks, building fires, bush fires, or related emergencies.', status: 'active',   reports: 324, created: '2024-01-01', icon: 'flame',         iconClass: 'fire' },
  { id: 2, name: 'Accident',  description: 'Road traffic accidents, vehicle collisions, and related incidents.',                   status: 'active',   reports: 258, created: '2024-01-01', icon: 'car',           iconClass: 'accident' },
  { id: 3, name: 'Medical',   description: 'Medical emergencies including illness, injury, and health crises requiring urgent care.', status: 'active',   reports: 198, created: '2024-01-01', icon: 'heart-pulse',   iconClass: 'medical' },
  { id: 4, name: 'Security',  description: 'Security threats including armed robbery, kidnapping, and civil unrest.',              status: 'active',   reports: 167, created: '2024-01-01', icon: 'shield-alert',  iconClass: 'security' },
  { id: 5, name: 'Flood',     description: 'Flooding incidents, rising water levels, and water-related disasters.',                status: 'active',   reports: 92,  created: '2024-01-01', icon: 'waves',         iconClass: 'flood' },
  { id: 6, name: 'Other',     description: 'Any other emergency not covered by the standard categories.',                          status: 'inactive', reports: 48,  created: '2024-01-01', icon: 'help-circle',   iconClass: 'other' }
];

let states = [
  { id: 15, name: 'FCT Abuja',   code: 'FC', lgas: 6,  reports: 234, status: 'active' },
  { id: 19, name: 'Kaduna',      code: 'KD', lgas: 23, reports: 342, status: 'active' },
  { id: 20, name: 'Kano',        code: 'KN', lgas: 44, reports: 287, status: 'active' },
  { id: 25, name: 'Lagos',       code: 'LA', lgas: 20, reports: 198, status: 'active' },
  { id: 27, name: 'Niger',       code: 'NI', lgas: 25, reports: 156, status: 'active' },
  { id: 31, name: 'Oyo',         code: 'OY', lgas: 33, reports: 98,  status: 'active' },
  { id: 32, name: 'Plateau',     code: 'PL', lgas: 17, reports: 124, status: 'active' },
  { id: 33, name: 'Rivers',      code: 'RI', lgas: 23, reports: 87,  status: 'active' },
  { id: 37, name: 'Zamfara',     code: 'ZA', lgas: 14, reports: 41,  status: 'inactive' }
];

let lgas = [
  { id: 1,  name: 'Kaduna South',    stateId: 19, reports: 89,  status: 'active' },
  { id: 2,  name: 'Zaria',           stateId: 19, reports: 64,  status: 'active' },
  { id: 3,  name: 'Kano Municipal',  stateId: 20, reports: 94,  status: 'active' },
  { id: 4,  name: 'Abuja Municipal', stateId: 15, reports: 112, status: 'active' },
  { id: 5,  name: 'Ikeja',           stateId: 25, reports: 67,  status: 'active' },
  { id: 6,  name: 'Gusau',           stateId: 37, reports: 18,  status: 'inactive' }
];

/* =========================================================
   HELPERS
   ========================================================= */
function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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

/* =========================================================
   MODAL OVERLAYS & KEY LISTENERS
   ========================================================= */
function initModalListeners() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

/* =========================================================
   CATEGORIES LOGIC
   ========================================================= */
function renderCategories() {
  const catSearch = document.getElementById('catSearch');
  const catStatusFilter = document.getElementById('catStatusFilter');
  const catClearBtn = document.getElementById('catClearBtn');
  const catCount = document.getElementById('catCount');
  const tableBody = document.getElementById('catTableBody');
  const cardsContainer = document.getElementById('catCards');

  if (!tableBody || !cardsContainer) return;

  const q = catSearch ? catSearch.value.toLowerCase().trim() : '';
  const s = catStatusFilter ? catStatusFilter.value : '';

  const filtered = categories.filter(c => {
    return (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) && (!s || c.status === s);
  });

  if (catCount) catCount.textContent = filtered.length;
  if (catClearBtn) catClearBtn.style.display = (q || s) ? 'inline-flex' : 'none';

  const renderRow = (c, isMobile = false) => {
    const actions = `
      <button class="act-btn act-btn-edit" onclick="openEditCategory(${c.id})"><i data-lucide="pencil"></i> ${isMobile ? 'Edit' : ''}</button>
      <button class="act-btn act-btn-toggle ${c.status === 'inactive' ? 'activate' : ''}" onclick="toggleCategory(${c.id})">
        <i data-lucide="${c.status === 'active' ? 'pause-circle' : 'play-circle'}"></i> ${isMobile ? (c.status === 'active' ? 'Deactivate' : 'Activate') : ''}
      </button>
      <button class="act-btn act-btn-delete" onclick="confirmDeleteCategory(${c.id})"><i data-lucide="trash-2"></i> ${isMobile ? 'Delete' : ''}</button>
    `;

    if (isMobile) {
      return `
        <div class="data-card-item" style="${c.status === 'inactive' ? 'opacity: 0.7;' : ''}">
          <div class="data-card-top">
            <div class="cat-cell">
              <div class="cat-icon ${c.iconClass}"><i data-lucide="${c.icon}"></i></div>
              <div><div class="cat-name">${c.name}</div><div class="cat-desc">${c.description}</div></div>
            </div>
            <span class="status-badge ${c.status}">${capitalize(c.status)}</span>
          </div>
          <div class="data-card-body">
            <div class="data-card-field"><div class="label">Reports</div><div class="value">${c.reports.toLocaleString()}</div></div>
            <div class="data-card-field"><div class="label">Created</div><div class="value" style="font-size: 12px;">${formatDate(c.created)}</div></div>
          </div>
          <div class="data-card-actions">${actions}</div>
        </div>`;
    } else {
      return `
        <tr class="${c.status === 'inactive' ? 'inactive-row' : ''}">
          <td><div class="cat-cell"><div class="cat-icon ${c.iconClass}"><i data-lucide="${c.icon}"></i></div><div><div class="cat-name">${c.name}</div><div class="cat-desc">${c.description}</div></div></div></td>
          <td><span class="reports-count"><i data-lucide="file-text"></i> ${c.reports.toLocaleString()}</span></td>
          <td><span class="status-badge ${c.status}">${capitalize(c.status)}</span></td>
          <td><span class="date-cell">${formatDate(c.created)}</span></td>
          <td><div class="action-group">${actions}</div></td>
        </tr>`;
    }
  };

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i data-lucide="tags"></i><h3>No categories found</h3><p>Try changing your search or filter.</p><button class="btn btn-primary" onclick="openAddCategory()"><i data-lucide="plus"></i> Add Category</button></div></td></tr>`;
    cardsContainer.innerHTML = `<div class="empty-state"><i data-lucide="tags"></i><h3>No categories found</h3><p>Try changing your search or filter.</p><button class="btn btn-primary" onclick="openAddCategory()"><i data-lucide="plus"></i> Add Category</button></div>`;
  } else {
    tableBody.innerHTML = filtered.map(c => renderRow(c, false)).join('');
    cardsContainer.innerHTML = filtered.map(c => renderRow(c, true)).join('');
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  updateSummaryStats();
}

function clearCatFilters() {
  const catSearch = document.getElementById('catSearch');
  const catStatusFilter = document.getElementById('catStatusFilter');
  if (catSearch) catSearch.value = '';
  if (catStatusFilter) catStatusFilter.value = '';
  renderCategories();
}

function openAddCategory() {
  const form = document.getElementById('categoryForm');
  if (form) form.reset();
  document.getElementById('catId').value = '';
  document.getElementById('catName').value = '';
  document.getElementById('catDescription').value = '';
  document.getElementById('catStatus').value = 'active';
  document.getElementById('catModalTitle').textContent = 'Add New Category';
  document.getElementById('catSaveBtn').textContent = 'Save Category';
  openModal('categoryModal');
}

function openEditCategory(id) {
  const c = categories.find(x => x.id === id);
  if (!c) return;
  document.getElementById('catId').value = c.id;
  document.getElementById('catName').value = c.name;
  document.getElementById('catDescription').value = c.description;
  document.getElementById('catStatus').value = c.status;
  document.getElementById('catModalTitle').textContent = 'Edit Category';
  document.getElementById('catSaveBtn').textContent = 'Save Changes';
  openModal('categoryModal');
}

function saveCategory() {
  const id = document.getElementById('catId').value;
  const name = document.getElementById('catName').value.trim();
  const desc = document.getElementById('catDescription').value.trim();
  const status = document.getElementById('catStatus').value;

  if (!name || !desc) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  const iconMap = {
    'Fire': { i: 'flame', c: 'fire' },
    'Accident': { i: 'car', c: 'accident' },
    'Medical': { i: 'heart-pulse', c: 'medical' },
    'Security': { i: 'shield-alert', c: 'security' },
    'Flood': { i: 'waves', c: 'flood' }
  };
  const iconData = iconMap[name] || { i: 'help-circle', c: 'other' };

  if (id) {
    const idx = categories.findIndex(c => c.id === parseInt(id));
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], name, description: desc, status };
    }
    showToast(`Category "${name}" updated`);
  } else {
    categories.push({
      id: Date.now(),
      name,
      description: desc,
      status,
      reports: 0,
      created: new Date().toISOString().split('T')[0],
      icon: iconData.i,
      iconClass: iconData.c
    });
    showToast(`Category "${name}" created`);
  }
  closeModal('categoryModal');
  renderCategories();
}

function toggleCategory(id) {
  const c = categories.find(x => x.id === id);
  if (c) {
    c.status = c.status === 'active' ? 'inactive' : 'active';
    renderCategories();
    showToast(`Category ${c.status === 'active' ? 'activated' : 'deactivated'}`);
  }
}

function confirmDeleteCategory(id) {
  const c = categories.find(x => x.id === id);
  if (!c) return;
  const hasReports = c.reports > 0;
  
  const iconWrap = document.getElementById('confirmIconWrap');
  if (iconWrap) {
    iconWrap.className = hasReports ? 'confirm-icon warning' : 'confirm-icon danger';
    iconWrap.innerHTML = hasReports ? '<i data-lucide="alert-triangle"></i>' : '<i data-lucide="trash-2"></i>';
  }

  document.getElementById('confirmTitle').textContent = hasReports ? 'Cannot Delete Category' : 'Delete Category?';
  document.getElementById('confirmMessage').innerHTML = hasReports 
    ? `"<strong>${c.name}</strong>" has <strong>${c.reports} reports</strong>. Deleting it may break references.` 
    : `Are you sure you want to delete "<strong>${c.name}</strong>"?`;
  
  document.getElementById('confirmWarningWrap').innerHTML = hasReports 
    ? `<div class="confirm-warning"><i data-lucide="info"></i><div><strong>Recommended:</strong> Deactivate this category instead.</div></div>` 
    : '';

  const btn = document.getElementById('confirmActionBtn');
  if (hasReports) {
    btn.textContent = 'Deactivate Instead';
    btn.className = 'btn btn-primary';
    btn.onclick = () => { toggleCategory(id); closeModal('confirmModal'); };
  } else {
    btn.textContent = 'Delete';
    btn.className = 'btn btn-danger';
    btn.onclick = () => {
      categories = categories.filter(x => x.id !== id);
      closeModal('confirmModal');
      renderCategories();
      showToast('Category deleted');
    };
  }
  openModal('confirmModal');
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

/* =========================================================
   TABS
   ========================================================= */
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const activeTabEl = document.querySelector(`.tab[data-tab="${tab}"]`);
  if (activeTabEl) activeTabEl.classList.add('active');

  const statesTab = document.getElementById('statesTab');
  const lgasTab = document.getElementById('lgasTab');

  if (statesTab) statesTab.style.display = tab === 'states' ? 'block' : 'none';
  if (lgasTab) lgasTab.style.display = tab === 'lgas' ? 'block' : 'none';

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

/* =========================================================
   STATES LOGIC
   ========================================================= */
function renderStates() {
  const stateSearch = document.getElementById('stateSearch');
  const stateStatusFilter = document.getElementById('stateStatusFilter');
  const stateClearBtn = document.getElementById('stateClearBtn');
  const statesCount = document.getElementById('statesCount');
  const tableBody = document.getElementById('stateTableBody');
  const cardsContainer = document.getElementById('stateCards');

  if (!tableBody || !cardsContainer) return;

  const q = stateSearch ? stateSearch.value.toLowerCase().trim() : '';
  const s = stateStatusFilter ? stateStatusFilter.value : '';

  const filtered = states.filter(st => (!q || st.name.toLowerCase().includes(q) || st.code.toLowerCase().includes(q)) && (!s || st.status === s));

  if (statesCount) statesCount.textContent = filtered.length;
  if (stateClearBtn) stateClearBtn.style.display = (q || s) ? 'inline-flex' : 'none';

  const renderRow = (st, isMobile = false) => {
    const actions = `
      <button class="act-btn act-btn-edit" onclick="openEditState(${st.id})"><i data-lucide="pencil"></i> ${isMobile ? 'Edit' : ''}</button>
      <button class="act-btn act-btn-view" onclick="viewStateLgas(${st.id})"><i data-lucide="map-pin"></i> ${isMobile ? 'View LGAs' : ''}</button>
      <button class="act-btn act-btn-toggle ${st.status === 'inactive' ? 'activate' : ''}" onclick="toggleState(${st.id})">
        <i data-lucide="${st.status === 'active' ? 'pause-circle' : 'play-circle'}"></i> ${isMobile ? (st.status === 'active' ? 'Deactivate' : 'Activate') : ''}
      </button>
    `;
    if (isMobile) {
      return `<div class="data-card-item" style="${st.status === 'inactive' ? 'opacity: 0.7;' : ''}">
        <div class="data-card-top"><div><strong>${st.name}</strong><div style="font-size:11px;color:var(--muted);margin-top:2px;">Code: ${st.code}</div></div><span class="status-badge ${st.status}">${capitalize(st.status)}</span></div>
        <div class="data-card-body"><div class="data-card-field"><div class="label">LGAs</div><div class="value">${st.lgas}</div></div><div class="data-card-field"><div class="label">Reports</div><div class="value">${st.reports}</div></div></div>
        <div class="data-card-actions">${actions}</div></div>`;
    } else {
      return `<tr class="${st.status === 'inactive' ? 'inactive-row' : ''}">
        <td><strong>${st.name}</strong></td>
        <td><span class="code-badge">${st.code}</span></td>
        <td><span class="reports-count"><i data-lucide="map-pin"></i> ${st.lgas}</span></td>
        <td><span class="reports-count"><i data-lucide="file-text"></i> ${st.reports}</span></td>
        <td><span class="status-badge ${st.status}">${capitalize(st.status)}</span></td>
        <td><div class="action-group">${actions}</div></td></tr>`;
    }
  };

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i data-lucide="map"></i><h3>No states found</h3><button class="btn btn-primary" onclick="openAddState()"><i data-lucide="plus"></i> Add State</button></div></td></tr>`;
    cardsContainer.innerHTML = `<div class="empty-state"><i data-lucide="map"></i><h3>No states found</h3><button class="btn btn-primary" onclick="openAddState()"><i data-lucide="plus"></i> Add State</button></div>`;
  } else {
    tableBody.innerHTML = filtered.map(st => renderRow(st, false)).join('');
    cardsContainer.innerHTML = filtered.map(st => renderRow(st, true)).join('');
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  updateSummaryStats();
}

function clearStateFilters() {
  const stateSearch = document.getElementById('stateSearch');
  const stateStatusFilter = document.getElementById('stateStatusFilter');
  if (stateSearch) stateSearch.value = '';
  if (stateStatusFilter) stateStatusFilter.value = '';
  renderStates();
}

function openAddState() {
  const form = document.getElementById('stateForm');
  if (form) form.reset();
  document.getElementById('stateId').value = '';
  document.getElementById('stateName').value = '';
  document.getElementById('stateCode').value = '';
  document.getElementById('stateStatus').value = 'active';
  document.getElementById('stateModalTitle').textContent = 'Add New State';
  document.getElementById('stateSaveBtn').textContent = 'Save State';
  openModal('stateModal');
}

function openEditState(id) {
  const st = states.find(x => x.id === id);
  if (!st) return;
  document.getElementById('stateId').value = st.id;
  document.getElementById('stateName').value = st.name;
  document.getElementById('stateCode').value = st.code;
  document.getElementById('stateStatus').value = st.status;
  document.getElementById('stateModalTitle').textContent = 'Edit State';
  document.getElementById('stateSaveBtn').textContent = 'Save Changes';
  openModal('stateModal');
}

function saveState() {
  const id = document.getElementById('stateId').value;
  const name = document.getElementById('stateName').value.trim();
  const code = document.getElementById('stateCode').value.trim().toUpperCase();
  const status = document.getElementById('stateStatus').value;

  if (!name || !code) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  if (id) {
    const idx = states.findIndex(s => s.id === parseInt(id));
    if (idx !== -1) states[idx] = { ...states[idx], name, code, status };
    showToast(`State "${name}" updated`);
  } else {
    states.push({ id: Date.now(), name, code, lgas: 0, reports: 0, status });
    showToast(`State "${name}" added`);
  }
  closeModal('stateModal');
  renderStates();
  populateLgaStateDropdown();
}

function toggleState(id) {
  const st = states.find(x => x.id === id);
  if (st) {
    st.status = st.status === 'active' ? 'inactive' : 'active';
    renderStates();
    showToast(`State ${st.status === 'active' ? 'activated' : 'deactivated'}`);
  }
}

function viewStateLgas(stateId) {
  const st = states.find(x => x.id === stateId);
  if (!st) return;
  switchTab('lgas');
  const lgaStateFilter = document.getElementById('lgaStateFilter');
  if (lgaStateFilter) lgaStateFilter.value = stateId;
  renderLgas();
  showToast(`Showing LGAs for ${st.name}`);
}

/* =========================================================
   LGAS LOGIC
   ========================================================= */
function populateLgaStateDropdown() {
  const lgaStateFilter = document.getElementById('lgaStateFilter');
  const lgaStateSelect = document.getElementById('lgaState');
  if (!lgaStateFilter || !lgaStateSelect) return;

  const sorted = [...states].sort((a, b) => a.name.localeCompare(b.name));
  lgaStateFilter.innerHTML = '<option value="">All States</option>';
  lgaStateSelect.innerHTML = '<option value="">Select state...</option>';
  sorted.forEach(st => {
    lgaStateFilter.innerHTML += `<option value="${st.id}">${st.name}</option>`;
    lgaStateSelect.innerHTML += `<option value="${st.id}">${st.name}</option>`;
  });
}

function renderLgas() {
  const lgaSearch = document.getElementById('lgaSearch');
  const lgaStateFilter = document.getElementById('lgaStateFilter');
  const lgaStatusFilter = document.getElementById('lgaStatusFilter');
  const lgaClearBtn = document.getElementById('lgaClearBtn');
  const lgasCount = document.getElementById('lgasCount');
  const tableBody = document.getElementById('lgaTableBody');
  const cardsContainer = document.getElementById('lgaCards');

  if (!tableBody || !cardsContainer) return;

  const q = lgaSearch ? lgaSearch.value.toLowerCase().trim() : '';
  const stateId = lgaStateFilter ? lgaStateFilter.value : '';
  const s = lgaStatusFilter ? lgaStatusFilter.value : '';
  
  const filtered = lgas.filter(l => {
    const state = states.find(st => st.id === l.stateId);
    return (!q || l.name.toLowerCase().includes(q) || (state && state.name.toLowerCase().includes(q))) 
        && (!stateId || l.stateId === parseInt(stateId)) 
        && (!s || l.status === s);
  });

  if (lgasCount) lgasCount.textContent = filtered.length;
  if (lgaClearBtn) lgaClearBtn.style.display = (q || stateId || s) ? 'inline-flex' : 'none';

  const renderRow = (l, isMobile = false) => {
    const state = states.find(st => st.id === l.stateId);
    const actions = `
      <button class="act-btn act-btn-edit" onclick="openEditLga(${l.id})"><i data-lucide="pencil"></i> ${isMobile ? 'Edit' : ''}</button>
      <button class="act-btn act-btn-toggle ${l.status === 'inactive' ? 'activate' : ''}" onclick="toggleLga(${l.id})">
        <i data-lucide="${l.status === 'active' ? 'pause-circle' : 'play-circle'}"></i> ${isMobile ? (l.status === 'active' ? 'Deactivate' : 'Activate') : ''}
      </button>
      ${l.reports === 0 ? `<button class="act-btn act-btn-delete" onclick="confirmDeleteLga(${l.id})"><i data-lucide="trash-2"></i> ${isMobile ? 'Delete' : ''}</button>` : ''}
    `;
    if (isMobile) {
      return `<div class="data-card-item" style="${l.status === 'inactive' ? 'opacity: 0.7;' : ''}">
        <div class="data-card-top"><div><strong>${l.name}</strong><div style="font-size:11px;color:var(--muted);margin-top:2px;">${state ? state.name : '—'}</div></div><span class="status-badge ${l.status}">${capitalize(l.status)}</span></div>
        <div class="data-card-body"><div class="data-card-field"><div class="label">Reports</div><div class="value">${l.reports}</div></div></div>
        <div class="data-card-actions">${actions}</div></div>`;
    } else {
      return `<tr class="${l.status === 'inactive' ? 'inactive-row' : ''}">
        <td><strong>${l.name}</strong></td>
        <td>${state ? state.name : '—'}</td>
        <td><span class="reports-count"><i data-lucide="file-text"></i> ${l.reports}</span></td>
        <td><span class="status-badge ${l.status}">${capitalize(l.status)}</span></td>
        <td><div class="action-group">${actions}</div></td></tr>`;
    }
  };

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i data-lucide="map-pin"></i><h3>No LGAs found</h3><button class="btn btn-primary" onclick="openAddLga()"><i data-lucide="plus"></i> Add LGA</button></div></td></tr>`;
    cardsContainer.innerHTML = `<div class="empty-state"><i data-lucide="map-pin"></i><h3>No LGAs found</h3><button class="btn btn-primary" onclick="openAddLga()"><i data-lucide="plus"></i> Add LGA</button></div>`;
  } else {
    tableBody.innerHTML = filtered.map(l => renderRow(l, false)).join('');
    cardsContainer.innerHTML = filtered.map(l => renderRow(l, true)).join('');
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  updateSummaryStats();
}

function clearLgaFilters() {
  const lgaSearch = document.getElementById('lgaSearch');
  const lgaStateFilter = document.getElementById('lgaStateFilter');
  const lgaStatusFilter = document.getElementById('lgaStatusFilter');
  if (lgaSearch) lgaSearch.value = '';
  if (lgaStateFilter) lgaStateFilter.value = '';
  if (lgaStatusFilter) lgaStatusFilter.value = '';
  renderLgas();
}

function openAddLga() {
  const form = document.getElementById('lgaForm');
  if (form) form.reset();
  document.getElementById('lgaId').value = '';
  document.getElementById('lgaName').value = '';
  document.getElementById('lgaState').value = '';
  document.getElementById('lgaStatus').value = 'active';
  document.getElementById('lgaModalTitle').textContent = 'Add New LGA';
  document.getElementById('lgaSaveBtn').textContent = 'Save LGA';
  openModal('lgaModal');
}

function openEditLga(id) {
  const l = lgas.find(x => x.id === id);
  if (!l) return;
  document.getElementById('lgaId').value = l.id;
  document.getElementById('lgaName').value = l.name;
  document.getElementById('lgaState').value = l.stateId;
  document.getElementById('lgaStatus').value = l.status;
  document.getElementById('lgaModalTitle').textContent = 'Edit LGA';
  document.getElementById('lgaSaveBtn').textContent = 'Save Changes';
  openModal('lgaModal');
}

function saveLga() {
  const id = document.getElementById('lgaId').value;
  const name = document.getElementById('lgaName').value.trim();
  const stateId = document.getElementById('lgaState').value;
  const status = document.getElementById('lgaStatus').value;

  if (!name || !stateId) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  if (id) {
    const idx = lgas.findIndex(l => l.id === parseInt(id));
    if (idx !== -1) lgas[idx] = { ...lgas[idx], name, stateId: parseInt(stateId), status };
    showToast(`LGA "${name}" updated`);
  } else {
    lgas.push({ id: Date.now(), name, stateId: parseInt(stateId), reports: 0, status });
    const state = states.find(s => s.id === parseInt(stateId));
    if (state) state.lgas += 1;
    showToast(`LGA "${name}" added`);
  }
  closeModal('lgaModal');
  renderLgas();
  renderStates();
}

function toggleLga(id) {
  const l = lgas.find(x => x.id === id);
  if (l) {
    l.status = l.status === 'active' ? 'inactive' : 'active';
    renderLgas();
    showToast(`LGA ${l.status === 'active' ? 'activated' : 'deactivated'}`);
  }
}

function confirmDeleteLga(id) {
  const l = lgas.find(x => x.id === id);
  if (!l) return;

  const iconWrap = document.getElementById('confirmIconWrap');
  if (iconWrap) {
    iconWrap.className = 'confirm-icon danger';
    iconWrap.innerHTML = '<i data-lucide="trash-2"></i>';
  }

  document.getElementById('confirmTitle').textContent = 'Delete LGA?';
  document.getElementById('confirmMessage').innerHTML = `Are you sure you want to delete "<strong>${l.name}</strong>"?`;
  document.getElementById('confirmWarningWrap').innerHTML = '';
  
  const btn = document.getElementById('confirmActionBtn');
  btn.textContent = 'Delete';
  btn.className = 'btn btn-danger';
  btn.onclick = () => {
    const state = states.find(s => s.id === l.stateId);
    if (state) state.lgas = Math.max(0, state.lgas - 1);
    lgas = lgas.filter(x => x.id !== id);
    closeModal('confirmModal');
    renderLgas();
    renderStates();
    showToast('LGA deleted');
  };
  openModal('confirmModal');
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

/* =========================================================
   SUMMARY STATS
   ========================================================= */
function updateSummaryStats() {
  const statTotalCat = document.getElementById('statTotalCat');
  const statActiveCat = document.getElementById('statActiveCat');
  const statStates = document.getElementById('statStates');
  const statLgas = document.getElementById('statLgas');

  if (statTotalCat) statTotalCat.textContent = categories.length;
  if (statActiveCat) statActiveCat.textContent = categories.filter(c => c.status === 'active').length;
  if (statStates) statStates.textContent = states.length;
  if (statLgas) statLgas.textContent = lgas.length;
}

/* =========================================================
   INITIALIZATION
   ========================================================= */
function initCategoriesPage() {
  initModalListeners();

  const catSearch = document.getElementById('catSearch');
  const catStatusFilter = document.getElementById('catStatusFilter');
  if (catSearch) catSearch.addEventListener('input', renderCategories);
  if (catStatusFilter) catStatusFilter.addEventListener('change', renderCategories);

  const stateSearch = document.getElementById('stateSearch');
  const stateStatusFilter = document.getElementById('stateStatusFilter');
  if (stateSearch) stateSearch.addEventListener('input', renderStates);
  if (stateStatusFilter) stateStatusFilter.addEventListener('change', renderStates);

  const lgaSearch = document.getElementById('lgaSearch');
  const lgaStateFilter = document.getElementById('lgaStateFilter');
  const lgaStatusFilter = document.getElementById('lgaStatusFilter');
  if (lgaSearch) lgaSearch.addEventListener('input', renderLgas);
  if (lgaStateFilter) lgaStateFilter.addEventListener('change', renderLgas);
  if (lgaStatusFilter) lgaStatusFilter.addEventListener('change', renderLgas);

  populateLgaStateDropdown();
  renderCategories();
  renderStates();
  renderLgas();
  updateSummaryStats();

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCategoriesPage);
} else {
  initCategoriesPage();
}
