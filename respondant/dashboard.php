<?php
/**
 * RescueLine - Respondent Dashboard
 * Emergency Incident Reporting & Response Management
 */

// Page Configuration
$page_title       = 'RescueLine • Respondent Dashboard';
$page_description = 'RescueLine - Emergency Incident Reporting & Response Dashboard';
$active_page      = 'dashboard';
$extra_css        = [
    '../assets/css/respondant/dashboard.css',
    '../assets/css/respondant/incorming-report.css'
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
          <h2>Dashboard</h2>
          <p>Emergency response overview</p>
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

      <!-- WELCOME BANNER -->
      <div class="welcome-card">
        <div class="welcome-left">
          <div class="welcome-avatar">AA</div>
          <div class="welcome-info">
            <h3>Welcome back, Abdulrauf 👋</h3>
            <p>You have <strong style="color: var(--green);">5 active emergency reports</strong> requiring attention.</p>
            <div class="status-line">
              <span class="status-indicator"><span class="status-dot"></span> You are ONLINE</span>
              <span>Last active: Just now</span>
            </div>
          </div>
        </div>
        <button class="btn btn-danger" id="offlineBtn">
          <i data-lucide="wifi-off"></i>
          Go Offline
        </button>
      </div>

      <!-- KEY METRICS / STATS GRID -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon green"><i data-lucide="inbox"></i></div>
            <span class="stat-trend">+4 today</span>
          </div>
          <div class="stat-value">12</div>
          <div class="stat-label">New Reports</div>
          <div class="stat-sub">4 received today</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon green"><i data-lucide="activity"></i></div>
            <span class="stat-trend red">2 urgent</span>
          </div>
          <div class="stat-value">5</div>
          <div class="stat-label">Active Responses</div>
          <div class="stat-sub">Currently being handled</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon green"><i data-lucide="check-circle-2"></i></div>
            <span class="stat-trend">+12%</span>
          </div>
          <div class="stat-value">18</div>
          <div class="stat-label">Resolved Today</div>
          <div class="stat-sub">12% increase</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon red"><i data-lucide="alert-octagon"></i></div>
            <span class="stat-trend red">Urgent</span>
          </div>
          <div class="stat-value" style="color: var(--red);">3</div>
          <div class="stat-label">Critical</div>
          <div class="stat-sub">Needs action</div>
        </div>
      </div>

      <!-- REPORTS + ACTIVITY SECTION -->
      <div class="grid-2">
        <!-- REPORTS TABLE & CARDS -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="dot"></span>
              Incoming Emergency Reports
            </div>
            <a href="reports.php" class="card-link">View All <i data-lucide="arrow-right"></i></a>
          </div>

          <div class="filter-bar">
            <div class="search-box">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" placeholder="Search reports..." id="searchInput" autocomplete="off" />
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
            </select>
          </div>

          <div class="table-wrap">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Emergency Type</th>
                  <th>Location</th>
                  <th>Time</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="reportsBody"></tbody>
            </table>
          </div>

          <div class="report-cards" id="reportCards"></div>
        </div>

        <!-- ACTIVITY TIMELINE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="dot"></span>
              Response Activity
            </div>
          </div>
          <div class="timeline" id="timeline"></div>
        </div>
      </div>

      <!-- CHARTS & LOCATION BREAKDOWN -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="dot"></span>
              Emergency Types
            </div>
            <select class="filter-select" style="min-width: 100px;">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div class="chart-wrap">
            <canvas id="emergencyChart" class="emergencyChart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="dot"></span>
              Reports by Location
            </div>
          </div>
          <div class="location-list" id="locationList"></div>
        </div>
      </div>

    </section>
  </main>
</div>

<!-- Mobile Sidebar Overlay -->
<div class="overlay" id="overlay"></div>

<!-- Custom Page Scripts -->
<script src="../assets/js/respondant/incorming-report.js"></script>
<script src="../assets/js/respondant/dashboard.js"></script>

</body>
</html>