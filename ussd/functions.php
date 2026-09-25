<?php
/**
 * RescueLine - USSD Helper Functions & Session State Handler
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';

/**
 * Retrieves or initializes a USSD session in the database.
 *
 * @param string $session_id
 * @param string $phone_number
 * @param string $service_code
 * @return array Session record
 */
function get_ussd_session(string $session_id, string $phone_number, string $service_code): array {
    $db = get_db();
    $stmt = $db->prepare("SELECT * FROM ussd_sessions WHERE session_id = ? LIMIT 1");
    $stmt->execute([$session_id]);
    $session = $stmt->fetch();

    if (!$session) {
        $initial_data = json_encode(['step' => 'main', 'data' => []]);
        $ins = $db->prepare("INSERT INTO ussd_sessions (session_id, phone_number, service_code, current_step, session_data, is_active, created_at) VALUES (?, ?, ?, 'main', ?, 1, NOW())");
        $ins->execute([$session_id, $phone_number, $service_code, $initial_data]);
        
        return [
            'session_id'   => $session_id,
            'phone_number' => $phone_number,
            'service_code' => $service_code,
            'current_step' => 'main',
            'session_data' => ['step' => 'main', 'data' => []],
            'is_active'    => 1
        ];
    }

    $session['session_data'] = is_string($session['session_data']) ? json_decode($session['session_data'], true) : ($session['session_data'] ?? []);
    return $session;
}

/**
 * Updates USSD session state in the database.
 *
 * @param string $session_id
 * @param string $step
 * @param array $data
 * @param bool $is_active
 * @return void
 */
function update_ussd_session(string $session_id, string $step, array $data = [], bool $is_active = true): void {
    $db = get_db();
    $json = json_encode(['step' => $step, 'data' => $data]);
    $stmt = $db->prepare("UPDATE ussd_sessions SET current_step = ?, session_data = ?, is_active = ?, updated_at = NOW() WHERE session_id = ?");
    $stmt->execute([$step, $json, $is_active ? 1 : 0, $session_id]);
}

/**
 * Creates an emergency report in the database from USSD submission.
 *
 * @param array $report_data
 * @return string Generated Report Code (e.g. RL-0025)
 */
function create_ussd_report(array $report_data): string {
    $db = get_db();
    
    // Generate unique report code
    $count = (int)$db->query("SELECT COUNT(*) FROM reports")->fetchColumn() + 1;
    $report_code = 'RL-' . str_pad((string)$count, 4, '0', STR_PAD_LEFT);

    $stmt = $db->prepare("
        INSERT INTO reports (
            report_code, category_id, category_name, source, reporter_name, reporter_phone,
            state, lga, address_landmark, priority, status, description, created_at
        ) VALUES (
            ?, ?, ?, 'ussd', ?, ?,
            ?, ?, ?, ?, 'pending', ?, NOW()
        )
    ");

    $cat_id      = (int)($report_data['category_id'] ?? 8);
    $cat_name    = (string)($report_data['category_name'] ?? 'Emergency');
    $reporter    = (string)($report_data['reporter_name'] ?? 'USSD Caller');
    $phone       = (string)($report_data['phone_number'] ?? '');
    $state       = (string)($report_data['state'] ?? 'Kaduna');
    $lga         = (string)($report_data['lga'] ?? 'Kaduna South');
    $landmark    = (string)($report_data['landmark'] ?? 'USSD Report Location');
    $priority    = (string)($report_data['priority'] ?? 'critical');
    $description = (string)($report_data['description'] ?? 'Emergency reported via USSD interactive menu.');

    $stmt->execute([
        $report_code, $cat_id, $cat_name, $reporter, $phone,
        $state, $lga, $landmark, $priority, $description
    ]);

    $report_id = (int)$db->lastInsertId();

    // Insert timeline record
    $timeline = $db->prepare("INSERT INTO report_timeline (report_id, action, new_status, note, created_at) VALUES (?, 'Report Logged', 'pending', 'Submitted via USSD', NOW())");
    $timeline->execute([$report_id]);

    // Insert system notification
    $notif = $db->prepare("INSERT INTO notifications (report_id, title, message, type, icon, is_read, created_at) VALUES (?, ?, ?, 'critical', 'alert-circle', 0, NOW())");
    $notif->execute([$report_id, "New USSD Emergency: {$cat_name}", "Report {$report_code} logged at {$lga}, {$state}."]);

    return $report_code;
}
