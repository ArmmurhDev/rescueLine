<?php
/**
 * RescueLine - Admin Emergency Reports Management
 * Emergency Incident Reporting & Response Management
 */

// Page Configuration
$page_title       = 'RescueLine • Emergency Reports';
$page_description = 'RescueLine - Emergency Incident Reporting & Incident Monitoring Dashboard';
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
          <h2>Emergency Reports</h2>
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
          <h1>Emergency Incident Reports</h1>
          <p>Live incident feed and real-time response management from the database</p>
        </div>
        <button class="btn btn-secondary" onclick="exportReportsCSV()">
          <i data-lucide="download"></i>
          Export CSV
        </button>
      </div>

      <!-- STATS ROW (Interactive Status Filters) -->
      <div class="stats-row">
        <div class="stat-mini total" data-filter-status="" onclick="filterByStatus('')">
          <div class="stat-mini-icon blue"><i data-lucide="file-text"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statTotal">0</div>
            <div class="label">Total Reports</div>
          </div>
        </div>
        <div class="stat-mini pending" data-filter-status="pending" onclick="filterByStatus('pending')">
          <div class="stat-mini-icon orange"><i data-lucide="clock"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statPending">0</div>
            <div class="label">Pending</div>
          </div>
        </div>
        <div class="stat-mini responding" data-filter-status="responding" onclick="filterByStatus('responding')">
          <div class="stat-mini-icon cyan"><i data-lucide="activity"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statResponding">0</div>
            <div class="label">Responding</div>
          </div>
        </div>
        <div class="stat-mini resolved" data-filter-status="resolved" onclick="filterByStatus('resolved')">
          <div class="stat-mini-icon green"><i data-lucide="check-circle-2"></i></div>
          <div class="stat-mini-info">
            <div class="value" id="statResolved">0</div>
            <div class="label">Resolved</div>
          </div>
        </div>
      </div>

      <!-- FILTER CARD -->
      <div class="filter-card">
        <div class="filter-main">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search by ID, type, state, LGA, reporter phone, or responder..." id="searchInput" />
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
          </div>
        </div>
      </div>

      <!-- TABLE CARD -->
      <div class="table-card">
        <div class="table-card-header">
          <div class="table-card-title">
            <span class="dot"></span>
            All Reports
            <span class="count" id="resultCount">0</span>
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
                <th>Report ID</th>
                <th>Type</th>
                <th>Location</th>
                <th>Reporter</th>
                <th>Assigned Responder</th>
                <th>Status</th>
                <th>Date & Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>

        <div class="report-cards" id="reportCards"></div>

        <div class="pagination-bar" id="paginationBar">
          <div class="pagination-info" id="paginationInfo">Showing 0 of 0 reports</div>
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
        <h3>Assign / Reassign Report</h3>
        <p id="reassignSubtitle">Assign emergency incident <strong id="reassignReportId"></strong> to an active responder.</p>
      </div>
      <button class="modal-close" onclick="closeModal('reassignModal')"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <!-- Current assignment -->
      <div class="current-assignment">
        <div class="current-assignment-label">Current Assignment</div>
        <div class="current-assignment-info" id="currentAssignment">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- New assignment -->
      <div class="form-group" style="margin-top: 16px;">
        <label class="form-label">Select Active Responder <span class="required">*</span></label>
        <select class="form-select-input" id="respondentSelect">
          <option value="">Select a responder...</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Dispatch Notes (Optional)</label>
        <textarea class="form-textarea" id="reassignNotes" placeholder="Additional instructions for the respondent..." style="min-height: 60px;"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('reassignModal')">Cancel</button>
      <button class="btn btn-primary" id="reassignSubmitBtn" onclick="submitReassign()">
        <i data-lucide="user-check"></i>
        Confirm Assignment
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

<!-- ============ DETAIL SLIDE-OVER PANEL ============ -->
<div class="detail-overlay" id="detailOverlay" onclick="closeDetailPanel()"></div>
<aside class="detail-panel" id="detailPanel">
  <div class="detail-header">
    <div class="detail-header-left">
      <div class="detail-title">
        <h2 id="detailId">RL-0000</h2>
        <span class="status-badge" id="detailStatusBadge">Pending</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-soft);">
        <i data-lucide="alert-circle" id="detailTypeIcon" style="width: 14px; height: 14px;"></i>
        <span id="detailType">Emergency</span>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-sm btn-secondary" onclick="closeDetailPanel()">
        <i data-lucide="x"></i>
      </button>
    </div>
  </div>

  <div class="detail-body">
    <!-- Action buttons -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;" id="detailActionButtons">
      <!-- Populated by JS -->
    </div>

    <!-- Status Timeline -->
    <div class="detail-section">
      <div class="detail-section-header">
        <div class="detail-section-title">
          <i data-lucide="git-branch"></i>
          Incident Audit Timeline
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
          Incident Information
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
          Responder Assignment
        </div>
      </div>
      <div class="detail-section-body">
        <div class="info-grid" id="detailAssignmentGrid"></div>
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
<script src="../assets/js/admin/report.js"></script>

</body>
</html>