<?php
/**
 * RescueLine - Emergency Notifications
 * Manage emergency notifications and alerts
 */

// Page Configuration
$page_title       = 'RescueLine • Notifications';
$page_description = 'RescueLine - Manage emergency notifications and alerts';
$active_page      = 'notifications';
$extra_css        = [
    '../assets/css/respondant/dashboard.css',
    '../assets/css/respondant/incorming-report.css',
    '../assets/css/respondant/active-responses.css',
    '../assets/css/respondant/response-history.css',
    '../assets/css/respondant/notifications.css',
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
          <h2>Notifications</h2>
          <p>Manage emergency notifications and alerts</p>
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

    <!-- CONTENT WRAPPER -->
    <section class="content">
      <div class="notifications-container" id="notificationsContainer">

        <!-- PAGE HEADER -->
        <div class="page-header">
          <div class="page-header-left">
            <h1>
              <i data-lucide="bell" style="width: 24px; height: 24px; color: var(--green);"></i>
              Notifications
            </h1>
            <p>Manage emergency notifications and alerts</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-secondary" id="markAllReadBtn" type="button">
              <i data-lucide="check-check"></i>
              Mark All Read
            </button>
            <button class="btn btn-primary" id="refreshNotifsBtn" type="button">
              <i data-lucide="refresh-cw"></i>
              Refresh
            </button>
          </div>
        </div>

        <!-- NOTIFICATIONS CARD -->
        <div class="notifications-card">
          <div class="notifications-card-header">
            <div class="notifications-card-title">
              <i data-lucide="inbox"></i>
              Recent Emergency Notifications
            </div>
            <div class="notifications-card-actions">
              <span class="unread-badge" id="unreadBadge">0 unread</span>
            </div>
          </div>

          <div class="notifications-card-body">
            <!-- Filter Pills -->
            <div class="notif-filter-bar">
              <button class="notif-filter-btn active" data-filter="all" type="button">All Alerts</button>
              <button class="notif-filter-btn" data-filter="unread" type="button">Unread Only</button>
              <button class="notif-filter-btn" data-filter="critical" type="button">Critical</button>
              <button class="notif-filter-btn" data-filter="high" type="button">High Priority</button>
              <button class="notif-filter-btn" data-filter="normal" type="button">Normal</button>
            </div>

            <!-- Notification List -->
            <div class="notification-list" id="notificationList"></div>
          </div>
        </div>

      </div>

      <!-- Toast Notification -->
      <div class="toast" id="toast">
        <i data-lucide="check-circle"></i>
        <span id="toastMessage">Action completed successfully</span>
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
<script src="../assets/js/respondant/notifications.js"></script>
<script src="../assets/js/respondant/report-details.js"></script>
<script src="../assets/js/respondant/dashboard.js"></script>

</body>
</html>