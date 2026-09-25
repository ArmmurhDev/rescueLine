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
    '../assets/css/respondant/incorming-report.css',
    '../assets/css/respondant/active-responses.css'
];

// Reusable Header & Sidebar
require_once __DIR__ . '/../inc/header.php';
require_once __DIR__ . '/../inc/sidebar_respondant.php';

$db = get_db();
$user_id = $_SESSION['user_id'] ?? null;
$user_name = $_SESSION['user_name'] ?? 'Musa Ibrahim';
$user_role = $_SESSION['user_role'] ?? 'Respondent';
$user_status = 'active';

// Fetch current user from database
if ($user_id) {
    $uStmt = $db->prepare("SELECT id, name, role, status FROM users WHERE id = ?");
    $uStmt->execute([$user_id]);
    $uRow = $uStmt->fetch();
    if ($uRow) {
        $user_name = $uRow['name'] ?: $user_name;
        $user_role = $uRow['role'] ?: $user_role;
        $user_status = $uRow['status'] ?: 'active';
    }
} else {
    $uStmt = $db->query("SELECT id, name, role, status FROM users WHERE role = 'respondent' LIMIT 1");
    $uRow = $uStmt->fetch();
    if ($uRow) {
        $user_name = $uRow['name'];
        $user_role = $uRow['role'];
        $user_status = $uRow['status'];
        $user_id = (int)$uRow['id'];
    }
}

// Compute initials
$name_parts = explode(' ', trim($user_name));
$user_initials = '';
if (count($name_parts) >= 2) {
    $user_initials = strtoupper(substr($name_parts[0], 0, 1) . substr($name_parts[1], 0, 1));
} else {
    $user_initials = strtoupper(substr($user_name, 0, 2));
}

// Get active count for this respondent
$activeStmt = $db->prepare("SELECT COUNT(*) FROM reports WHERE (assigned_respondent_id = ? OR ? IS NULL) AND status IN ('assigned', 'responding')");
$activeStmt->execute([$user_id, $user_id]);
$active_reports_count = (int)($activeStmt->fetchColumn() ?: 0);
$is_online = ($user_status === 'active');
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
          <div class="avatar" id="navAvatar"><?= htmlspecialchars($user_initials) ?></div>
          <div>
            <div class="name" id="navName"><?= htmlspecialchars($user_name) ?></div>
            <div class="role"><?= htmlspecialchars(ucfirst($user_role)) ?></div>
          </div>
        </div>
      </div>
    </header>

    <!-- CONTENT SECTION -->
    <section class="content">

      <!-- WELCOME BANNER -->
      <div class="welcome-card <?= !$is_online ? 'offline' : '' ?>" id="welcomeCard">
        <div class="welcome-left">
          <div class="welcome-avatar <?= !$is_online ? 'offline' : '' ?>" id="welcomeAvatar"><?= htmlspecialchars($user_initials) ?></div>
          <div class="welcome-info">
            <h3 id="welcomeName">Welcome back, <?= htmlspecialchars($user_name) ?> 👋</h3>
            <p>You have <strong style="color: var(--green);" id="activeCountMsg"><?= $active_reports_count ?> active emergency reports</strong> requiring attention.</p>
            <div class="status-line">
              <span class="status-indicator <?= !$is_online ? 'offline' : '' ?>" id="statusIndicator">
                <span class="status-dot <?= !$is_online ? 'offline' : '' ?>" id="statusDot"></span> 
                <span id="statusText">You are <?= $is_online ? 'ONLINE' : 'OFFLINE' ?></span>
              </span>
              <span id="statusLastActive">Last active: <?= $is_online ? 'Just now' : 'Offline' ?></span>
            </div>
          </div>
        </div>
        <button class="btn <?= $is_online ? 'btn-danger' : 'btn-success' ?>" id="offlineBtn">
          <i data-lucide="<?= $is_online ? 'wifi-off' : 'wifi' ?>" id="offlineBtnIcon"></i>
          <span id="offlineBtnText"><?= $is_online ? 'Go Offline' : 'Go Online' ?></span>
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
            <a href="incorming-report.php" class="card-link" onclick="if(window.displayIncomingReportsContent){window.displayIncomingReportsContent(); return false;}">View All <i data-lucide="arrow-right"></i></a>
          </div>

          <div class="table-wrap">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Emergency Type</th>
                  <th>Location</th>
                  <th>Priority</th>
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

      <!-- EMERGENCY TYPES CHART -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <div class="card-title">
            <span class="dot"></span>
            Emergency Types Distribution
          </div>
        </div>
        <div class="chart-wrap" style="position: relative; height: 300px; width: 100%;">
          <canvas id="emergencyChart" class="emergencyChart"></canvas>
        </div>
      </div>

    </section>
  </main>
</div>

<!-- Mobile Sidebar Overlay -->
<div class="overlay" id="overlay"></div>

<!-- Custom Page Scripts -->
<script src="../assets/js/respondant/incorming-report.js"></script>
<script src="../assets/js/respondant/active-responses.js"></script>
<script src="../assets/js/respondant/dashboard.js"></script>

</body>
</html>