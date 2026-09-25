/**
 * RescueLine - Admin Respondents Management Scripts
 * Handles live respondents table, search filters, pagination, registration, editing, and status toggling against MySQL database.
 */

let respondents = [];
const PER_PAGE = 10;
let currentPage = 1;
let filteredData = [];
let deleteTargetId = null;

/* =========================================================
   INITIALIZATION
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initModalListeners();
  loadRespondentsData();

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(applyFilters, 300);
    });
  }

  const stateFilter = document.getElementById('stateFilter');
  if (stateFilter) stateFilter.addEventListener('change', applyFilters);

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
});

/* =========================================================
   HELPERS
   ========================================================= */
function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function maskPhone(phone) {
  if (!phone) return '—';
  const clean = String(phone).trim();
  if (clean.length >= 7) {
    return clean.slice(0, 4) + '*****' + clean.slice(-3);
  }
  return clean;
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
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
    }
  });
}

/* =========================================================
   DATABASE DATA LOADING
   ========================================================= */
async function loadRespondentsData() {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const statusFilter = document.getElementById('statusFilter');

  const q = searchInput ? encodeURIComponent(searchInput.value.trim()) : '';
  const s = stateFilter ? encodeURIComponent(stateFilter.value) : '';
  const st = statusFilter ? encodeURIComponent(statusFilter.value) : '';

  try {
    const res = await fetch(`../api/respondents.php?action=list&search=${q}&state=${s}&status=${st}`);
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      respondents = json.data.respondents || [];
      filteredData = [...respondents];
      renderTable();
      updateStats(json.data.stats);
    }
  } catch (err) {
    console.error('Error fetching respondents:', err);
    showToast('Failed to load respondents from server.', 'error');
  }
}

/* =========================================================
   FILTERING
   ========================================================= */
function applyFilters() {
  currentPage = 1;
  loadRespondentsData();

  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const statusFilter = document.getElementById('statusFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');

  const hasFilters = Boolean((searchInput && searchInput.value) || (stateFilter && stateFilter.value) || (statusFilter && statusFilter.value));
  if (clearFiltersBtn) {
    clearFiltersBtn.classList.toggle('visible', hasFilters);
  }
}

function clearAllFilters() {
  const searchInput = document.getElementById('searchInput');
  const stateFilter = document.getElementById('stateFilter');
  const statusFilter = document.getElementById('statusFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');

  if (searchInput) searchInput.value = '';
  if (stateFilter) stateFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  if (clearFiltersBtn) clearFiltersBtn.classList.remove('visible');
  applyFilters();
}

/* =========================================================
   RENDER TABLE & CARDS
   ========================================================= */
