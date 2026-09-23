<?php
/**
 * RescueLine - Emergency Response History
 * Archive of all resolved and closed emergency responses
 */

// Page Configuration
$page_title       = 'RescueLine • Response History';
$page_description = 'RescueLine - Archive of all resolved emergency responses';
$active_page      = 'response_history';
$extra_css        = [
    '../assets/css/respondant/dashboard.css',
    '../assets/css/respondant/incorming-report.css',
    '../assets/css/respondant/active-responses.css',
    '../assets/css/respondant/response-history.css',
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
          <h2>Response History</h2>
          <p>Archive of all resolved emergency responses</p>
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

    <!-- CONTENT SECTION (Display Area) -->
    <section class="content">
      <div class="page-container" id="responseHistoryContainer">

        <!-- PAGE HEADER -->
        <div class="page-header">
          <div class="page-header-left">
            <h1>
              <i data-lucide="history" style="width: 24px; height: 24px; color: var(--green);"></i>
              Response History
            </h1>
            <p>Archive of all resolved emergency responses</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-secondary" id="exportBtn" type="button">
              <i data-lucide="download"></i>
              Export
            </button>
            <button class="btn btn-primary" id="refreshBtn" type="button">
              <i data-lucide="refresh-cw"></i>
              Refresh
            </button>
          </div>
        </div>

        <!-- STATS ROW -->
        <div class="stats-row">
          <div class="stat-mini green">
            <div class="stat-mini-icon green"><i data-lucide="check-circle-2"></i></div>
            <div class="stat-mini-info">
              <div class="value">247</div>
              <div class="label">Total Resolved</div>
              <div class="trend up">↑ 18% this month</div>
            </div>
          </div>
          <div class="stat-mini blue">
            <div class="stat-mini-icon blue"><i data-lucide="clock"></i></div>
            <div class="stat-mini-info">
              <div class="value">24m</div>
              <div class="label">Avg Resolution Time</div>
              <div class="trend down">↓ 8% faster</div>
            </div>
          </div>
          <div class="stat-mini orange">
            <div class="stat-mini-icon orange"><i data-lucide="trending-up"></i></div>
            <div class="stat-mini-info">
              <div class="value">94%</div>
              <div class="label">Resolution Rate</div>
              <div class="trend up">↑ 3% improvement</div>
            </div>
          </div>
          <div class="stat-mini purple">
            <div class="stat-mini-icon purple"><i data-lucide="users"></i></div>
            <div class="stat-mini-info">
              <div class="value">12</div>
              <div class="label">Active Respondents</div>
              <div class="trend up">↑ 2 new this week</div>
            </div>
          </div>
        </div>

        <!-- FILTER CARD -->
        <div class="filter-card">
          <!-- Quick Filters -->
          <div class="quick-filters">
            <button class="quick-filter-btn active" data-range="all" type="button">All Time</button>
            <button class="quick-filter-btn" data-range="today" type="button">Today</button>
            <button class="quick-filter-btn" data-range="week" type="button">This Week</button>
            <button class="quick-filter-btn" data-range="month" type="button">This Month</button>
            <button class="quick-filter-btn" data-range="quarter" type="button">Last 3 Months</button>
          </div>
        </div>

        <!-- HISTORY TABLE -->
        <div class="history-card">
          <div class="table-wrap">
            <table class="history-table">
              <thead>
                <tr>
                  <th class="sorted" data-sort="id">Report ID <i data-lucide="arrow-down"></i></th>
                  <th data-sort="type">Type <i data-lucide="arrow-down"></i></th>
                  <th data-sort="location">Location <i data-lucide="arrow-down"></i></th>
                  <th data-sort="received">Received <i data-lucide="arrow-down"></i></th>
                  <th data-sort="resolved">Resolved <i data-lucide="arrow-down"></i></th>
                  <th data-sort="duration">Duration <i data-lucide="arrow-down"></i></th>
                  <th data-sort="priority">Priority <i data-lucide="arrow-down"></i></th>
                  <th data-sort="status">Status <i data-lucide="arrow-down"></i></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="historyBody"></tbody>
            </table>
          </div>

          <div class="history-cards" id="historyCards"></div>

          <!-- PAGINATION -->
          <div class="pagination-bar">
            <div class="pagination-info" id="paginationInfo">
              Showing <strong>1-10</strong> of <strong>247</strong> responses
            </div>
            <div class="pagination-controls">
              <button class="page-btn" disabled type="button">
                <i data-lucide="chevron-left"></i>
              </button>
              <button class="page-btn active" type="button">1</button>
              <button class="page-btn" type="button">2</button>
              <button class="page-btn" type="button">3</button>
              <button class="page-btn" type="button">...</button>
              <button class="page-btn" type="button">25</button>
              <button class="page-btn" type="button">
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
<script src="../assets/js/respondant/response-history.js"></script>
<script src="../assets/js/respondant/report-details.js"></script>
<script src="../assets/js/respondant/dashboard.js"></script>

</body>
</html>