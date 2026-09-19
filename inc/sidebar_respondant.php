<?php
/**
 * RescueLine - Reusable Respondent Sidebar Navigation
 * Provides navigation links with active state handling and responsive layout hooks.
 */

// Active page indicator (default: 'dashboard')
$current_page = isset($active_page) ? htmlspecialchars($active_page, ENT_QUOTES, 'UTF-8') : 'dashboard';
// Assets base path resolution
$assets_base = isset($assets_path) ? $assets_path : '../assets';
?>
<!-- ============ RESPONDENT SIDEBAR ============ -->
<aside class="sidebar" id="sidebar">
  <div class="brand">
    <div class="brand-logo">
      <img src="<?= htmlspecialchars($assets_base, ENT_QUOTES, 'UTF-8') ?>/images/rescueLine.png" alt="RescueLine Logo" />
    </div>
    <div class="brand-text">
      <h1>RESCUELINE</h1>
      <p>Emergency Response</p>
    </div>
  </div>

  <nav>
    <div class="nav-section">
      <div class="nav-label">Main</div>
      
      <a href="dashboard.php" class="nav-item <?= ($current_page === 'dashboard') ? 'active' : '' ?>" data-ajax="true" data-page="dashboard">
        <i data-lucide="layout-dashboard"></i>
        <span>Dashboard</span>
      </a>

      <div>
        <a href="reports.php" class="nav-item <?= in_array($current_page, ['reports', 'incoming_reports', 'incorming-report', 'active_responses', 'response_history'], true) ? 'active' : '' ?>">
          <i data-lucide="alert-triangle"></i>
          <span>Emergency Reports</span>
        </a>
        <div class="nav-sub">
          <a href="incorming-report.php" class="nav-item <?= in_array($current_page, ['incoming_reports', 'incorming-report'], true) ? 'active' : '' ?>" data-ajax="true" data-page="incoming_reports">
            <span>Incoming Reports</span>
          </a>
          <a href="active-responses.php" class="nav-item <?= ($current_page === 'active_responses') ? 'active' : '' ?>">
            <span>Active Responses</span>
          </a>
          <a href="response-history.php" class="nav-item <?= ($current_page === 'response_history') ? 'active' : '' ?>">
            <span>Response History</span>
          </a>
        </div>
      </div>

      <a href="notifications.php" class="nav-item <?= ($current_page === 'notifications') ? 'active' : '' ?>">
        <i data-lucide="bell"></i>
        <span>Notifications</span>
      </a>

      <a href="profile.php" class="nav-item <?= ($current_page === 'profile') ? 'active' : '' ?>">
        <i data-lucide="user"></i>
        <span>Profile</span>
      </a>

      <a href="settings.php" class="nav-item <?= ($current_page === 'settings') ? 'active' : '' ?>">
        <i data-lucide="settings"></i>
        <span>Settings</span>
      </a>
    </div>
  </nav>

  <div class="sidebar-footer">
    <a href="../auth/logout.php" class="nav-item">
      <i data-lucide="log-out"></i>
      <span>Logout</span>
    </a>
  </div>
</aside>
