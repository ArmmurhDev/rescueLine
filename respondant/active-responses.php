<?php
/**
 * RescueLine - Active Emergency Responses
 * Monitor and manage ongoing emergency responses in real-time
 */

// Page Configuration
$page_title       = 'RescueLine • Active Responses';
$page_description = 'RescueLine - Monitor and manage ongoing emergency responses in real-time';
$active_page      = 'active_responses';
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
          <h2>Active Responses</h2>
          <p>Monitor and manage ongoing emergency responses in real-time</p>
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
      <div class="page-container" id="activeResponsesContainer">

        <!-- PAGE HEADER -->
        <div class="page-header">
          <div class="page-header-left">
            <h1>
              Active Responses
              <span class="live-dot" title="Live"></span>
            </h1>
            <p>Monitor and manage ongoing emergency responses in real-time</p>
          </div>
          <!--div class="page-header-actions">
            <button type="button" class="btn btn-secondary">
              <i data-lucide="map-pin"></i>
              Live Map
            </button>
            <button type="button" class="btn btn-primary" onclick="window.initActiveResponses && window.initActiveResponses()">
              <i data-lucide="refresh-cw"></i>
              Refresh
            </button>
          </div-->
        </div>

        <!-- STATS ROW -->
        <div class="stats-row">
          <div class="stat-mini green">
            <div class="stat-mini-icon green"><i data-lucide="activity"></i></div>
            <div class="stat-mini-info">
              <div class="value">5</div>
              <div class="label">Active Responses</div>
            </div>
          </div>
          <div class="stat-mini red">
            <div class="stat-mini-icon red"><i data-lucide="alert-triangle"></i></div>
            <div class="stat-mini-info">
              <div class="value">2</div>
              <div class="label">Urgent / Critical</div>
            </div>
          </div>
          <div class="stat-mini orange">
            <div class="stat-mini-icon orange"><i data-lucide="map-pin"></i></div>
            <div class="stat-mini-info">
              <div class="value">3</div>
              <div class="label">On Scene</div>
            </div>
          </div>
          <div class="stat-mini blue">
            <div class="stat-mini-icon blue"><i data-lucide="clock"></i></div>
            <div class="stat-mini-info">
              <div class="value">14m</div>
              <div class="label">Avg Response Time</div>
            </div>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="filter-card">
          <div class="filter-bar">
            <div class="search-box">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Search by ID, location, or respondent..." id="searchInput" autocomplete="off" />
            </div>
            <select class="filter-select" id="priorityFilter" aria-label="Filter by priority">
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>
            <select class="filter-select" id="statusFilter" aria-label="Filter by status">
              <option value="">All Status</option>
              <option value="dispatched">Dispatched</option>
              <option value="on-scene">On Scene</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <!-- ACTIVE RESPONSES TABLE -->
        <div class="table-card" id="tableView">
          <div class="table-wrap">
            <table class="responses-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Elapsed</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="tableBody"></tbody>
            </table>
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