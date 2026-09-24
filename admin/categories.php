<?php
/**
 * RescueLine - Admin Categories & Locations Management
 * Emergency Incident Reporting & Response Management
 */

// Page Configuration
$page_title       = 'RescueLine • Categories & Locations';
$page_description = 'RescueLine - Emergency Incident Reporting Categories and Geographic Coverage';
$active_page      = 'categories';
$extra_css        = [
    '../assets/css/admin/index.css',
    '../assets/css/admin/categories.css'
];

// Reusable Admin Header & Sidebar
require_once __DIR__ . '/../inc/admin_header.php';
require_once __DIR__ . '/../inc/sidebar_admin.php';
?>

  <!-- ============ MAIN CONTENT AREA ============ -->
  <main class="main">

    <!-- TOP NAVIGATION BAR -->
    <header class="topnav">
      <div class="topnav-left">
        <button class="hamburger" id="hamburger" aria-label="Open menu">
          <i data-lucide="menu"></i>
        </button>
        <div class="page-title">
          <h2>Categories & Locations</h2>
          <p>Manage emergency categories, states, and LGAs</p>
        </div>
      </div>

      <div class="topnav-right">
        <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">
          <i data-lucide="moon" id="themeIcon"></i>
        </button>

        <div style="position: relative;">
          <button class="icon-btn" id="notifBtn" aria-label="Notifications">
            <i data-lucide="bell"></i>
            <span class="badge">4</span>
          </button>
          <div class="notif-dropdown" id="notifDropdown">
            <div class="notif-header">
              <h4>Notifications</h4>
              <span>Mark all read</span>
            </div>
            <div class="notif-list">
              <div class="notif-item unread">
                <div class="notif-icon red"><i data-lucide="flame"></i></div>
                <div class="notif-content">
                  <div class="title">Critical incident reported</div>
                  <div class="desc">Fire outbreak in Kaduna South Market</div>
                  <div class="time">2 minutes ago</div>
                </div>
              </div>
              <div class="notif-item unread">
                <div class="notif-icon orange"><i data-lucide="clock"></i></div>
                <div class="notif-content">
                  <div class="title">SLA breach warning</div>
                  <div class="desc">3 reports pending over 30 minutes</div>
                  <div class="time">12 minutes ago</div>
                </div>
              </div>
              <div class="notif-item unread">
                <div class="notif-icon green"><i data-lucide="user-plus"></i></div>
                <div class="notif-content">
                  <div class="title">New respondent registered</div>
                  <div class="desc">Ibrahim Musa joined Kano unit</div>
                  <div class="time">1 hour ago</div>
                </div>
              </div>
              <div class="notif-item unread">
                <div class="notif-icon blue"><i data-lucide="check-circle-2"></i></div>
                <div class="notif-content">
                  <div class="title">System update complete</div>
                  <div class="desc">Database backup finished successfully</div>
                  <div class="time">3 hours ago</div>
                </div>
              </div>
            </div>
            <div class="notif-footer">
              <a href="#">View all notifications →</a>
            </div>
          </div>
        </div>

        <div class="profile-chip">
          <div class="avatar"><?= $admin_initials ?></div>
          <div>
            <div class="name"><?= $admin_name ?></div>
            <div class="role"><?= $admin_role ?></div>
          </div>
        </div>
      </div>
    </header>

    <!-- CONTENT SECTION -->
    <section class="content">

      <!-- PAGE HEADER -->
      <div class="page-header">
        <div class="page-header-left">
          <h1>Category & Location Management</h1>
          <p>Manage emergency categories and the states and LGAs available throughout the Rescue Line reporting system.</p>
        </div>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="summary-grid">
        <div class="summary-card green">
          <div class="summary-icon green"><i data-lucide="tags"></i></div>
          <div class="summary-info">
            <div class="value" id="statTotalCat">6</div>
            <div class="label">Total Categories</div>
          </div>
        </div>
        <div class="summary-card blue">
          <div class="summary-icon blue"><i data-lucide="check-circle-2"></i></div>
          <div class="summary-info">
            <div class="value" id="statActiveCat">5</div>
            <div class="label">Active Categories</div>
          </div>
        </div>
        <div class="summary-card orange">
          <div class="summary-icon orange"><i data-lucide="map"></i></div>
          <div class="summary-info">
            <div class="value" id="statStates">37</div>
            <div class="label">Total States</div>
          </div>
        </div>
        <div class="summary-card purple">
          <div class="summary-icon purple"><i data-lucide="map-pin"></i></div>
          <div class="summary-info">
            <div class="value" id="statLgas">774</div>
            <div class="label">Total LGAs</div>
          </div>
        </div>
      </div>

      <!-- USSD INFO PANEL -->
      <div class="ussd-panel">
        <div class="ussd-icon"><i data-lucide="smartphone"></i></div>
        <div class="ussd-content">
          <h4>USSD Location Data <span class="tag">Critical</span></h4>
          <p>States and LGAs managed here are used to structure location options presented to users during emergency reporting via USSD (*123#). Changes made here will affect the available location options in the reporting system, respondent assignments, and geographic filters across the admin dashboard.</p>
        </div>
      </div>

      <!-- EMERGENCY CATEGORIES SECTION -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="dot"></span>
            Emergency Categories
            <span class="count" id="catCount">6</span>
          </div>
          <button class="btn btn-primary" onclick="openAddCategory()">
            <i data-lucide="plus"></i> Add Category
          </button>
        </div>

        <div class="filter-bar">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search categories..." id="catSearch" />
          </div>
          <select class="filter-select" id="catStatusFilter">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button class="btn btn-ghost btn-sm" id="catClearBtn" onclick="clearCatFilters()" style="display: none;">
            <i data-lucide="x"></i> Clear
          </button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Reports Count</th>
                <th>Status</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="catTableBody"></tbody>
          </table>
        </div>
        <div class="data-cards" id="catCards"></div>
      </div>

      <!-- STATE & LGA MANAGEMENT SECTION -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="dot"></span>
            State & LGA Management
          </div>
        </div>

        <div class="tabs">
          <div class="tab active" data-tab="states" onclick="switchTab('states')">
            <i data-lucide="map" style="width: 14px; height: 14px;"></i> States
            <span class="tab-count" id="statesCount">37</span>
          </div>
          <div class="tab" data-tab="lgas" onclick="switchTab('lgas')">
            <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> LGAs
            <span class="tab-count" id="lgasCount">774</span>
          </div>
        </div>

        <!-- STATES TAB -->
        <div class="tab-content" id="statesTab">
          <div class="filter-bar">
            <div class="search-box">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Search states..." id="stateSearch" />
            </div>
            <select class="filter-select" id="stateStatusFilter">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="stateClearBtn" onclick="clearStateFilters()" style="display: none;">
              <i data-lucide="x"></i> Clear
            </button>
            <button class="btn btn-primary btn-sm" onclick="openAddState()">
              <i data-lucide="plus"></i> Add State
            </button>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>State Name</th>
                  <th>State Code</th>
                  <th>LGAs</th>
                  <th>Reports</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="stateTableBody"></tbody>
            </table>
          </div>
          <div class="data-cards" id="stateCards"></div>
        </div>

        <!-- LGAS TAB -->
        <div class="tab-content" id="lgasTab" style="display: none;">
          <div class="filter-bar">
            <div class="search-box">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Search LGAs..." id="lgaSearch" />
            </div>
            <select class="filter-select" id="lgaStateFilter">
              <option value="">All States</option>
            </select>
            <select class="filter-select" id="lgaStatusFilter">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="lgaClearBtn" onclick="clearLgaFilters()" style="display: none;">
              <i data-lucide="x"></i> Clear
            </button>
            <button class="btn btn-primary btn-sm" onclick="openAddLga()">
              <i data-lucide="plus"></i> Add LGA
            </button>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>LGA Name</th>
                  <th>State</th>
                  <th>Reports</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="lgaTableBody"></tbody>
            </table>
          </div>
          <div class="data-cards" id="lgaCards"></div>
        </div>
      </div>

    </section>
  </main>
</div>

<!-- ============ MODALS ============ -->
<!-- Category Modal -->
<div class="modal-overlay" id="categoryModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-header-text">
        <h3 id="catModalTitle">Add New Category</h3>
        <p id="catModalSubtitle">Create a new emergency category for the reporting system.</p>
      </div>
      <button class="modal-close" onclick="closeModal('categoryModal')"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <form id="categoryForm" onsubmit="event.preventDefault(); saveCategory();">
        <input type="hidden" id="catId" />
        <div class="form-group">
          <label class="form-label">Category Name <span class="required">*</span></label>
          <input type="text" class="form-input" id="catName" placeholder="e.g. Fire, Medical, Accident" required />
          <div class="form-error" id="catNameError">Category name is required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Description <span class="required">*</span></label>
          <textarea class="form-textarea" id="catDescription" placeholder="Brief description..." required></textarea>
          <div class="form-error" id="catDescError">Description is required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select-input" id="catStatus">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div class="form-hint">Inactive categories won't appear in the USSD reporting menu.</div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('categoryModal')">Cancel</button>
      <button class="btn btn-primary" onclick="saveCategory()"><i data-lucide="check"></i> <span id="catSaveBtn">Save Category</span></button>
    </div>
  </div>
</div>

<!-- State Modal -->
<div class="modal-overlay" id="stateModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-header-text">
        <h3 id="stateModalTitle">Add New State</h3>
        <p id="stateModalSubtitle">Add a new Nigerian state to the location database.</p>
      </div>
      <button class="modal-close" onclick="closeModal('stateModal')"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <form id="stateForm" onsubmit="event.preventDefault(); saveState();">
        <input type="hidden" id="stateId" />
        <div class="form-group">
          <label class="form-label">State Name <span class="required">*</span></label>
          <input type="text" class="form-input" id="stateName" placeholder="e.g. Kaduna, Kano, Lagos" required />
          <div class="form-error" id="stateNameError">State name is required</div>
        </div>
        <div class="form-group">
          <label class="form-label">State Code <span class="required">*</span></label>
          <input type="text" class="form-input" id="stateCode" placeholder="e.g. KD, KN, LA" maxlength="3" style="text-transform: uppercase;" required />
          <div class="form-error" id="stateCodeError">State code is required (max 3 characters)</div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select-input" id="stateStatus">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('stateModal')">Cancel</button>
      <button class="btn btn-primary" onclick="saveState()"><i data-lucide="check"></i> <span id="stateSaveBtn">Save State</span></button>
    </div>
  </div>
</div>

<!-- LGA Modal -->
<div class="modal-overlay" id="lgaModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-header-text">
        <h3 id="lgaModalTitle">Add New LGA</h3>
        <p id="lgaModalSubtitle">Add a new Local Government Area under a state.</p>
      </div>
      <button class="modal-close" onclick="closeModal('lgaModal')"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <form id="lgaForm" onsubmit="event.preventDefault(); saveLga();">
        <input type="hidden" id="lgaId" />
        <div class="form-group">
          <label class="form-label">LGA Name <span class="required">*</span></label>
          <input type="text" class="form-input" id="lgaName" placeholder="e.g. Kaduna South, Zaria" required />
          <div class="form-error" id="lgaNameError">LGA name is required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Parent State <span class="required">*</span></label>
          <select class="form-select-input" id="lgaState" required>
            <option value="">Select state...</option>
          </select>
          <div class="form-error" id="lgaStateError">Please select a parent state</div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select-input" id="lgaStatus">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('lgaModal')">Cancel</button>
      <button class="btn btn-primary" onclick="saveLga()"><i data-lucide="check"></i> <span id="lgaSaveBtn">Save LGA</span></button>
    </div>
  </div>
</div>

<!-- Confirm Modal -->
<div class="modal-overlay" id="confirmModal">
  <div class="modal" style="max-width: 440px;">
    <div class="modal-body" style="padding: 32px 24px;">
      <div class="confirm-icon" id="confirmIconWrap"><i data-lucide="alert-triangle"></i></div>
      <div class="confirm-text">
        <h3 id="confirmTitle">Confirm Action</h3>
        <p id="confirmMessage"></p>
      </div>
      <div id="confirmWarningWrap"></div>
      <div class="confirm-footer">
        <button class="btn btn-secondary" onclick="closeModal('confirmModal')">Cancel</button>
        <button class="btn" id="confirmActionBtn">Confirm</button>
      </div>
    </div>
  </div>
</div>

<!-- TOAST -->
<div class="toast" id="toast">
  <i data-lucide="check-circle"></i>
  <span id="toastMessage">Action completed</span>
</div>

<!-- Mobile Sidebar Overlay -->
<div class="overlay" id="overlay"></div>

<!-- Scripts -->
<script src="../assets/js/admin/index.js"></script>
<script src="../assets/js/admin/categories.js"></script>

</body>
</html>