function renderTable() {
  const tableBody = document.getElementById('tableBody');
  const respCards = document.getElementById('respCards');
  const resultCount = document.getElementById('resultCount');

  if (resultCount) resultCount.textContent = filteredData.length;

  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  const pageData = filteredData.slice(start, end);

  if (pageData.length === 0) {
    const emptyHtml = `
      <div class="empty-state">
        <i data-lucide="users"></i>
        <h3>No respondents found</h3>
        <p>Try changing your search or filter, or add a new respondent.</p>
        <button class="btn btn-primary" onclick="openAddModal()">
          <i data-lucide="plus"></i>
          Add Respondent
        </button>
      </div>
    `;
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="7">${emptyHtml}</td></tr>`;
    if (respCards) respCards.innerHTML = emptyHtml;
    renderPagination();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  if (tableBody) {
    tableBody.innerHTML = pageData.map(r => `
      <tr class="${r.status === 'inactive' ? 'inactive-row' : ''}">
        <td>
          <div class="resp-profile">
            <div class="resp-avatar">${getInitials(r.name)}</div>
            <div class="resp-name-block">
              <span class="resp-name">${escapeHTML(r.name)}</span>
              <span class="resp-id">#${escapeHTML(r.badge_number || 'RESP-' + r.id)}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="resp-contact">
            <a href="tel:${escapeHTML(r.phone)}" class="contact-line">
              <i data-lucide="phone"></i>
              <span>${maskPhone(r.phone)}</span>
            </a>
          </div>
        </td>
        <td>
          <a href="mailto:${escapeHTML(r.email)}" class="contact-line">
            <i data-lucide="mail"></i>
            <span>${escapeHTML(r.email)}</span>
          </a>
        </td>
        <td>
          <span class="state-pill">${escapeHTML(r.state || 'All States')}</span>
        </td>
        <td>
          <span class="reports-count">${Number(r.assigned_reports || 0)} Incidents</span>
        </td>
        <td>
          <span class="status-badge ${r.status}">${capitalize(r.status)}</span>
        </td>
        <td>
          <div class="action-group">
            <button class="act-btn act-btn-edit" title="Edit" onclick="openEditModal(${r.id})">
              <i data-lucide="pencil"></i> Edit
            </button>
            <button class="act-btn act-btn-toggle" title="Toggle Status" onclick="toggleStatus(${r.id}, '${r.status}')">
              <i data-lucide="${r.status === 'active' ? 'pause-circle' : 'play-circle'}"></i> ${r.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (respCards) {
    respCards.innerHTML = pageData.map(r => `
      <div class="resp-card-item">
        <div class="resp-card-top">
          <div class="resp-profile">
            <div class="resp-avatar">${getInitials(r.name)}</div>
            <div>
              <div class="resp-name">${escapeHTML(r.name)}</div>
              <div class="resp-id">#${escapeHTML(r.badge_number || 'RESP-' + r.id)}</div>
            </div>
          </div>
          <span class="status-badge ${r.status}">${capitalize(r.status)}</span>
        </div>
        <div class="resp-card-body">
          <div><strong>Phone:</strong> ${maskPhone(r.phone)}</div>
          <div><strong>Email:</strong> ${escapeHTML(r.email)}</div>
          <div><strong>Coverage:</strong> ${escapeHTML(r.state || 'National')}</div>
          <div><strong>Incidents:</strong> ${Number(r.assigned_reports || 0)}</div>
        </div>
        <div class="resp-card-actions">
          <button class="act-btn act-btn-edit" onclick="openEditModal(${r.id})"><i data-lucide="pencil"></i> Edit</button>
          <button class="act-btn act-btn-toggle" onclick="toggleStatus(${r.id}, '${r.status}')"><i data-lucide="${r.status === 'active' ? 'pause-circle' : 'play-circle'}"></i> ${r.status === 'active' ? 'Deactivate' : 'Activate'}</button>
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

  const totalPages = Math.ceil(filteredData.length / PER_PAGE) || 1;
  const start = filteredData.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, filteredData.length);

  paginationInfo.textContent = `Showing ${start}–${end} of ${filteredData.length} respondents`;

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goPage(${currentPage - 1})"><i data-lucide="chevron-left"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goPage(${currentPage + 1})"><i data-lucide="chevron-right"></i></button>`;
  paginationControls.innerHTML = html;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function goPage(p) {
  const totalPages = Math.ceil(filteredData.length / PER_PAGE) || 1;
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderTable();
}

function updateStats(stats) {
  if (!stats) return;
  const statTotal = document.getElementById('statTotal');
  const statActive = document.getElementById('statActive');
  const statInactive = document.getElementById('statInactive');
  const statStates = document.getElementById('statStates');

  if (statTotal) statTotal.textContent = Number(stats.total || 0).toLocaleString();
  if (statActive) statActive.textContent = Number(stats.active || 0).toLocaleString();
  if (statInactive) statInactive.textContent = Number(stats.inactive || 0).toLocaleString();
  if (statStates) statStates.textContent = Number(stats.states_covered || 0).toLocaleString();
}

/* =========================================================
   ADD & EDIT MODALS
   ========================================================= */
function openAddModal() {
  const form = document.getElementById('addForm');
  if (form) form.reset();
  openModal('addModal');
}

async function handleAdd() {
  const name = document.getElementById('addName').value.trim();
  const phone = document.getElementById('addPhone').value.trim();
  const email = document.getElementById('addEmail').value.trim();
  const password = document.getElementById('addPassword').value.trim();
  const state = document.getElementById('addState').value;
  const unit = document.getElementById('addUnit').value.trim();

  if (!name || !phone || !email || !password || !state) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('action', 'add');
  formData.append('name', name);
  formData.append('phone', phone);
  formData.append('email', email);
  formData.append('password', password);
  formData.append('state', state);
  formData.append('unit', unit || 'Emergency Squad');

  try {
    const res = await fetch('../api/respondents.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.status === 'success') {
      closeModal('addModal');
      showToast(json.message);
      loadRespondentsData();
    } else {
      showToast(json.message || 'Error adding respondent.', 'error');
    }
  } catch (err) {
    showToast('Network error saving respondent.', 'error');
  }
}

function openEditModal(id) {
  const r = respondents.find(x => Number(x.id) === Number(id));
  if (!r) return;

  document.getElementById('editId').value = r.id;
  document.getElementById('editName').value = r.name;
  document.getElementById('editPhone').value = r.phone;
  document.getElementById('editEmail').value = r.email;
  document.getElementById('editState').value = r.state || '';
  document.getElementById('editStatus').value = r.status || 'active';

  openModal('editModal');
}

async function handleEdit() {
  const id = document.getElementById('editId').value;
  const name = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const state = document.getElementById('editState').value;
  const status = document.getElementById('editStatus').value;

  if (!name || !phone || !email || !state) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('action', 'edit');
  formData.append('id', id);
  formData.append('name', name);
  formData.append('phone', phone);
  formData.append('email', email);
  formData.append('state', state);
  formData.append('status', status);

  try {
    const res = await fetch('../api/respondents.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.status === 'success') {
      closeModal('editModal');
      showToast(json.message);
      loadRespondentsData();
    } else {
      showToast(json.message || 'Error updating respondent.', 'error');
    }
  } catch (err) {
    showToast('Network error updating respondent.', 'error');
  }
}

async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const formData = new FormData();
  formData.append('action', 'toggle_status');
  formData.append('id', id);
  formData.append('status', newStatus);

  try {
    const res = await fetch('../api/respondents.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.status === 'success') {
      showToast(json.message);
      loadRespondentsData();
    } else {
      showToast(json.message || 'Status toggle failed.', 'error');
    }
  } catch (err) {
    showToast('Error updating respondent status.', 'error');
  }
}
