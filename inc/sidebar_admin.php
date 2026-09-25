<?php
/**
 * RescueLine - Reusable Admin Sidebar Navigation Component
 * Provides navigation links with active state handling, badge counters, and admin profile.
 */

// Active page indicator (default: 'dashboard')
$current_page = isset($active_page) ? htmlspecialchars($active_page, ENT_QUOTES, 'UTF-8') : 'dashboard';

// Dynamic admin info with fallback defaults
$admin_name     = isset($_SESSION['admin_name']) ? htmlspecialchars($_SESSION['admin_name'], ENT_QUOTES, 'UTF-8') : (isset($admin_name) ? htmlspecialchars($admin_name, ENT_QUOTES, 'UTF-8') : 'Aisha Okonkwo');
$admin_role     = isset($_SESSION['admin_role']) ? htmlspecialchars($_SESSION['admin_role'], ENT_QUOTES, 'UTF-8') : (isset($admin_role) ? htmlspecialchars($admin_role, ENT_QUOTES, 'UTF-8') : 'System Administrator');
$admin_initials = isset($_SESSION['admin_initials']) ? htmlspecialchars($_SESSION['admin_initials'], ENT_QUOTES, 'UTF-8') : (isset($admin_initials) ? htmlspecialchars($admin_initials, ENT_QUOTES, 'UTF-8') : 'AO');
$assets_base    = isset($assets_path) ? rtrim(htmlspecialchars($assets_path, ENT_QUOTES, 'UTF-8'), '/') : '../assets';
?>
<!-- ============ ADMIN SIDEBAR ============ -->
<aside class="sidebar" id="sidebar">
  <div class="brand">
    <img src="<?= $assets_base ?>/images/rescueLine.png" alt="RescueLine Logo" class="brand-img" />
    <div class="brand-text">
      <h1>RESCUELINE</h1>
      <p>Emergency Response <span class="admin-badge">Admin</span></p>
    </div>
  </div>

  <nav>
    <div class="nav-section">
      <div class="nav-label">Main</div>
      <a href="index.php" class="nav-item <?= in_array($current_page, ['dashboard', 'index'], true) ? 'active' : '' ?>">
        <i data-lucide="layout-dashboard"></i>
        <span>Dashboard</span>
      </a>
      <a href="respondents.php" class="nav-item <?= in_array($current_page, ['respondents', 'respondent'], true) ? 'active' : '' ?>">
        <i data-lucide="users"></i>
        <span>Respondents</span>
      </a>
      <!--a href="report.php" class="nav-item <?= in_array($current_page, ['reports', 'report', 'report_list'], true) ? 'active' : '' ?>">
        <i data-lucide="file-text"></i>
        <span>Emergency Reports</span>
      </a-->
      <a href="categories.php" class="nav-item <?= ($current_page === 'categories') ? 'active' : '' ?>">
        <i data-lucide="grid-3x3"></i>
        <span>Categories</span>
      </a>
    </div>
  </nav>

  <div class="sidebar-footer">
    <div class="admin-profile">
      <div class="admin-avatar"><?= $admin_initials ?></div>
      <div class="admin-info">
        <div class="name"><?= $admin_name ?></div>
        <div class="role"><?= $admin_role ?></div>
      </div>
    </div>
    <a href="../auth/logout.php" class="nav-item">
      <i data-lucide="log-out"></i>
      <span>Logout</span>
    </a>
  </div>
</aside>
