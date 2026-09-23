/**
 * RescueLine - Admin Reports & Respondents Scripts
 * Handles table rendering, filtering, pagination, add/edit/deactivate modals, and notifications.
 */

/* =========================================================
   MOCK DATA
   ========================================================= */
let respondents = [
  { id: 1,  name: 'Musa Ibrahim',     phone: '08031234567', email: 'musa.ibrahim@rescueline.ng',   state: 'Kaduna',    status: 'active' },
  { id: 2,  name: 'Amina Bello',      phone: '08123456789', email: 'amina.bello@rescueline.ng',    state: 'Kaduna',    status: 'active' },
  { id: 3,  name: 'Yusuf Danladi',    phone: '07056789012', email: 'yusuf.danladi@rescueline.ng',  state: 'Kano',      status: 'active' },
  { id: 4,  name: 'Fatima Ahmed',     phone: '09098765432', email: 'fatima.ahmed@rescueline.ng',   state: 'FCT Abuja', status: 'active' },
  { id: 5,  name: 'Sani Mohammed',    phone: '08065432109', email: 'sani.mohammed@rescueline.ng',  state: 'Kaduna',    status: 'active' },
  { id: 6,  name: 'Chinedu Okafor',   phone: '08134567890', email: 'chinedu.okafor@rescueline.ng', state: 'Lagos',     status: 'active' },
  { id: 7,  name: 'Aisha Okonkwo',    phone: '07087654321', email: 'aisha.okonkwo@rescueline.ng',  state: 'FCT Abuja', status: 'active' },
  { id: 8,  name: 'Emeka Nwosu',      phone: '09023456781', email: 'emeka.nwosu@rescueline.ng',    state: 'Rivers',    status: 'active' },
  { id: 9,  name: 'Halima Yusuf',     phone: '08056781234', email: 'halima.yusuf@rescueline.ng',   state: 'Kano',      status: 'inactive' },
  { id: 10, name: 'Tunde Adeyemi',    phone: '08145678901', email: 'tunde.adeyemi@rescueline.ng',  state: 'Oyo',       status: 'active' },
  { id: 11, name: 'Zainab Aliyu',     phone: '07067890123', email: 'zainab.aliyu@rescueline.ng',   state: 'Plateau',   status: 'active' },
  { id: 12, name: 'Ibrahim Musa',     phone: '09034567890', email: 'ibrahim.musa@rescueline.ng',   state: 'Niger',     status: 'active' },
  { id: 13, name: 'Ngozi Eze',        phone: '08078901234', email: 'ngozi.eze@rescueline.ng',      state: 'Enugu',     status: 'active' },
  { id: 14, name: 'Abubakar Sule',    phone: '08189012345', email: 'abubakar.sule@rescueline.ng',  state: 'Borno',     status: 'active' },
  { id: 15, name: 'Grace Obi',        phone: '07090123456', email: 'grace.obi@rescueline.ng',      state: 'Lagos',     status: 'inactive' },
  { id: 16, name: 'Mohammed Bello',   phone: '09045678901', email: 'mohammed.bello@rescueline.ng', state: 'Kaduna',    status: 'active' },
  { id: 17, name: 'Blessing Obi',     phone: '08012345678', email: 'blessing.obi@rescueline.ng',   state: 'Rivers',    status: 'active' },
  { id: 18, name: 'Aliyu Garba',      phone: '08156789012', email: 'aliyu.garba@rescueline.ng',    state: 'Kano',      status: 'inactive' },
];

const PER_PAGE = 10;
let currentPage = 1;
let filteredData = [...respondents];
let confirmCallback = null;

/* =========================================================
   HELPERS
   ========================================================= */
