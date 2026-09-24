<?php
/**
 * RescueLine - Admin Reports Management
 * Emergency Incident Reporting & Response Management
 */

// Page Configuration
$page_title       = 'RescueLine • Reports';
$page_description = 'RescueLine - Emergency Incident Reporting & Incident Monitoring Dashboard';
$active_page      = 'reports';
$extra_css        = [
    '../assets/css/admin/index.css',
    '../assets/css/admin/respondents.css'
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
          <h2>Reports</h2>
          <p>Manage and monitor all emergency reports across the system</p>
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
          <h1>Emergency Reports</h1>
          <p>Manage and monitor all emergency reports across the system</p>
        </div>
        <button class="btn btn-secondary">
          <i data-lucide="download"></i>
          Export
        </button>
      </div>

      <!-- STATS ROW -->
      <div class="stats-row">
        <div class="stat-mini total" data-filter-status="" onclick="filterByStatus('')">
          <div class="stat-mini-icon blue"><i data-lucide="file-text"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statTotal">1,247</div>
            <div class="label">Total Reports</div>
            <div class="trend up">↑ 18% this month</div>
          </div>
        </div>
        <div class="stat-mini pending" data-filter-status="pending" onclick="filterByStatus('pending')">
          <div class="stat-mini-icon orange"><i data-lucide="clock"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statPending">86</div>
            <div class="label">Pending</div>
            <div class="trend down">↓ 5% from last week</div>
          </div>
        </div>
        <div class="stat-mini responding" data-filter-status="responding" onclick="filterByStatus('responding')">
          <div class="stat-mini-icon cyan"><i data-lucide="activity"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statResponding">34</div>
            <div class="label">Responding</div>
            <div class="trend up">↑ 12% this week</div>
          </div>
        </div>
        <div class="stat-mini resolved" data-filter-status="resolved" onclick="filterByStatus('resolved')">
          <div class="stat-mini-icon green"><i data-lucide="check-circle-2"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statResolved">1,127</div>
            <div class="label">Resolved</div>
            <div class="trend up">↑ 24% this month</div>
          </div>
        </div>
      </div>

      <!-- FILTER CARD -->
      <div class="filter-card">
        <div class="filter-main">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search by ID, type, state, LGA, respondent..." id="searchInput" />
          </div>
          <button class="filter-toggle" id="filterToggle">
            <i data-lucide="sliders-horizontal"></i>
            Advanced Filters
          </button>
          <button class="clear-filters" id="clearFilters" onclick="clearAllFilters()">
            <i data-lucide="x"></i>
            Clear Filters
          </button>
        </div>

        <div class="advanced-filters" id="advancedFilters">
          <div class="advanced-grid">
            <div class="filter-group">
              <label class="filter-label">State</label>
              <select class="filter-select" id="stateFilter">
                <option value="">All States</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">LGA</label>
              <select class="filter-select" id="lgaFilter" disabled>
                <option value="">Select state first</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Report Type</label>
              <select class="filter-select" id="typeFilter">
                <option value="">All Types</option>
                <option value="Fire">Fire</option>
                <option value="Accident">Accident</option>
                <option value="Medical">Medical</option>
                <option value="Security">Security</option>
                <option value="Flood">Flood</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Status</label>
              <select class="filter-select" id="statusFilter">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="responding">Responding</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div class="filter-group" style="grid-column: span 2;">
              <label class="filter-label">Date Range</label>
              <div class="date-range">
                <input type="date" class="filter-date" id="dateFrom" />
                <input type="date" class="filter-date" id="dateTo" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLE CARD -->
      <div class="table-card">
        <div class="table-card-header">
          <div class="table-card-title">
            <span class="dot"></span>
            All Reports
            <span class="count" id="resultCount">1,247</span>
          </div>
          <div class="table-card-actions">
            <div class="per-page">
              <span>Show</span>
              <select id="perPage">
                <option value="10">10</option>
                <option value="20" selected>20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span>entries</span>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th data-sort="id">Report ID <i data-lucide="arrow-down"></i></th>
                <th data-sort="type">Type <i data-lucide="arrow-down"></i></th>
                <th data-sort="location">Location <i data-lucide="arrow-down"></i></th>
                <th data-sort="reporter">Reported By <i data-lucide="arrow-down"></i></th>
                <th data-sort="date">Date & Time <i data-lucide="arrow-down"></i></th>
                <th data-sort="status">Status <i data-lucide="arrow-down"></i></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>

        <div class="report-cards" id="reportCards"></div>

        <div class="pagination-bar" id="paginationBar">
          <div class="pagination-info" id="paginationInfo">Showing 1–20 of 1,247 reports</div>
          <div class="pagination-controls" id="paginationControls"></div>
        </div>
      </div>

    </section>
  </main>
</div>

<!-- ============ REASSIGN MODAL ============ -->
<div class="modal-overlay" id="reassignModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-header-text">
        <h3>Reassign Report</h3>
        <p id="reassignSubtitle">Reassign report <strong id="reassignReportId"></strong> to a different respondent.</p>
      </div>
      <button class="modal-close" onclick="closeModal('reassignModal')"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <!-- Current assignment -->
      <div class="current-assignment">
        <div class="current-assignment-label">Current Respondent</div>
        <div class="current-assignment-info" id="currentAssignment">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- New assignment -->
      <div class="form-group">
        <label class="form-label">Assign To <span class="required">*</span></label>
        <div class="searchable-dropdown" id="respondentDropdown">
          <div class="dropdown-input-wrap">
            <i data-lucide="search"></i>
            <input type="text" class="dropdown-input" id="respondentSearch" placeholder="Search by name, phone, email, or state..." autocomplete="off" />
          </div>
          <div class="dropdown-list" id="respondentList"></div>
        </div>
        <input type="hidden" id="newRespondentId" />
      </div>

      <!-- Confirmation message -->
      <div id="reassignConfirm" style="display: none; background: var(--green-soft); border: 1px solid var(--green); border-radius: 8px; padding: 12px; margin-top: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--green); font-weight: 600;">
          <i data-lucide="info" style="width: 16px; height: 16px;"></i>
          <span id="reassignConfirmText"></span>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('reassignModal')">Cancel</button>
      <button class="btn btn-primary" id="reassignSubmitBtn" onclick="submitReassign()" disabled>
        <i data-lucide="user-check"></i>
        Reassign Report
      </button>
    </div>
  </div>
</div>

<!-- ============ CONFIRM MODAL ============ -->
<div class="modal-overlay" id="confirmModal">
  <div class="modal" style="max-width: 420px;">
    <div class="modal-body" style="padding: 32px 24px;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--green-soft); color: var(--green); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <i data-lucide="check-circle" style="width: 28px; height: 28px;"></i>
      </div>
      <div style="text-align: center;">
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;" id="confirmTitle">Confirm Action</h3>
        <p style="font-size: 13px; color: var(--text-soft); line-height: 1.6;" id="confirmMessage"></p>
      </div>
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 24px;">
        <button class="btn btn-secondary" onclick="closeModal('confirmModal')">Cancel</button>
        <button class="btn btn-primary" id="confirmAction">Confirm</button>
      </div>
    </div>
  </div>
</div>

<!-- ============ DETAIL PANEL (Slide-over) ============ -->
<div class="detail-overlay" id="detailOverlay" onclick="closeDetail()"></div>
<aside class="detail-panel" id="detailPanel">
  <div class="detail-header">
    <div class="detail-header-left">
      <div class="detail-title">
        <h2 id="detailId">RL-0001</h2>
        <span class="status-badge" id="detailStatusBadge">Pending</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-soft);">
        <i data-lucide="flame" id="detailTypeIcon" style="width: 14px; height: 14px;"></i>
        <span id="detailType">Fire Emergency</span>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-sm btn-secondary" onclick="closeDetail()">
        <i data-lucide="x"></i>
      </button>
    </div>
  </div>

  <div class="detail-body">
    <!-- Action buttons -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
      <button class="btn btn-sm btn-primary" onclick="openReassignFromDetail()">
        <i data-lucide="user-check"></i>
        Reassign Report
      </button>
      <button class="btn btn-sm btn-secondary" onclick="viewRespondentFromDetail()">
        <i data-lucide="user"></i>
        View Respondent
      </button>
      <button class="btn btn-sm btn-ghost" onclick="closeDetail()">
        <i data-lucide="arrow-left"></i>
        Back to Reports
      </button>
    </div>

    <!-- Status Timeline -->
    <div class="detail-section">
      <div class="detail-section-header">
        <div class="detail-section-title">
          <i data-lucide="git-branch"></i>
          Status Timeline
        </div>
      </div>
      <div class="detail-section-body">
        <div class="status-timeline" id="detailTimeline"></div>
      </div>
    </div>

    <!-- Report Information -->
    <div class="detail-section">
      <div class="detail-section-header">
        <div class="detail-section-title">
          <i data-lucide="file-text"></i>
          Report Information
        </div>
      </div>
      <div class="detail-section-body">
        <div class="info-grid" id="detailInfoGrid"></div>
      </div>
    </div>

    <!-- Description -->
    <div class="detail-section">
      <div class="detail-section-header">
        <div class="detail-section-title">
          <i data-lucide="align-left"></i>
          Description
        </div>
      </div>
      <div class="detail-section-body">
        <div class="description-text" id="detailDescription"></div>
      </div>
    </div>

    <!-- Assignment -->
    <div class="detail-section">
      <div class="detail-section-header">
        <div class="detail-section-title">
          <i data-lucide="user-check"></i>
          Assignment
        </div>
      </div>
      <div class="detail-section-body">
        <div class="info-grid" id="detailAssignmentGrid"></div>
      </div>
    </div>

    <!-- History Log -->
    <div class="detail-section">
      <div class="detail-section-header">
        <div class="detail-section-title">
          <i data-lucide="history"></i>
          History Log
        </div>
        <span style="font-size: 12px; color: var(--muted);" id="historyCount">0 events</span>
      </div>
      <div class="detail-section-body" style="padding: 8px 20px 20px;">
        <div class="history-log" id="detailHistory"></div>
      </div>
    </div>
  </div>
</aside>

<!-- TOAST -->
<div class="toast" id="toast">
  <i data-lucide="check-circle"></i>
  <span id="toastMessage">Action completed</span>
</div>

<!-- Mobile Sidebar Overlay -->
<div class="overlay" id="overlay"></div>

<!-- Scripts -->
<script src="../assets/js/admin/index.js"></script>
<script src="../assets/js/admin/respondents.js"></script>

</body>
</html>