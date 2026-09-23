<?php
/**
 * RescueLine - Emergency Incident Details
 * View full incident breakdown, responder actions, and progress timeline.
 */

$report_id = isset($_GET['id']) ? htmlspecialchars(trim($_GET['id']), ENT_QUOTES, 'UTF-8') : 'RL-0025';
if (empty($report_id)) {
    $report_id = 'RL-0025';
}

// Page Configuration
$page_title       = "RescueLine • Incident {$report_id}";
$page_description = "RescueLine - Real-time incident response details for {$report_id}";
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
          <h2>Incident Details: <?= $report_id ?></h2>
          <p>Monitor response progress, reporter info, and actions in real-time</p>
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
      <!-- Injected dynamically via report-details.js -->
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
<script>
  if (typeof window.displayReportDetails === 'function') {
    window.displayReportDetails(<?= json_encode($report_id) ?>);
  }
</script>

</body>
</html>