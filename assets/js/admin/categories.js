/**
 * RescueLine - Admin Categories Management Scripts
 * Handles emergency categories table, filtering, modals, and real-time database CRUD operations.
 */

// Global State Arrays loaded from real-time database
let categories = [];
let deleteTargetId = null;

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
   DATABASE DATA LOADING
   ========================================================= */
async function loadCategoriesData() {
  try {
    const res = await fetch('../api/categories.php?action=list');
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      categories = json.data.categories || [];
      renderCategories();
      updateSummaryStats(json.data.stats);
    }
  } catch (err) {
    console.error('Error fetching categories data:', err);
    showToast('Failed to load categories from server.', 'error');
  }
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
    const matchQuery = !q || c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
    const matchStatus = !s || c.status === s;
    return matchQuery && matchStatus;
  });

  if (catCount) catCount.textContent = filtered.length;
  if (catClearBtn) {
    if (q || s) {
      catClearBtn.classList.add('visible');
    } else {
      catClearBtn.classList.remove('visible');
    }
  }

  const renderRow = (c, isMobile = false) => {
    const actions = `
      <button class="act-btn act-btn-edit" onclick="openEditCategory(${c.id})"><i data-lucide="pencil"></i> ${isMobile ? 'Edit' : ''}</button>
      <button class="act-btn act-btn-toggle ${c.status === 'inactive' ? 'activate' : ''}" onclick="toggleCategory(${c.id})">
        <i data-lucide="${c.status === 'active' ? 'pause-circle' : 'play-circle'}"></i> ${isMobile ? (c.status === 'active' ? 'Deactivate' : 'Activate') : ''}
      </button>
      <button class="act-btn act-btn-delete" onclick="confirmDeleteCategory(${c.id})"><i data-lucide="trash-2"></i> ${isMobile ? 'Delete' : ''}</button>
    `;

    const repCount = Number(c.reports || 0).toLocaleString();
    const iconName = c.icon || 'alert-circle';
    const iconCls = c.icon_class || 'other';

    if (isMobile) {
      return `
        <div class="data-card-item" style="${c.status === 'inactive' ? 'opacity: 0.75;' : ''}">
          <div class="data-card-top">
            <div class="cat-cell">
              <div class="cat-icon ${iconCls}"><i data-lucide="${iconName}"></i></div>
              <div>
                <div class="cat-name">${escapeHTML(c.name)}</div>
                <div class="cat-desc">${escapeHTML(c.description || '')}</div>
              </div>
            </div>
            <span class="status-badge ${c.status}">${capitalize(c.status)}</span>
          </div>
          <div class="data-card-body">
            <div class="data-card-field"><div class="label">Reports</div><div class="value">${repCount}</div></div>
            <div class="data-card-field"><div class="label">Created</div><div class="value" style="font-size: 12px;">${formatDate(c.created)}</div></div>
          </div>
          <div class="data-card-actions">${actions}</div>
        </div>`;
    } else {
      return `
        <tr class="${c.status === 'inactive' ? 'inactive-row' : ''}">
          <td>
            <div class="cat-cell">
              <div class="cat-icon ${iconCls}"><i data-lucide="${iconName}"></i></div>
              <div>
                <div class="cat-name">${escapeHTML(c.name)}</div>
                <div class="cat-desc">${escapeHTML(c.description || '')}</div>
              </div>
            </div>
          </td>
          <td><span class="reports-count"><i data-lucide="file-text"></i> ${repCount}</span></td>
          <td><span class="status-badge ${c.status}">${capitalize(c.status)}</span></td>
          <td><span class="date-cell">${formatDate(c.created)}</span></td>
          <td><div class="action-group">${actions}</div></td>
        </tr>`;
    }
  };

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i data-lucide="tags"></i><h3>No categories found</h3><p>Try adjusting your search or filter.</p><button class="btn btn-primary" onclick="openAddCategory()"><i data-lucide="plus"></i> Add Category</button></div></td></tr>`;
    cardsContainer.innerHTML = `<div class="empty-state"><i data-lucide="tags"></i><h3>No categories found</h3><p>Try adjusting your search or filter.</p><button class="btn btn-primary" onclick="openAddCategory()"><i data-lucide="plus"></i> Add Category</button></div>`;
  } else {
    tableBody.innerHTML = filtered.map(c => renderRow(c, false)).join('');
    cardsContainer.innerHTML = filtered.map(c => renderRow(c, true)).join('');
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function clearCatFilters() {
  const catSearch = document.getElementById('catSearch');
  const catStatusFilter = document.getElementById('catStatusFilter');
  const catClearBtn = document.getElementById('catClearBtn');
  if (catSearch) catSearch.value = '';
  if (catStatusFilter) catStatusFilter.value = '';
  if (catClearBtn) catClearBtn.classList.remove('visible');
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
  const c = categories.find(x => Number(x.id) === Number(id));
  if (!c) return;
  document.getElementById('catId').value = c.id;
  document.getElementById('catName').value = c.name;
  document.getElementById('catDescription').value = c.description || '';
  document.getElementById('catStatus').value = c.status;
  document.getElementById('catModalTitle').textContent = 'Edit Category';
  document.getElementById('catSaveBtn').textContent = 'Save Changes';
  openModal('categoryModal');
}

async function saveCategory() {
  const id = document.getElementById('catId').value;
  const name = document.getElementById('catName').value.trim();
  const desc = document.getElementById('catDescription').value.trim();
  const status = document.getElementById('catStatus').value;

  if (!name) {
    showToast('Category name is required.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('action', id ? 'edit_category' : 'add_category');
  if (id) formData.append('id', id);
  formData.append('name', name);
  formData.append('description', desc);
  formData.append('status', status);

  try {
    const res = await fetch('../api/categories.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.status === 'success') {
      closeModal('categoryModal');
      showToast(json.message);
      loadCategoriesData();
    } else {
      showToast(json.message || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Network error saving category.', 'error');
  }
}

async function toggleCategory(id) {
  const formData = new FormData();
  formData.append('action', 'toggle_category');
  formData.append('id', id);

  try {
    const res = await fetch('../api/categories.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.status === 'success') {
      showToast(json.message);
      loadCategoriesData();
    } else {
      showToast(json.message || 'Failed to toggle status.', 'error');
    }
  } catch (err) {
    showToast('Error updating category status.', 'error');
  }
}

function confirmDeleteCategory(id) {
  const c = categories.find(x => Number(x.id) === Number(id));
  deleteTargetId = id;
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMsg = document.getElementById('confirmMessage');
  const actionBtn = document.getElementById('confirmActionBtn');
  
  if (confirmTitle) confirmTitle.textContent = 'Delete Category';
  if (confirmMsg) {
    confirmMsg.innerHTML = `Are you sure you want to delete category <strong>"${escapeHTML(c ? c.name : 'this item')}"</strong>? This will remove the category from the system.`;
  }
  if (actionBtn) {
    actionBtn.onclick = executeDelete;
  }
  openModal('confirmModal');
}

async function executeDelete() {
  if (!deleteTargetId) return;

  const formData = new FormData();
  formData.append('action', 'delete_category');
  formData.append('id', deleteTargetId);

  try {
    const res = await fetch('../api/categories.php', { method: 'POST', body: formData });
    const json = await res.json();
    closeModal('confirmModal');
    if (json.status === 'success') {
      showToast(json.message);
      loadCategoriesData();
    } else {
      showToast(json.message || 'Error deleting category.', 'error');
    }
  } catch (err) {
    closeModal('confirmModal');
    showToast('Error deleting category.', 'error');
  }
}

/* =========================================================
   SUMMARY STATS UPDATE
   ========================================================= */
function updateSummaryStats(stats) {
  if (!stats) return;
  const statTotalCat = document.getElementById('statTotalCat');
  const statActiveCat = document.getElementById('statActiveCat');
  const statInactiveCat = document.getElementById('statInactiveCat');
  const statTotalReports = document.getElementById('statTotalReports');

  if (statTotalCat) statTotalCat.textContent = stats.total_categories ?? 0;
  if (statActiveCat) statActiveCat.textContent = stats.active_categories ?? 0;
  if (statInactiveCat) statInactiveCat.textContent = stats.inactive_categories ?? 0;
  if (statTotalReports) statTotalReports.textContent = Number(stats.total_reports || 0).toLocaleString();
}

/* =========================================================
   INITIALIZE EVERYTHING ON DOM LOAD
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initModalListeners();
  loadCategoriesData();

  const catSearch = document.getElementById('catSearch');
  if (catSearch) catSearch.addEventListener('input', renderCategories);

  const catStatusFilter = document.getElementById('catStatusFilter');
  if (catStatusFilter) catStatusFilter.addEventListener('change', renderCategories);
});
