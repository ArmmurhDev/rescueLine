<?php
/**
 * RescueLine - Admin Reports & Respondents Management
 * Emergency Incident Reporting & Response Management
 */

// Page Configuration
$page_title       = 'RescueLine • Reports & Respondents';
$page_description = 'RescueLine - Emergency Incident Reporting & Response Admin Management';
$active_page      = 'reports';
$extra_css        = [
    '../assets/css/admin/index.css',
    '../assets/css/admin/report.css'
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
          <h2>Reports & Respondents</h2>
          <p>Manage emergency respondents and their assigned coverage areas</p>
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
          <h1>Respondents & Reports</h1>
          <p>Manage emergency respondents and their assigned coverage areas</p>
        </div>
        <button class="btn btn-primary" onclick="openAddModal()">
          <i data-lucide="plus"></i>
          Add Respondent
        </button>
      </div>

      <!-- STATS ROW -->
      <div class="stats-row">
        <div class="stat-mini green">
          <div class="stat-mini-icon green"><i data-lucide="users"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statTotal">48</div>
            <div class="label">Total Respondents</div>
          </div>
        </div>
        <div class="stat-mini blue">
          <div class="stat-mini-icon blue"><i data-lucide="user-check"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statActive">42</div>
            <div class="label">Active</div>
          </div>
        </div>
        <div class="stat-mini orange">
          <div class="stat-mini-icon orange"><i data-lucide="user-x"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statInactive">6</div>
            <div class="label">Inactive</div>
          </div>
        </div>
        <div class="stat-mini red">
          <div class="stat-mini-icon red"><i data-lucide="map-pin"></i></div>
          <div class="stat-mini-info">
            <div class="value">14</div>
            <div class="label">States Covered</div>
          </div>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div class="filter-card">
        <div class="filter-bar">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search respondents by name, phone, or email..." id="searchInput" />
          </div>
          <select class="filter-select" id="stateFilter">
            <option value="">All States</option>
            <option value="Kaduna">Kaduna</option>
            <option value="Kano">Kano</option>
            <option value="FCT Abuja">FCT Abuja</option>
            <option value="Lagos">Lagos</option>
            <option value="Rivers">Rivers</option>
            <option value="Plateau">Plateau</option>
            <option value="Niger">Niger</option>
            <option value="Oyo">Oyo</option>
            <option value="Enugu">Enugu</option>
            <option value="Borno">Borno</option>
          </select>
          <select class="filter-select" id="statusFilter">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button class="clear-filters" id="clearFilters" onclick="clearAllFilters()">
            <i data-lucide="x"></i>
            Clear Filters
          </button>
        </div>
      </div>

      <!-- TABLE CARD -->
      <div class="table-card">
        <div class="table-card-header">
          <div class="table-card-title">
            <span class="dot"></span>
            All Respondents
            <span class="count" id="resultCount">48</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="resp-table">
            <thead>
              <tr>
                <th>Respondent</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Coverage State</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>

        <div class="resp-cards" id="respCards"></div>

        <!-- PAGINATION -->
        <div class="pagination-bar" id="paginationBar">
          <div class="pagination-info" id="paginationInfo">Showing 1–10 of 48 respondents</div>
          <div class="pagination-controls" id="paginationControls"></div>
        </div>
      </div>

    </section>
  </main>
</div>

<!-- ============ ADD MODAL ============ -->
<div class="modal-overlay" id="addModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-header-text">
        <h3>Add New Respondent</h3>
        <p>Create an account and assign a coverage state to a new emergency respondent.</p>
      </div>
      <button class="modal-close" onclick="closeModal('addModal')"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <form id="addForm" onsubmit="return handleAdd(event)">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" class="form-input" id="addName" placeholder="e.g. Musa Ibrahim" required />
          <div class="form-error" id="addNameError">Full name is required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number <span class="required">*</span></label>
          <input type="tel" class="form-input" id="addPhone" placeholder="e.g. 08031234567" required />
          <div class="form-error" id="addPhoneError">Valid phone number is required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address <span class="required">*</span></label>
          <input type="email" class="form-input" id="addEmail" placeholder="e.g. musa@rescueline.ng" required />
          <div class="form-error" id="addEmailError">Valid email address is required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Password <span class="required">*</span></label>
          <div class="password-wrap">
            <input type="password" class="form-input" id="addPassword" placeholder="Min. 8 characters" required />
            <button type="button" class="password-toggle" onclick="togglePassword('addPassword', this)">
              <i data-lucide="eye"></i>
            </button>
          </div>
          <div class="form-error" id="addPasswordError">Password must be at least 8 characters</div>
        </div>
        <div class="form-group">
          <label class="form-label">Assigned Coverage State <span class="required">*</span></label>
          <select class="form-select-input" id="addState" required>
            <option value="">Select a state...</option>
            <option value="Kaduna">Kaduna</option>
            <option value="Kano">Kano</option>
            <option value="FCT Abuja">FCT Abuja</option>
            <option value="Lagos">Lagos</option>
            <option value="Rivers">Rivers</option>
            <option value="Plateau">Plateau</option>
            <option value="Niger">Niger</option>
            <option value="Oyo">Oyo</option>
            <option value="Enugu">Enugu</option>
            <option value="Borno">Borno</option>
          </select>
          <div class="form-error" id="addStateError">Please select a coverage state</div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('addModal')">Cancel</button>
      <button class="btn btn-primary" onclick="handleAdd(event)">
        <i data-lucide="user-plus"></i>
        Add Respondent
      </button>
    </div>
  </div>
</div>

<!-- ============ EDIT MODAL ============ -->
<div class="modal-overlay" id="editModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-header-text">
        <h3>Edit Respondent</h3>
        <p>Update respondent information and coverage assignment.</p>
      </div>
      <button class="modal-close" onclick="closeModal('editModal')"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <form id="editForm">
        <input type="hidden" id="editId" />
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" class="form-input" id="editName" required />
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number <span class="required">*</span></label>
          <input type="tel" class="form-input" id="editPhone" required />
        </div>
        <div class="form-group">
          <label class="form-label">Email Address <span class="required">*</span></label>
          <input type="email" class="form-input" id="editEmail" required />
        </div>
        <div class="form-group">
          <label class="form-label">Assigned Coverage State <span class="required">*</span></label>
          <select class="form-select-input" id="editState" required>
            <option value="">Select a state...</option>
            <option value="Kaduna">Kaduna</option>
            <option value="Kano">Kano</option>
            <option value="FCT Abuja">FCT Abuja</option>
            <option value="Lagos">Lagos</option>
            <option value="Rivers">Rivers</option>
            <option value="Plateau">Plateau</option>
            <option value="Niger">Niger</option>
            <option value="Oyo">Oyo</option>
            <option value="Enugu">Enugu</option>
            <option value="Borno">Borno</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Account Status</label>
          <select class="form-select-input" id="editStatus">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('editModal')">Cancel</button>
      <button class="btn btn-primary" onclick="handleEdit()">
        <i data-lucide="check"></i>
        Save Changes
      </button>
    </div>
  </div>
</div>

<!-- ============ CONFIRM MODAL ============ -->
<div class="modal-overlay confirm-modal" id="confirmModal">
  <div class="modal">
    <div class="modal-body" style="padding: 32px 24px;">
      <div class="confirm-icon" id="confirmIcon"><i data-lucide="alert-triangle"></i></div>
      <div class="confirm-text">
        <h3 id="confirmTitle">Deactivate Respondent?</h3>
        <p id="confirmMessage">Are you sure you want to deactivate this respondent? They will no longer be available for active emergency response assignments.</p>
      </div>
      <div class="confirm-footer">
        <button class="btn btn-secondary" onclick="closeModal('confirmModal')">Cancel</button>
        <button class="btn" id="confirmAction" onclick="executeConfirm()">Deactivate</button>
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
<script src="../assets/js/admin/report.js"></script>

</body>
</html>