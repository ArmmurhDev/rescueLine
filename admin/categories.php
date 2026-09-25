<?php
/**
 * RescueLine - Admin Categories Management
 * Emergency Incident Reporting & Response Management
 */

// Page Configuration
$page_title       = 'RescueLine • Emergency Categories';
$page_description = 'RescueLine - Emergency Incident Reporting Categories Management';
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
          <h2>Emergency Categories</h2>
          <p>Manage incident categories and response types</p>
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
          <h1>Emergency Categories</h1>
          <p>Manage emergency incident categories, icons, and reporting classifications across the Rescue Line platform.</p>
        </div>
        <button class="btn btn-primary" onclick="openAddCategory()">
          <i data-lucide="plus"></i> Add Category
        </button>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="summary-grid">
        <div class="summary-card green">
          <div class="summary-icon green"><i data-lucide="tags"></i></div>
          <div class="summary-info">
            <div class="value" id="statTotalCat">0</div>
            <div class="label">Total Categories</div>
          </div>
        </div>
        <div class="summary-card blue">
          <div class="summary-icon blue"><i data-lucide="check-circle-2"></i></div>
          <div class="summary-info">
            <div class="value" id="statActiveCat">0</div>
            <div class="label">Active Categories</div>
          </div>
        </div>
        <div class="summary-card orange">
          <div class="summary-icon orange"><i data-lucide="pause-circle"></i></div>
          <div class="summary-info">
            <div class="value" id="statInactiveCat">0</div>
            <div class="label">Inactive Categories</div>
          </div>
        </div>
        <div class="summary-card purple">
          <div class="summary-icon purple"><i data-lucide="file-text"></i></div>
          <div class="summary-info">
            <div class="value" id="statTotalReports">0</div>
            <div class="label">Total Reports</div>
          </div>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div class="filter-card">
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
          <button class="clear-filters" id="catClearBtn" onclick="clearCatFilters()">
            <i data-lucide="x"></i> Clear Filters
          </button>
        </div>
      </div>

      <!-- TABLE CARD -->
      <div class="table-card">
        <div class="table-card-header">
          <div class="table-card-title">
            <span class="dot"></span>
            Category Directory
            <span class="count" id="catCount">0</span>
          </div>
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
          <textarea class="form-textarea" id="catDescription" placeholder="Brief description of this emergency type..." required></textarea>
          <div class="form-error" id="catDescError">Description is required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select-input" id="catStatus">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div class="form-hint">Inactive categories won't appear in the reporting menus.</div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('categoryModal')">Cancel</button>
      <button class="btn btn-primary" onclick="saveCategory()"><i data-lucide="check"></i> <span id="catSaveBtn">Save Category</span></button>
    </div>
  </div>
</div>

<!-- Confirm Delete Modal -->
<div class="modal-overlay" id="confirmModal">
  <div class="modal" style="max-width: 440px;">
    <div class="modal-body" style="padding: 32px 24px;">
      <div class="confirm-icon danger" id="confirmIconWrap"><i data-lucide="alert-triangle"></i></div>
      <div class="confirm-text">
        <h3 id="confirmTitle">Confirm Action</h3>
        <p id="confirmMessage">Are you sure you want to proceed?</p>
      </div>
      <div class="confirm-footer">
        <button class="btn btn-secondary" onclick="closeModal('confirmModal')">Cancel</button>
        <button class="btn btn-danger" id="confirmActionBtn">Confirm</button>
      </div>
    </div>
  </div>
</div>

<!-- TOAST NOTIFICATION -->
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