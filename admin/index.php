<?php
/**
 * RescueLine - Admin Dashboard
 * Emergency Incident Reporting & Response Management
 */

// Page Configuration
$page_title       = 'RescueLine • Admin Dashboard';
$page_description = 'RescueLine - Emergency Incident Reporting & Response Admin Dashboard';
$active_page      = 'dashboard';
$extra_css        = [
    '../assets/css/admin/index.css'
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
          <h2>Dashboard</h2>
          <p>Overview of emergency reports and response activities</p>
        </div>
      </div>

      <div class="topnav-right">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" placeholder="Search reports, states, respondents..." />
        </div>

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

      <!-- STATS CARDS -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-header">
            <div class="stat-icon blue"><i data-lucide="file-text"></i></div>
            <span class="stat-trend up"><i data-lucide="trending-up"></i> 18%</span>
          </div>
          <div class="stat-value">1,247</div>
          <div class="stat-label">Total Reports</div>
          <div class="stat-sub">+42 this week</div>
        </div>

        <div class="stat-card pending">
          <div class="stat-header">
            <div class="stat-icon orange"><i data-lucide="clock"></i></div>
            <span class="stat-trend down"><i data-lucide="trending-down"></i> 5%</span>
          </div>
          <div class="stat-value">86</div>
          <div class="stat-label">Pending</div>
          <div class="stat-sub">Awaiting assignment</div>
        </div>

        <div class="stat-card responding">
          <div class="stat-header">
            <div class="stat-icon cyan"><i data-lucide="activity"></i></div>
            <span class="stat-trend up"><i data-lucide="trending-up"></i> 12%</span>
          </div>
          <div class="stat-value">34</div>
          <div class="stat-label">Responding</div>
          <div class="stat-sub">Currently being handled</div>
        </div>

        <div class="stat-card resolved">
          <div class="stat-header">
            <div class="stat-icon green"><i data-lucide="check-circle-2"></i></div>
            <span class="stat-trend up"><i data-lucide="trending-up"></i> 24%</span>
          </div>
          <div class="stat-value">1,127</div>
          <div class="stat-label">Resolved</div>
          <div class="stat-sub">90.4% resolution rate</div>
        </div>
      </div>

      <!-- REPORTS BY STATE + REPORTS BY TYPE -->
      <div class="grid-2">

        <!-- REPORTS BY STATE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="dot"></span>
              Reports by State
            </div>
            <select class="filter-select">
              <option>All Time</option>
              <option>This Month</option>
              <option>This Week</option>
              <option>Today</option>
            </select>
          </div>
          <div class="table-wrap">
            <table class="state-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Total</th>
                  <th>Pending</th>
                  <th>Responding</th>
                  <th>Resolved</th>
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody id="stateBody"></tbody>
            </table>
          </div>
        </div>

        <!-- REPORTS BY TYPE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="dot"></span>
              Reports by Type
            </div>
            <select class="filter-select">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div class="chart-wrap donut">
            <canvas id="typeChart"></canvas>
          </div>
          <div class="type-legend" id="typeLegend"></div>
        </div>

      </div>

      <!-- RESPONSE TIME TREND -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span class="dot"></span>
            Response Time Trend
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <select class="filter-select" id="trendRange">
              <option value="7">Last 7 Days</option>
              <option value="30" selected>Last 30 Days</option>
              <option value="90">Last 3 Months</option>
            </select>
          </div>
        </div>
        <div class="chart-wrap line">
          <canvas id="trendChart"></canvas>
        </div>
      </div>

    </section>
  </main>
</div>

<!-- Mobile Sidebar Overlay -->
<div class="overlay" id="overlay"></div>

<!-- Custom Admin Page Scripts -->
<script src="../assets/js/admin/index.js"></script>

</body>
</html>