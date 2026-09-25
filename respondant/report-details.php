<?php
/**
 * RescueLine - Emergency Incident Details
 * View full incident breakdown, responder actions, and progress timeline.
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';

$db = get_db();

// 1. Resolve Report Param from URL (supports integer ID or report code string)
$report_param = isset($_GET['id']) ? sanitize_string($_GET['id']) : (isset($_GET['code']) ? sanitize_string($_GET['code']) : '');
$mode = isset($_GET['mode']) ? sanitize_string($_GET['mode']) : '';

$report = null;
if (!empty($report_param)) {
    if (is_numeric($report_param)) {
        $stmt = $db->prepare("
            SELECT r.*, u.name AS respondent_name, u.phone AS respondent_phone, u.unit AS respondent_unit,
                   c.color AS category_color, c.icon AS category_icon
            FROM reports r
            LEFT JOIN users u ON r.assigned_respondent_id = u.id
            LEFT JOIN categories c ON r.category_id = c.id
            WHERE r.id = ?
        ");
        $stmt->execute([(int)$report_param]);
        $report = $stmt->fetch();
    }

    if (!$report) {
        $stmt = $db->prepare("
            SELECT r.*, u.name AS respondent_name, u.phone AS respondent_phone, u.unit AS respondent_unit,
                   c.color AS category_color, c.icon AS category_icon
            FROM reports r
            LEFT JOIN users u ON r.assigned_respondent_id = u.id
            LEFT JOIN categories c ON r.category_id = c.id
            WHERE r.report_code = ?
        ");
        $stmt->execute([$report_param]);
        $report = $stmt->fetch();
    }
}

// Fallback to most recent report if param not found or empty
if (!$report) {
    $stmt = $db->query("
        SELECT r.*, u.name AS respondent_name, u.phone AS respondent_phone, u.unit AS respondent_unit,
               c.color AS category_color, c.icon AS category_icon
        FROM reports r
        LEFT JOIN users u ON r.assigned_respondent_id = u.id
        LEFT JOIN categories c ON r.category_id = c.id
        ORDER BY r.id DESC LIMIT 1
    ");
    $report = $stmt->fetch();
}

// Fallback mock structure if table is completely empty
if (!$report) {
    $report = [
        'id' => 1,
        'report_code' => 'RL-0001',
        'category_id' => 1,
        'category_name' => 'Fire Outbreak',
        'source' => 'ussd',
        'reporter_name' => 'Citizen Reporter',
        'reporter_phone' => '08031234567',
        'state' => 'Kaduna',
        'lga' => 'Kaduna South',
        'address_landmark' => 'Kaduna South Market Area',
        'latitude' => null,
        'longitude' => null,
        'priority' => 'critical',
        'status' => 'pending',
        'description' => 'Emergency incident reported and logged into system.',
        'casualty_count' => 0,
        'injured_count' => 0,
        'assigned_respondent_id' => null,
        'assigned_at' => null,
        'responding_at' => null,
        'resolved_at' => null,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
        'respondent_name' => null,
        'respondent_phone' => null,
        'respondent_unit' => null
    ];
}

$report_id_code = $report['report_code'] ?? ('RL-' . $report['id']);
$report_db_id   = (int)$report['id'];

// 2. Fetch Timeline History from DB
$timelineStmt = $db->prepare("
    SELECT t.*, u.name AS user_name
    FROM report_timeline t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.report_id = ?
    ORDER BY t.created_at ASC
");
$timelineStmt->execute([$report_db_id]);
$timeline = $timelineStmt->fetchAll();

// 3. Status Step Calculation
$status = strtolower($report['status'] ?? 'pending');
$currentStep = 0;
if ($status === 'assigned') {
    $currentStep = 1;
} elseif ($status === 'responding' || $status === 'in-progress' || $status === 'on-scene') {
    $currentStep = 2;
} elseif ($status === 'resolved' || $status === 'closed') {
    $currentStep = 3;
}

// 4. Elapsed Time Calculation
$created_time = !empty($report['created_at']) ? strtotime($report['created_at']) : time();
$resolved_time = !empty($report['resolved_at']) ? strtotime($report['resolved_at']) : null;
$elapsed_seconds = $resolved_time ? max(0, $resolved_time - $created_time) : max(0, time() - $created_time);

function format_elapsed(int $seconds): string {
    $hrs  = floor($seconds / 3600);
    $mins = floor(($seconds % 3600) / 60);
    $secs = $seconds % 60;
    return sprintf('%02d:%02d:%02d', $hrs, $mins, $secs);
}

// 5. Category Helpers
$category_name = $report['category_name'] ?? 'Emergency';
$category_type = strtolower($category_name);
$type_icon = 'alert-circle';
if (stripos($category_name, 'fire') !== false) {
    $type_icon = 'flame';
    $type_class = 'fire';
} elseif (stripos($category_name, 'accident') !== false) {
    $type_icon = 'car';
    $type_class = 'accident';
} elseif (stripos($category_name, 'medical') !== false) {
    $type_icon = 'heart-pulse';
    $type_class = 'medical';
} elseif (stripos($category_name, 'flood') !== false) {
    $type_icon = 'waves';
    $type_class = 'flood';
} elseif (stripos($category_name, 'security') !== false) {
    $type_icon = 'shield-alert';
    $type_class = 'security';
} else {
    $type_class = 'other';
}

$priority = strtolower($report['priority'] ?? 'medium');
$isUrgent = ($priority === 'critical' || $elapsed_seconds > 1800);

// Masked phone for display
$raw_phone = $report['reporter_phone'] ?? '08000000000';
$masked_phone = strlen($raw_phone) > 7 ? substr($raw_phone, 0, 4) . '***' . substr($raw_phone, -4) : $raw_phone;

// Page Configuration
$page_title       = "RescueLine • Incident {$report_id_code}";
$page_description = "RescueLine - Real-time incident response details for {$report_id_code}";
$active_page      = ($mode === 'history') ? 'response_history' : 'active_responses';
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
          <h2>Incident Details: <?= e($report_id_code) ?></h2>
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
            </div>
            <div class="notif-footer">
              <a href="notifications.php">View all notifications →</a>
            </div>
          </div>
        </div>

        <div class="profile-chip">
          <div class="avatar"><?= strtoupper(substr($_SESSION['user_name'] ?? 'Respondent', 0, 2)) ?></div>
          <div>
            <div class="name"><?= e($_SESSION['user_name'] ?? 'Respondent') ?></div>
            <div class="role"><?= ucfirst($_SESSION['user_role'] ?? 'Respondent') ?></div>
          </div>
        </div>
      </div>
    </header>

    <!-- CONTENT SECTION (Display Area) -->
    <section class="content">
      <div class="rd-container" id="reportDetailsContainer" data-report-id="<?= $report_db_id ?>" data-report-code="<?= e($report_id_code) ?>">

        <!-- ACTION BAR -->
        <div class="rd-action-bar">
          <button type="button" class="rd-back-btn" id="rdBackBtn">
            <i data-lucide="arrow-left"></i>
            <span><?= ($mode === 'history') ? 'Back to History' : 'Back to Responses' ?></span>
          </button>

          <div class="rd-action-buttons">
            <button type="button" id="btnDispatch" class="rd-btn rd-btn-dispatch" <?= ($currentStep >= 1) ? 'disabled' : '' ?>>
              <i data-lucide="truck"></i>
              <span>Dispatch</span>
            </button>
            <button type="button" id="btnOnScene" class="rd-btn rd-btn-onscene" <?= ($currentStep >= 2) ? 'disabled' : '' ?>>
              <i data-lucide="map-pin"></i>
              <span>On Scene</span>
            </button>
            <button type="button" id="btnResolve" class="rd-btn rd-btn-resolve" <?= ($currentStep >= 3) ? 'disabled' : '' ?>>
              <i data-lucide="check-circle-2"></i>
              <span>Resolve</span>
            </button>
            <button type="button" id="btnEscalate" class="rd-btn rd-btn-escalate" <?= ($currentStep >= 3) ? 'disabled' : '' ?>>
              <i data-lucide="alert-triangle"></i>
              <span>Escalate</span>
            </button>
          </div>
        </div>

        <!-- INCIDENT HEADER BANNER -->
        <div class="rd-header-card">
          <div class="rd-header-main">
            <div class="rd-id-row">
              <span class="rd-id"><?= e($report_id_code) ?></span>
              <span class="rd-priority-badge <?= e($priority) ?>"><?= ucfirst(e($priority)) ?></span>
            </div>
            <div class="rd-type-badge <?= e($type_class) ?>">
              <i data-lucide="<?= e($type_icon) ?>"></i>
              <span><?= e($category_name) ?></span>
            </div>
          </div>

          <div class="rd-timer-box">
            <div class="rd-timer-label"><?= ($currentStep >= 3) ? 'Total Response Duration' : 'Elapsed Time' ?></div>
            <div id="rdTimer" class="rd-timer-val <?= $isUrgent ? 'urgent' : '' ?>" data-seconds="<?= (int)$elapsed_seconds ?>" data-status="<?= e($status) ?>">
              <?= format_elapsed((int)$elapsed_seconds) ?>
            </div>
          </div>
        </div>

        <!-- TWO-COLUMN CONTENT GRID -->
        <div class="rd-grid">

          <!-- Left Column (Progress & Location) -->
          <div class="rd-col">

            <!-- Response Progress Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="activity"></i>
                  <span>Response Progress</span>
                </div>
              </div>
              <div class="rd-timeline">
                <?php
                $stepDefs = [
                    ['name' => 'Accepted', 'icon' => 'check', 'desc' => 'Report logged and acknowledged', 'time' => !empty($report['created_at']) ? date('h:i A', strtotime($report['created_at'])) : '—'],
                    ['name' => 'Dispatched', 'icon' => 'truck', 'desc' => 'Emergency response unit assigned', 'time' => !empty($report['assigned_at']) ? date('h:i A', strtotime($report['assigned_at'])) : ($currentStep >= 1 ? 'Dispatched' : 'Pending')],
                    ['name' => 'On Scene', 'icon' => 'map-pin', 'desc' => 'Response team arrived at location', 'time' => !empty($report['responding_at']) ? date('h:i A', strtotime($report['responding_at'])) : ($currentStep >= 2 ? 'In Progress' : 'Pending')],
                    ['name' => 'Resolved', 'icon' => 'flag', 'desc' => 'Emergency situation contained and resolved', 'time' => !empty($report['resolved_at']) ? date('h:i A', strtotime($report['resolved_at'])) : ($currentStep >= 3 ? 'Completed' : 'Pending')]
                ];

                foreach ($stepDefs as $idx => $s):
                    $stateClass = 'pending';
                    $iconName = $s['icon'];
                    if ($idx < $currentStep) {
                        $stateClass = 'completed';
                        $iconName = 'check';
                    } elseif ($idx === $currentStep) {
                        $stateClass = 'current';
                    }
                ?>
                  <div class="rd-step <?= $stateClass ?>">
                    <div class="rd-step-indicator">
                      <i data-lucide="<?= $iconName ?>"></i>
                    </div>
                    <div class="rd-step-content">
                      <div class="rd-step-top">
                        <span class="rd-step-name"><?= $s['name'] ?></span>
                        <span class="rd-step-time"><?= $s['time'] ?></span>
                      </div>
                      <p class="rd-step-desc"><?= $s['desc'] ?></p>
                    </div>
                  </div>
                <?php endforeach; ?>
              </div>
            </div>

            <!-- Incident Location Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="map-pin"></i>
                  <span>Incident Location</span>
                </div>
              </div>
              <div class="rd-location-body">
                <div class="rd-loc-item">
                  <div class="rd-loc-label">Address / Landmark</div>
                  <div class="rd-loc-val"><?= e($report['address_landmark'] ?? 'Location details not specified') ?></div>
                </div>
                <div class="rd-loc-item">
                  <div class="rd-loc-label">State & LGA</div>
                  <div class="rd-loc-val" style="font-weight: 500; font-size: 13px; color: var(--text-soft);"><?= e($report['lga'] ?? '') ?><?= !empty($report['lga']) && !empty($report['state']) ? ', ' : '' ?><?= e($report['state'] ?? '') ?></div>
                </div>
                <button type="button" class="rd-btn-maps" onclick="window.open('https://maps.google.com/?q=<?= urlencode(($report['address_landmark'] ?? '') . ', ' . ($report['lga'] ?? '') . ', ' . ($report['state'] ?? '')) ?>', '_blank')">
                  <i data-lucide="navigation"></i>
                  <span>Open in Maps</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Right Column (Reporter, Details, Notes) -->
          <div class="rd-col">

            <!-- Reporter Contact Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="phone"></i>
                  <span>Reporter Contact</span>
                </div>
              </div>
              <div class="rd-contact-box">
                <div class="rd-phone-row">
                  <a href="tel:<?= e($raw_phone) ?>" class="rd-phone-num"><?= e($masked_phone) ?></a>
                  <button type="button" class="rd-copy-btn" id="rdCopyPhone" data-phone="<?= e($raw_phone) ?>" title="Copy phone number">
                    <i data-lucide="copy"></i>
                  </button>
                </div>
                <div class="rd-contact-actions">
                  <a href="tel:<?= e($raw_phone) ?>" class="rd-contact-btn call">
                    <i data-lucide="phone-call"></i>
                    <span>Call</span>
                  </a>
                  <a href="sms:<?= e($raw_phone) ?>" class="rd-contact-btn sms">
                    <i data-lucide="message-square"></i>
                    <span>SMS</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Incident Details Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="info"></i>
                  <span>Incident Details</span>
                </div>
              </div>
              <div class="rd-detail-list">
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Reported At</span>
                  <span class="rd-detail-val"><?= !empty($report['created_at']) ? date('d M Y, h:i A', strtotime($report['created_at'])) : '—' ?></span>
                </div>
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Reported Via</span>
                  <span class="rd-detail-val"><?= strtoupper(e($report['source'] ?? 'ussd')) ?> Gateway</span>
                </div>
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Assigned Responder</span>
                  <div class="rd-assigned-chip">
                    <div class="rd-assigned-avatar"><?= strtoupper(substr($report['respondent_name'] ?? 'RT', 0, 2)) ?></div>
                    <div class="rd-assigned-info">
                      <span class="rd-assigned-name"><?= e($report['respondent_name'] ?? 'Responder Team') ?></span>
                      <span class="rd-assigned-role"><?= e($report['respondent_unit'] ?? 'Emergency Unit') ?></span>
                    </div>
                  </div>
                </div>
                <div class="rd-detail-item" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                  <span class="rd-detail-label">Description / Situation</span>
                  <p style="font-size: 13px; color: var(--text-main); margin: 0; line-height: 1.5;"><?= e($report['description'] ?? 'No additional description provided.') ?></p>
                </div>
              </div>
            </div>

            <!-- Incident Notes Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="file-text"></i>
                  <span>Incident Timeline & Notes</span>
                </div>
              </div>
              <div class="rd-notes-list" id="rdNotesList">
                <?php if (empty($timeline)): ?>
                  <div class="rd-note-item">
                    <p>Report initiated and waiting for responder actions.</p>
                    <div class="rd-note-meta">- System, <?= date('h:i A') ?></div>
                  </div>
                <?php else: ?>
                  <?php foreach ($timeline as $t): ?>
                    <div class="rd-note-item">
                      <p><strong><?= e($t['action']) ?>:</strong> <?= e($t['note'] ?? 'No notes attached.') ?></p>
                      <div class="rd-note-meta">- <?= e($t['user_name'] ?? 'System') ?>, <?= !empty($t['created_at']) ? date('d M, h:i A', strtotime($t['created_at'])) : 'Recently' ?></div>
                    </div>
                  <?php endforeach; ?>
                <?php endif; ?>
              </div>
              <button type="button" class="rd-add-note-btn" id="rdAddNoteBtn">
                <i data-lucide="plus"></i>
                <span>Add Note</span>
              </button>
            </div>

          </div>

        </div>

        <!-- Toast Notification Popup -->
        <div class="rd-toast" id="rdToast">
          <i data-lucide="check-circle-2"></i>
          <span id="rdToastMsg">Action completed successfully</span>
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

<script>
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.initReportDetails === 'function') {
      window.initReportDetails(<?= json_encode($report_db_id) ?>);
    }
  });
</script>

</body>
</html>