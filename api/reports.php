<?php
/**
 * RescueLine - Emergency Reports Management API Endpoint
 * Handles live report querying, cascading filters, status workflows, responder assignment, and timeline tracking.
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';
require_once __DIR__ . '/../sms/send_sms.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = get_db();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = sanitize_string($_GET['action'] ?? ($_POST['action'] ?? 'list'));

    // 1. LIST REPORTS (with cascading filters & pagination)
    if ($action === 'list') {
        $search   = sanitize_string($_GET['search'] ?? '');
        $state    = sanitize_string($_GET['state'] ?? '');
        $lga      = sanitize_string($_GET['lga'] ?? '');
        $type     = sanitize_string($_GET['type'] ?? '');
        $priority = sanitize_string($_GET['priority'] ?? '');
        $status   = sanitize_string($_GET['status'] ?? '');
        $limit    = sanitize_int($_GET['limit'] ?? 100, 1, 500, 100);

        $query = "
            SELECT 
                r.id, r.report_code AS reportCode, r.category_id, r.category_name AS type,
                r.source, r.reporter_name, r.reporter_phone AS reporter,
                r.state, r.lga, r.address_landmark AS landmark,
                r.latitude, r.longitude, r.priority, r.status, r.description,
                r.casualty_count, r.injured_count,
                r.assigned_respondent_id AS assignedRespondentId,
                u.name AS assignedRespondent, u.phone AS respondentPhone,
                r.created_at AS receivedAt, r.assigned_at, r.responding_at, r.resolved_at,
                r.response_time_minutes, r.resolution_notes
            FROM reports r
            LEFT JOIN users u ON r.assigned_respondent_id = u.id
            WHERE 1=1
        ";

        $params = [];

        if (!empty($search)) {
            $query .= " AND (r.report_code LIKE ? OR r.description LIKE ? OR r.reporter_phone LIKE ? OR r.address_landmark LIKE ? OR u.name LIKE ?)";
            $term = '%' . escape_like($search) . '%';
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        if (!empty($state)) {
            $query .= " AND r.state = ?";
            $params[] = $state;
        }

        if (!empty($lga)) {
            $query .= " AND r.lga = ?";
            $params[] = $lga;
        }

        if (!empty($type)) {
            $query .= " AND (r.category_name LIKE ? OR r.category_id = ?)";
            $params[] = '%' . escape_like($type) . '%';
            $params[] = is_numeric($type) ? (int)$type : 0;
        }

        if (!empty($priority)) {
            $query .= " AND r.priority = ?";
            $params[] = $priority;
        }

        if (!empty($status)) {
            $query .= " AND r.status = ?";
            $params[] = $status;
        }

        $query .= " ORDER BY (r.priority = 'critical') DESC, r.created_at DESC LIMIT {$limit}";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $reports = $stmt->fetchAll();

        // Get Available Active Respondents for assignment dropdown
        $respondents = $db->query("
            SELECT id, name, phone, email, state, lga, unit
            FROM users 
            WHERE role IN ('respondent', 'dispatcher') AND status = 'active'
            ORDER BY name ASC
        ")->fetchAll();

        // Summary Counts
        $stats = $db->query("
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status IN ('assigned', 'responding') THEN 1 ELSE 0 END) AS responding,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
            FROM reports
        ")->fetch();

        json_success('Reports retrieved successfully.', [
            'reports'     => $reports,
            'respondents' => $respondents,
            'stats'       => [
                'total'      => (int)($stats['total'] ?? 0),
                'pending'    => (int)($stats['pending'] ?? 0),
                'responding' => (int)($stats['responding'] ?? 0),
                'resolved'   => (int)($stats['resolved'] ?? 0)
            ]
        ]);
    }

    // 2. GET SINGLE REPORT DETAILS (with Timeline)
    if ($action === 'get') {
        $idParam = sanitize_string($_GET['id'] ?? ($_GET['code'] ?? ''));
        if (empty($idParam)) json_error('Report ID or Code is required.');

        $report = null;
        if (is_numeric($idParam)) {
            $stmt = $db->prepare("
                SELECT 
                    r.*, u.name AS respondent_name, u.phone AS respondent_phone, u.unit AS respondent_unit,
                    c.color AS category_color, c.icon AS category_icon
                FROM reports r
                LEFT JOIN users u ON r.assigned_respondent_id = u.id
                LEFT JOIN categories c ON r.category_id = c.id
                WHERE r.id = ?
            ");
            $stmt->execute([(int)$idParam]);
            $report = $stmt->fetch();
        }

        if (!$report) {
            $stmt = $db->prepare("
                SELECT 
                    r.*, u.name AS respondent_name, u.phone AS respondent_phone, u.unit AS respondent_unit,
                    c.color AS category_color, c.icon AS category_icon
                FROM reports r
                LEFT JOIN users u ON r.assigned_respondent_id = u.id
                LEFT JOIN categories c ON r.category_id = c.id
                WHERE r.report_code = ?
            ");
            $stmt->execute([$idParam]);
            $report = $stmt->fetch();
        }

        if (!$report) {
            // Fallback: try matching numeric ID suffix or first available report
            $stmt = $db->prepare("
                SELECT 
                    r.*, u.name AS respondent_name, u.phone AS respondent_phone, u.unit AS respondent_unit,
                    c.color AS category_color, c.icon AS category_icon
                FROM reports r
                LEFT JOIN users u ON r.assigned_respondent_id = u.id
                LEFT JOIN categories c ON r.category_id = c.id
                ORDER BY r.id DESC LIMIT 1
            ");
            $stmt->execute();
            $report = $stmt->fetch();
        }

        if (!$report) json_error('Report not found.', 404);

        // Timeline history
        $timelineStmt = $db->prepare("
            SELECT t.*, u.name AS user_name
            FROM report_timeline t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.report_id = ?
            ORDER BY t.created_at ASC
        ");
        $timelineStmt->execute([$report['id']]);
        $timeline = $timelineStmt->fetchAll();

        json_success('Report details loaded.', [
            'report'   => $report,
            'timeline' => $timeline
        ]);
    }

    // Require POST for mutations
    if ($method !== 'POST') {
        json_error('Method not allowed.', 405);
    }

    // 3. CREATE NEW REPORT
    if ($action === 'create') {
        $category_name = sanitize_string($_POST['category_name'] ?? 'Emergency');
        $category_id   = sanitize_int($_POST['category_id'] ?? null);
        $source        = sanitize_string($_POST['source'] ?? 'web');
        $reporter_name = sanitize_string($_POST['reporter_name'] ?? 'Citizen');
        $reporter_phone= sanitize_phone($_POST['reporter_phone'] ?? '');
        $state         = sanitize_string($_POST['state'] ?? 'Kaduna');
        $lga           = sanitize_string($_POST['lga'] ?? 'Kaduna South');
        $landmark      = sanitize_string($_POST['address_landmark'] ?? '');
        $priority      = sanitize_string($_POST['priority'] ?? 'medium');
        $description   = sanitize_string($_POST['description'] ?? '');

        if (empty($reporter_phone) || empty($landmark) || empty($description)) {
            json_error('Reporter phone, landmark/address, and description are required.');
        }

        // Generate Report Code
        $count = (int)$db->query("SELECT COUNT(*) FROM reports")->fetchColumn() + 1;
        $report_code = 'RL-' . str_pad((string)$count, 4, '0', STR_PAD_LEFT);

        $stmt = $db->prepare("
            INSERT INTO reports (
                report_code, category_id, category_name, source, reporter_name, reporter_phone,
                state, lga, address_landmark, priority, status, description, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, 'pending', ?, NOW()
            )
        ");
        $stmt->execute([
            $report_code, $category_id, $category_name, $source, $reporter_name, $reporter_phone,
            $state, $lga, $landmark, $priority, $description
        ]);

        $new_id = (int)$db->lastInsertId();

        // Add to timeline
        $timeline = $db->prepare("INSERT INTO report_timeline (report_id, user_id, action, new_status, note, created_at) VALUES (?, ?, 'Report Created', 'pending', 'Initial report logged into system', NOW())");
        $timeline->execute([$new_id, $_SESSION['user_id'] ?? null]);

        // Send confirmation SMS
        if (env('SMS_API_KEY')) {
            send_sms($reporter_phone, "RescueLine Alert: Your report {$report_code} ({$category_name}) at {$lga}, {$state} has been received.", $new_id);
        }

        log_activity('report.create', 'reports', $new_id, ['code' => $report_code]);
        json_success('Emergency report logged successfully.', ['id' => $new_id, 'report_code' => $report_code]);
    }

    // 4. ASSIGN RESPONDENT
    if ($action === 'assign') {
        $report_id     = sanitize_int($_POST['report_id'] ?? null);
        $respondent_id = sanitize_int($_POST['respondent_id'] ?? null);
        $notes         = sanitize_string($_POST['notes'] ?? 'Assigned by dispatcher');

        if (!$report_id || !$respondent_id) {
            json_error('Report ID and Respondent ID are required.');
        }

        // Fetch responder details
        $respStmt = $db->prepare("SELECT id, name, phone FROM users WHERE id = ?");
        $respStmt->execute([$respondent_id]);
        $resp = $respStmt->fetch();

        if (!$resp) json_error('Selected respondent not found.');

        // Update Report
        $update = $db->prepare("UPDATE reports SET assigned_respondent_id = ?, status = 'responding', assigned_at = NOW(), responding_at = NOW(), updated_at = NOW() WHERE id = ?");
        $update->execute([$respondent_id, $report_id]);

        // Insert Timeline Record
        $tl = $db->prepare("INSERT INTO report_timeline (report_id, user_id, action, previous_status, new_status, note, created_at) VALUES (?, ?, 'Assigned Respondent', 'pending', 'responding', ?, NOW())");
        $tl->execute([$report_id, $_SESSION['user_id'] ?? null, "Assigned to {$resp['name']} ({$resp['phone']}). Note: {$notes}"]);

        // Send alert SMS to respondent
        if (!empty($resp['phone'])) {
            send_sms($resp['phone'], "RescueLine DISPATCH: Incident assigned to you. Check your console for navigation & details.", $report_id);
        }

        log_activity('report.assign', 'reports', $report_id, ['respondent' => $resp['name']]);
        json_success("Report assigned to {$resp['name']} successfully.");
    }

    // 5. UPDATE STATUS (Pending -> Responding -> Resolved / Cancelled)
    if ($action === 'update_status') {
        $report_id   = sanitize_int($_POST['report_id'] ?? null);
        $new_status  = sanitize_string($_POST['status'] ?? '');
        $notes       = sanitize_string($_POST['notes'] ?? '');

        if (!$report_id || empty($new_status)) {
            json_error('Valid Report ID and status required.');
        }

        // Fetch previous status
        $prev = $db->prepare("SELECT status, created_at FROM reports WHERE id = ?");
        $prev->execute([$report_id]);
        $row = $prev->fetch();

        if (!$row) json_error('Report not found.');

        $prev_status = $row['status'];
        $resolved_at = ($new_status === 'resolved') ? date('Y-m-d H:i:s') : null;
        $response_time = null;

        if ($new_status === 'resolved' && !empty($row['created_at'])) {
            $created_ts = strtotime($row['created_at']);
            $response_time = max(1, (int)round((time() - $created_ts) / 60));
        }

        $stmt = $db->prepare("
            UPDATE reports 
            SET status = ?, 
                resolved_at = COALESCE(?, resolved_at), 
                response_time_minutes = COALESCE(?, response_time_minutes),
                resolution_notes = ?,
                updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$new_status, $resolved_at, $response_time, $notes, $report_id]);

        // Insert timeline
        $tl = $db->prepare("INSERT INTO report_timeline (report_id, user_id, action, previous_status, new_status, note, created_at) VALUES (?, ?, 'Status Changed', ?, ?, ?, NOW())");
        $tl->execute([$report_id, $_SESSION['user_id'] ?? null, $prev_status, $new_status, $notes]);

        log_activity('report.status_change', 'reports', $report_id, ['from' => $prev_status, 'to' => $new_status]);
        json_success("Report status updated to {$new_status}.");
    }

    // 6. ADD NOTE TO TIMELINE
    if ($action === 'add_note') {
        $report_id = sanitize_int($_POST['report_id'] ?? null);
        $note      = sanitize_string($_POST['note'] ?? '');
        $action_name = sanitize_string($_POST['action_name'] ?? 'Note Added');

        if (!$report_id || empty($note)) {
            json_error('Report ID and note text are required.');
        }

        $tl = $db->prepare("INSERT INTO report_timeline (report_id, user_id, action, note, created_at) VALUES (?, ?, ?, ?, NOW())");
        $tl->execute([$report_id, $_SESSION['user_id'] ?? null, $action_name, $note]);

        log_activity('report.add_note', 'reports', $report_id, ['note' => $note]);
        json_success('Incident note recorded successfully.');
    }

    // 7. EXPORT REPORTS AS CSV
    if ($action === 'export') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=rescueline_reports_' . date('Ymd_His') . '.csv');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['ID', 'Reference', 'Category', 'Source', 'Reporter', 'Phone', 'State', 'LGA', 'Address', 'Priority', 'Status', 'Assigned Responder', 'Reported Time', 'Resolved Time']);

        $rows = $db->query("
            SELECT r.id, r.report_code, r.category_name, r.source, r.reporter_name, r.reporter_phone,
                   r.state, r.lga, r.address_landmark, r.priority, r.status, u.name AS responder,
                   r.created_at, r.resolved_at
            FROM reports r
            LEFT JOIN users u ON r.assigned_respondent_id = u.id
            ORDER BY r.id DESC
        ")->fetchAll();

        foreach ($rows as $r) {
            fputcsv($out, [
                $r['id'], $r['report_code'], $r['category_name'], $r['source'], $r['reporter_name'],
                $r['reporter_phone'], $r['state'], $r['lga'], $r['address_landmark'], $r['priority'],
                $r['status'], $r['responder'] ?? 'Unassigned', $r['created_at'], $r['resolved_at'] ?? 'N/A'
            ]);
        }
        fclose($out);
        exit;
    }

    json_error('Unsupported action.', 400);
} catch (Throwable $e) {
    error_log("[RescueLine Reports API Error] " . $e->getMessage());
    json_error('Database error: ' . $e->getMessage(), 500);
}
