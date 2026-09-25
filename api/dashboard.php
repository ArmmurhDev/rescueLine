<?php
/**
 * RescueLine - Dashboard API Endpoint
 * Provides real-time metrics, charts data, state breakdowns, and notifications from the database.
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = get_db();
    $action = sanitize_string($_GET['action'] ?? 'admin_stats');

    if ($action === 'admin_stats') {
        // 1. Total counts by status
        $statusCounts = $db->query("
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status IN ('assigned', 'responding') THEN 1 ELSE 0 END) AS responding,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
            FROM reports
        ")->fetch();

        // 2. State-by-State breakdown with real counts
        $stateStats = $db->query("
            SELECT 
                s.name AS state,
                s.code,
                COUNT(r.id) AS total,
                SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN r.status IN ('assigned', 'responding') THEN 1 ELSE 0 END) AS responding,
                SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END) AS resolved
            FROM states s
            LEFT JOIN reports r ON (r.state = s.name OR r.state = s.code)
            WHERE s.status = 'active'
            GROUP BY s.id, s.name, s.code
            ORDER BY total DESC, s.name ASC
        ")->fetchAll();

        // 3. Reports by Type (Categories) with real counts
        $typeStats = $db->query("
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.color,
                c.icon,
                c.icon_class,
                COUNT(r.id) AS count
            FROM categories c
            LEFT JOIN reports r ON (r.category_id = c.id OR r.category_name = c.name)
            WHERE c.status = 'active'
            GROUP BY c.id, c.name, c.slug, c.color, c.icon, c.icon_class
            ORDER BY count DESC, c.display_order ASC
        ")->fetchAll();

        // 4. Response Time / Volume Trends (Last 7, 30, or 90 days)
        $days = sanitize_int($_GET['days'] ?? 30, 7, 90, 30);
        $trendRows = $db->query("
            SELECT 
                DATE(created_at) AS report_date,
                COUNT(*) AS count,
                AVG(COALESCE(response_time_minutes, 25)) AS avg_response_time
            FROM reports
            WHERE created_at >= NOW() - INTERVAL {$days} DAY
            GROUP BY DATE(created_at)
            ORDER BY report_date ASC
        ")->fetchAll();

        // 5. Recent Notifications
        $notifications = $db->query("
            SELECT id, title, message, type, icon, is_read, created_at
            FROM notifications
            ORDER BY created_at DESC
            LIMIT 6
        ")->fetchAll();

        json_success('Dashboard data retrieved successfully.', [
            'counts' => [
                'total'      => (int)($statusCounts['total'] ?? 0),
                'pending'    => (int)($statusCounts['pending'] ?? 0),
                'responding' => (int)($statusCounts['responding'] ?? 0),
                'resolved'   => (int)($statusCounts['resolved'] ?? 0)
            ],
            'states'        => $stateStats,
            'types'         => $typeStats,
            'trends'        => $trendRows,
            'notifications' => $notifications
        ]);
    }

    if ($action === 'respondent_stats') {
        $user_id = $_SESSION['user_id'] ?? null;
        $user_state = $_SESSION['user_state'] ?? 'Kaduna';
        $user_name = $_SESSION['user_name'] ?? 'Musa Ibrahim';
        $user_role = $_SESSION['user_role'] ?? 'Respondent';
        $user_status = 'active';

        if ($user_id) {
            $uStmt = $db->prepare("SELECT id, name, role, status, state FROM users WHERE id = ?");
            $uStmt->execute([$user_id]);
            $u = $uStmt->fetch();
            if ($u) {
                $user_name = $u['name'] ?: $user_name;
                $user_role = $u['role'] ?: $user_role;
                $user_status = $u['status'] ?: 'active';
                if (!empty($u['state'])) $user_state = $u['state'];
            }
        } else {
            $uStmt = $db->query("SELECT id, name, role, status, state FROM users WHERE role = 'respondent' LIMIT 1");
            $u = $uStmt->fetch();
            if ($u) {
                $user_id = (int)$u['id'];
                $user_name = $u['name'];
                $user_role = $u['role'];
                $user_status = $u['status'];
                if (!empty($u['state'])) $user_state = $u['state'];
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

        // Summary for respondent dashboard
        $respCounts = $db->prepare("
            SELECT 
                (SELECT COUNT(*) FROM reports WHERE status = 'pending' AND (state = ? OR ? = '')) AS incoming_count,
                (SELECT COUNT(*) FROM reports WHERE (assigned_respondent_id = ? OR ? IS NULL) AND status IN ('assigned', 'responding')) AS active_count,
                (SELECT COUNT(*) FROM reports WHERE assigned_respondent_id = ? AND status = 'resolved' AND DATE(resolved_at) = CURRENT_DATE) AS resolved_today,
                (SELECT COUNT(*) FROM reports WHERE priority = 'critical' AND status != 'resolved' AND (state = ? OR ? = '')) AS critical_count
        ");
        $respCounts->execute([$user_state, $user_state, $user_id, $user_id, $user_id, $user_state, $user_state]);
        $counts = $respCounts->fetch();

        // Active incidents for this respondent
        $activeIncidents = $db->prepare("
            SELECT r.*, c.color AS category_color, c.icon AS category_icon
            FROM reports r
            LEFT JOIN categories c ON r.category_id = c.id
            WHERE (r.assigned_respondent_id = ? OR (? IS NULL AND r.status IN ('assigned', 'responding')))
              AND r.status IN ('assigned', 'responding')
            ORDER BY r.created_at DESC
        ");
        $activeIncidents->execute([$user_id, $user_id]);

        // Incoming unassigned reports
        $incoming = $db->prepare("
            SELECT r.*, c.color AS category_color, c.icon AS category_icon
            FROM reports r
            LEFT JOIN categories c ON r.category_id = c.id
            WHERE r.status = 'pending' AND (r.state = ? OR ? = '')
            ORDER BY (r.priority = 'critical') DESC, r.created_at DESC
            LIMIT 10
        ");
        $incoming->execute([$user_state, $user_state]);

        // Category types for the chart
        $typeStats = $db->query("
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.color,
                COUNT(r.id) AS count
            FROM categories c
            LEFT JOIN reports r ON (r.category_id = c.id OR r.category_name = c.name)
            WHERE c.status = 'active'
            GROUP BY c.id, c.name, c.slug, c.color
            ORDER BY count DESC, c.display_order ASC
        ")->fetchAll();

        json_success('Respondent metrics loaded.', [
            'user' => [
                'id'       => (int)$user_id,
                'name'     => $user_name,
                'initials' => $user_initials,
                'role'     => $user_role,
                'status'   => $user_status,
                'is_online'=> ($user_status === 'active')
            ],
            'counts' => [
                'incoming'       => (int)($counts['incoming_count'] ?? 0),
                'active'         => (int)($counts['active_count'] ?? 0),
                'resolved_today' => (int)($counts['resolved_today'] ?? 0),
                'critical'       => (int)($counts['critical_count'] ?? 0)
            ],
            'active_incidents' => $activeIncidents->fetchAll(),
            'incoming_reports' => $incoming->fetchAll(),
            'types'            => $typeStats
        ]);
    }

    if ($action === 'toggle_online_status') {
        $user_id = $_SESSION['user_id'] ?? null;
        if (!$user_id) {
            $req_id = sanitize_int($_POST['user_id'] ?? 0, 1);
            if ($req_id > 0) {
                $user_id = $req_id;
            } else {
                $uStmt = $db->query("SELECT id FROM users WHERE role = 'respondent' LIMIT 1");
                $user_id = (int)$uStmt->fetchColumn();
            }
        }

        if (!$user_id) {
            json_error('Respondent not found.', 404);
        }

        // Fetch current status
        $stmt = $db->prepare("SELECT id, name, status FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();

        if (!$user) {
            json_error('User record not found in database.', 404);
        }

        $explicit_status = sanitize_string($_POST['status'] ?? '');
        if (in_array($explicit_status, ['active', 'inactive'], true)) {
            $new_status = $explicit_status;
        } else {
            $new_status = ($user['status'] === 'active') ? 'inactive' : 'active';
        }

        $updateStmt = $db->prepare("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?");
        $updateStmt->execute([$new_status, $user_id]);

        $_SESSION['user_status'] = $new_status;

        try {
            $actStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, description, created_at) VALUES (?, ?, ?, NOW())");
            $actStmt->execute([$user_id, 'status_change', "Respondent {$user['name']} set status to {$new_status}"]);
        } catch (Throwable $e) {
            // Activity log fallback
        }

        $is_online = ($new_status === 'active');
        $msg = $is_online ? 'You are now ONLINE and ready to receive emergency dispatches.' : 'You are now OFFLINE. Emergency dispatches paused.';

        json_success($msg, [
            'user_id'   => (int)$user_id,
            'status'    => $new_status,
            'is_online' => $is_online
        ]);
    }

    json_error('Invalid action requested.', 400);
} catch (Throwable $e) {
    error_log("[RescueLine Dashboard API Error] " . $e->getMessage());
    json_error('Database error: ' . $e->getMessage(), 500);
}