function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function maskPhone(phone) {
  if (phone && phone.length >= 7) {
    return phone.slice(0, 4) + '***' + phone.slice(-3);
  }
  return phone || '';
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* =========================================================
   FILTERING
   ========================================================= */
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const statusFilter = document.getElementById('statusFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');

  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const s = stateFilter ? stateFilter.value : '';
  const st = statusFilter ? statusFilter.value : '';

  filteredData = respondents.filter(r => {
    const matchQ = !q || r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.email.toLowerCase().includes(q);
    const matchS = !s || r.state === s;
    const matchSt = !st || r.status === st;
    return matchQ && matchS && matchSt;
  });

  currentPage = 1;
  renderTable();
  updateStats();

  const hasFilters = Boolean(q || s || st);
  if (clearFiltersBtn) {
    clearFiltersBtn.classList.toggle('visible', hasFilters);
  }
}

function clearAllFilters() {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) searchInput.value = '';
  if (stateFilter) stateFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  applyFilters();
}

/* =========================================================
   RENDER TABLE & CARDS
   ========================================================= */
function renderTable() {
  const tableBody = document.getElementById('tableBody');
  const respCards = document.getElementById('respCards');
  const resultCount = document.getElementById('resultCount');
  const paginationBar = document.getElementById('paginationBar');

  if (!tableBody && !respCards) return;

  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  const pageData = filteredData.slice(start, end);

  if (resultCount) {
    resultCount.textContent = filteredData.length;
  }

  if (pageData.length === 0) {
    const emptyHtml = `
      <div class="empty-state">
        <i data-lucide="users"></i>
        <h3>No respondents found</h3>
        <p>Try changing your search or filter, or add a new respondent.</p>
        <button class="btn btn-primary" onclick="openAddModal()"><i data-lucide="plus"></i> Add Respondent</button>
      </div>`;

    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6">${emptyHtml}</td></tr>`;
    }
    if (respCards) {
      respCards.innerHTML = emptyHtml;
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
      <tr class="${r.status === 'inactive' ? 'inactive-row' : ''}">
        <td>
          <div class="resp-cell">
            <div class="resp-avatar">${getInitials(r.name)}</div>
            <div>
              <div class="resp-name">${r.name}</div>
              <div class="resp-role">Respondent</div>
            </div>
          </div>
        </td>
        <td><span class="cell-text">${maskPhone(r.phone)}</span></td>
        <td><span class="cell-muted">${r.email}</span></td>
        <td><span class="cell-text">${r.state}</span></td>
        <td><span class="status-badge ${r.status}">${capitalize(r.status)}</span></td>
        <td>
          <div class="action-group">
            <button class="act-btn act-btn-view" title="View" onclick="viewRespondent(${r.id})"><i data-lucide="eye"></i></button>
            <button class="act-btn act-btn-edit" title="Edit" onclick="openEditModal(${r.id})"><i data-lucide="pencil"></i></button>
            ${r.status === 'active'
              ? `<button class="act-btn act-btn-deactivate" title="Deactivate" onclick="confirmDeactivate(${r.id})"><i data-lucide="user-x"></i></button>`
              : `<button class="act-btn act-btn-activate" title="Activate" onclick="confirmActivate(${r.id})"><i data-lucide="user-check"></i></button>`
            }
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Mobile Cards
  if (respCards) {
    respCards.innerHTML = pageData.map(r => `
      <div class="resp-card-item" style="${r.status === 'inactive' ? 'opacity: 0.6;' : ''}">
        <div class="resp-card-top">
          <div class="resp-cell">
            <div class="resp-avatar">${getInitials(r.name)}</div>
            <div>
              <div class="resp-name">${r.name}</div>
              <div class="resp-role">Respondent</div>
            </div>
          </div>
          <span class="status-badge ${r.status}">${capitalize(r.status)}</span>
        </div>
        <div class="resp-card-body">
          <div class="resp-card-field">
            <div class="label">Phone</div>
            <div class="value">${maskPhone(r.phone)}</div>
          </div>
          <div class="resp-card-field">
            <div class="label">Email</div>
            <div class="value" style="font-size:12px; word-break:break-all;">${r.email}</div>
          </div>
          <div class="resp-card-field">
            <div class="label">Coverage State</div>
            <div class="value">${r.state}</div>
          </div>
        </div>
        <div class="resp-card-actions">
          <button class="act-btn act-btn-view" onclick="viewRespondent(${r.id})"><i data-lucide="eye"></i> View</button>
          <button class="act-btn act-btn-edit" onclick="openEditModal(${r.id})"><i data-lucide="pencil"></i> Edit</button>
          ${r.status === 'active'
            ? `<button class="act-btn act-btn-deactivate" onclick="confirmDeactivate(${r.id})"><i data-lucide="user-x"></i> Deactivate</button>`
            : `<button class="act-btn act-btn-activate" onclick="confirmActivate(${r.id})"><i data-lucide="user-check"></i> Activate</button>`
          }
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

  const totalPages = Math.ceil(filteredData.length / PER_PAGE);
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, filteredData.length);

  paginationInfo.textContent = `Showing ${start}–${end} of ${filteredData.length} respondents`;

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
  const totalPages = Math.ceil(filteredData.length / PER_PAGE);
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
  const total = respondents.length;
  const active = respondents.filter(r => r.status === 'active').length;
  const inactive = total - active;

  const statTotal = document.getElementById('statTotal');
  const statActive = document.getElementById('statActive');
  const statInactive = document.getElementById('statInactive');

  if (statTotal) statTotal.textContent = total;
  if (statActive) statActive.textContent = active;
  if (statInactive) statInactive.textContent = inactive;
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
   ADD RESPONDENT
   ========================================================= */
function openAddModal() {
  const form = document.getElementById('addForm');
  if (form) form.reset();
  document.querySelectorAll('#addModal .form-error').forEach(e => e.classList.remove('visible'));
  document.querySelectorAll('#addModal .form-input, #addModal .form-select-input').forEach(e => e.classList.remove('error'));
  openModal('addModal');
}

function handleAdd(e) {
  if (e && e.preventDefault) e.preventDefault();

  const nameInput = document.getElementById('addName');
  const phoneInput = document.getElementById('addPhone');
  const emailInput = document.getElementById('addEmail');
  const passwordInput = document.getElementById('addPassword');
  const stateInput = document.getElementById('addState');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const state = stateInput ? stateInput.value : '';

  let valid = true;

  if (!name) { showFieldError('addName', 'addNameError'); valid = false; } else { clearFieldError('addName', 'addNameError'); }
  if (!phone || phone.length < 10) { showFieldError('addPhone', 'addPhoneError'); valid = false; } else { clearFieldError('addPhone', 'addPhoneError'); }
  if (!email || !email.includes('@')) { showFieldError('addEmail', 'addEmailError'); valid = false; } else { clearFieldError('addEmail', 'addEmailError'); }
  if (!password || password.length < 8) { showFieldError('addPassword', 'addPasswordError'); valid = false; } else { clearFieldError('addPassword', 'addPasswordError'); }
  if (!state) { showFieldError('addState', 'addStateError'); valid = false; } else { clearFieldError('addState', 'addStateError'); }

  if (!valid) return false;

  const newId = respondents.length > 0 ? Math.max(...respondents.map(r => r.id)) + 1 : 1;
  respondents.unshift({ id: newId, name, phone, email, state, status: 'active' });

  closeModal('addModal');
  applyFilters();
  showToast(`${name} added successfully`);
  return false;
}

function showFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) error.classList.add('visible');
}

function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('error');
  if (error) error.classList.remove('visible');
}

/* =========================================================
   EDIT RESPONDENT
   ========================================================= */
function openEditModal(id) {
  const r = respondents.find(x => x.id === id);
  if (!r) return;

  const editId = document.getElementById('editId');
  const editName = document.getElementById('editName');
  const editPhone = document.getElementById('editPhone');
  const editEmail = document.getElementById('editEmail');
  const editState = document.getElementById('editState');
  const editStatus = document.getElementById('editStatus');

  if (editId) editId.value = r.id;
  if (editName) editName.value = r.name;
  if (editPhone) editPhone.value = r.phone;
  if (editEmail) editEmail.value = r.email;
  if (editState) editState.value = r.state;
  if (editStatus) editStatus.value = r.status;

  openModal('editModal');
}

function handleEdit() {
  const editId = document.getElementById('editId');
  const editName = document.getElementById('editName');
  const editPhone = document.getElementById('editPhone');
  const editEmail = document.getElementById('editEmail');
  const editState = document.getElementById('editState');
  const editStatus = document.getElementById('editStatus');

  const id = editId ? parseInt(editId.value) : 0;
  const name = editName ? editName.value.trim() : '';
  const phone = editPhone ? editPhone.value.trim() : '';
  const email = editEmail ? editEmail.value.trim() : '';
  const state = editState ? editState.value : '';
  const status = editStatus ? editStatus.value : 'active';

  if (!name || !phone || !email || !state) {
    showToast('Please fill all required fields', true);
    return;
  }

  const idx = respondents.findIndex(r => r.id === id);
  if (idx !== -1) {
    respondents[idx] = { ...respondents[idx], name, phone, email, state, status };
  }

  closeModal('editModal');
  applyFilters();
  showToast(`${name} updated successfully`);
}

/* =========================================================
   DEACTIVATE / ACTIVATE
   ========================================================= */
function confirmDeactivate(id) {
  const r = respondents.find(x => x.id === id);
  if (!r) return;

  const confirmIcon = document.getElementById('confirmIcon');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const actionBtn = document.getElementById('confirmAction');

  if (confirmIcon) {
    confirmIcon.className = 'confirm-icon danger';
    confirmIcon.innerHTML = '<i data-lucide="alert-triangle"></i>';
  }
  if (confirmTitle) confirmTitle.textContent = 'Deactivate Respondent?';
  if (confirmMessage) confirmMessage.textContent = `Are you sure you want to deactivate ${r.name}? They will no longer be available for active emergency response assignments.`;
  if (actionBtn) {
    actionBtn.textContent = 'Deactivate';
    actionBtn.className = 'btn btn-danger';
  }

  confirmCallback = () => {
    r.status = 'inactive';
    applyFilters();
    showToast(`${r.name} deactivated`);
  };

  openModal('confirmModal');
  initLucideIcons();
}

function confirmActivate(id) {
  const r = respondents.find(x => x.id === id);
  if (!r) return;

  const confirmIcon = document.getElementById('confirmIcon');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const actionBtn = document.getElementById('confirmAction');

  if (confirmIcon) {
    confirmIcon.className = 'confirm-icon success';
    confirmIcon.innerHTML = '<i data-lucide="user-check"></i>';
  }
  if (confirmTitle) confirmTitle.textContent = 'Activate Respondent?';
  if (confirmMessage) confirmMessage.textContent = `Reactivate ${r.name}? They will be available for emergency response assignments again.`;
  if (actionBtn) {
    actionBtn.textContent = 'Activate';
    actionBtn.className = 'btn btn-primary';
  }

  confirmCallback = () => {
    r.status = 'active';
    applyFilters();
    showToast(`${r.name} activated`);
  };

  openModal('confirmModal');
  initLucideIcons();
}

function executeConfirm() {
  if (confirmCallback) confirmCallback();
  closeModal('confirmModal');
  confirmCallback = null;
}

/* =========================================================
   VIEW
   ========================================================= */
function viewRespondent(id) {
  const r = respondents.find(x => x.id === id);
  if (r) {
    showToast(`Viewing ${r.name}'s profile`);
  }
}

/* =========================================================
   PASSWORD TOGGLE
   ========================================================= */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) {
    icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    initLucideIcons();
  }
}

/* =========================================================
   TOAST
   ========================================================= */
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function initLucideIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

/* =========================================================
   DOM READY INITIALIZATION
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (stateFilter) stateFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);

  // Overlay clicks
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });

  renderTable();
  updateStats();
  initLucideIcons();
});
