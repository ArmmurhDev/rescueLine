<?php
/**
 * RescueLine - Incoming Emergency Reports
 * Manage and respond to emergency reports submitted via USSD
 */

// Page Configuration
$page_title       = 'RescueLine • Incoming Reports';
$page_description = 'RescueLine - Incoming Emergency Reports Management';
$active_page      = 'incoming_reports';
$extra_css        = [
    '../assets/css/respondant/dashboard.css',
    '../assets/css/respondant/incorming-report.css',
    '../assets/css/respondant/active-responses.css',
    '../assets/css/respondant/report-details.css'
];

// Reusable Header & Sidebar
require_once __DIR__ . '/../inc/header.php';
require_once __DIR__ . '/../inc/sidebar_respondant.php';
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
          <h2>Incoming Reports</h2>
          <p>Manage and respond to emergency reports submitted via USSD</p>
        </div>
      </div>

      <div class="topnav-right">
        <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">
          <i data-lucide="moon" id="themeIcon"></i>
        </button>

        <div style="position: relative;">
          <button class="icon-btn" id="notifBtn" aria-label="Notifications">
            <i data-lucide="bell"></i>
            <span class="badge">3</span>
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
                  <div class="title">Critical emergency reported</div>
                  <div class="desc">Fire reported in Kaduna South</div>
                  <div class="time">2 minutes ago</div>
                </div>
              </div>
              <div class="notif-item unread">
                <div class="notif-icon green"><i data-lucide="clipboard-list"></i></div>
                <div class="notif-content">
                  <div class="title">Report assigned</div>
                  <div class="desc">RL-0024 has been assigned to you</div>
                  <div class="time">15 minutes ago</div>
                </div>
              </div>
              <div class="notif-item unread">
                <div class="notif-icon orange"><i data-lucide="clock"></i></div>
                <div class="notif-content">
                  <div class="title">Status update required</div>
                  <div class="desc">RL-0018 is awaiting response</div>
                  <div class="time">32 minutes ago</div>
                </div>
              </div>
            </div>
            <div class="notif-footer">
              <a href="notifications.php">View all notifications →</a>
            </div>
          </div>
        </div>

        <div class="profile-chip">
          <div class="avatar">AA</div>
          <div>
            <div class="name">Abdulrauf</div>
            <div class="role">Respondent</div>
          </div>
        </div>
      </div>
    </header>

    <!-- CONTENT SECTION -->
    <section class="content">
      <div class="page-container" id="incomingReportsContainer">

        <!-- PAGE HEADER -->
        <div class="page-header">
          <div class="page-header-left">
            <h1>Incoming Emergency Reports</h1>
            <p>Manage and respond to emergency reports submitted via USSD</p>
          </div>
          <div class="page-header-actions">
            <button type="button" class="btn btn-secondary">
              <i data-lucide="download"></i>
              Export
            </button>
            <button type="button" class="btn btn-primary" onclick="window.initIncomingReports && window.initIncomingReports()">
              <i data-lucide="refresh-cw"></i>
              Refresh
            </button>
          </div>
        </div>

        <!-- STATS SUMMARY -->
        <div class="stats-row">
          <div class="stat-mini">
            <div class="stat-mini-icon green"><i data-lucide="inbox"></i></div>
            <div class="stat-mini-info">
              <div class="value">12</div>
              <div class="label">Total New</div>
            </div>
          </div>
          <div class="stat-mini">
            <div class="stat-mini-icon red"><i data-lucide="alert-octagon"></i></div>
            <div class="stat-mini-info">
              <div class="value">3</div>
              <div class="label">Critical</div>
            </div>
          </div>
          <div class="stat-mini">
            <div class="stat-mini-info orange"><i data-lucide="clock"></i></div>
            <div class="stat-mini-info">
              <div class="value">5</div>
              <div class="label">Awaiting Response</div>
            </div>
          </div>
          <div class="stat-mini">
            <div class="stat-mini-icon blue"><i data-lucide="user-check"></i></div>
            <div class="stat-mini-info">
              <div class="value">4</div>
              <div class="label">Assigned Today</div>
            </div>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="filter-card">
          <div class="filter-bar">
            <div class="search-box">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Search by ID, location, or type..." id="searchInput" autocomplete="off" />
            </div>
            <select class="filter-select" id="priorityFilter" aria-label="Filter by priority">
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>
            <select class="filter-select" id="typeFilter" aria-label="Filter by emergency type">
              <option value="">All Types</option>
              <option value="Fire">Fire</option>
              <option value="Accident">Accident</option>
              <option value="Medical">Medical</option>
              <option value="Flood">Flood</option>
              <option value="Security">Security</option>
            </select>
            <select class="filter-select" id="statusFilter" aria-label="Filter by status">
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
            </select>
            <div class="filter-actions">
              <button type="button" class="icon-btn-small" title="Reset filters" id="resetFilters">
                <i data-lucide="rotate-ccw"></i>
              </button>
              <button type="button" class="icon-btn-small" title="More filters">
                <i data-lucide="sliders-horizontal"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- BULK ACTIONS -->
        <div class="bulk-actions" id="bulkActions">
          <div class="bulk-info">
            <i data-lucide="check-square"></i>
            <span id="selectedCount">0 reports selected</span>
          </div>
          <div class="bulk-actions-buttons">
            <button type="button" class="bulk-btn bulk-btn-accept">
              <i data-lucide="check-circle"></i>
              Accept Selected
            </button>
            <button type="button" class="bulk-btn bulk-btn-assign">
              <i data-lucide="user-plus"></i>
              Assign
            </button>
            <button type="button" class="bulk-btn bulk-btn-clear" id="clearSelection">
              <i data-lucide="x"></i>
              Clear
            </button>
          </div>
        </div>

        <!-- REPORTS TABLE -->
        <div class="reports-card">
          <div class="table-wrap">
            <table class="reports-table">
              <thead>
                <tr>
                  <th><input type="checkbox" id="selectAll" /></th>
                  <th>Report ID</th>
                  <th>Emergency Type</th>
                  <th>Location</th>
                  <th>Reporter</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="reportsBody"></tbody>
            </table>
          </div>

          <div class="report-cards" id="reportCards"></div>

          <!-- PAGINATION -->
          <div class="pagination-bar">
            <div class="pagination-info">
              Showing <strong>1-10</strong> of <strong>47</strong> reports
            </div>
            <div class="pagination-controls">
              <button type="button" class="page-btn" disabled>
                <i data-lucide="chevron-left"></i>
              </button>
              <button type="button" class="page-btn active">1</button>
              <button type="button" class="page-btn">2</button>
              <button type="button" class="page-btn">3</button>
              <button type="button" class="page-btn">4</button>
              <button type="button" class="page-btn">5</button>
              <button type="button" class="page-btn">
                <i data-lucide="chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  </main>
</div>

<!-- Mobile Sidebar Overlay -->
<div class="overlay" id="overlay"></div>

<!-- Page Scripts -->
<script src="../assets/js/respondant/incorming-report.js"></script>
<script src="../assets/js/respondant/active-responses.js"></script>
<script src="../assets/js/respondant/report-details.js"></script>
<script src="../assets/js/respondant/dashboard.js"></script>

</body>
</html>