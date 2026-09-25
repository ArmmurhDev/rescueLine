<?php
/**
 * RescueLine - Respondents Management API Endpoint
 * Handles live respondent retrieval, search filters, registration, profile editing, and status toggling.
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = get_db();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = sanitize_string($_GET['action'] ?? ($_POST['action'] ?? 'list'));

    // 1. LIST RESPONDENTS (with search & filters)
    if ($action === 'list') {
        $search = sanitize_string($_GET['search'] ?? '');
        $state  = sanitize_string($_GET['state'] ?? '');
        $status = sanitize_string($_GET['status'] ?? '');

        $query = "
            SELECT 
                u.id, u.uuid, u.name, u.email, u.phone, u.role, u.status,
                u.state, u.lga, u.unit, u.badge_number,
                DATE(u.created_at) AS created_date,
                COUNT(r.id) AS assigned_reports
            FROM users u
            LEFT JOIN reports r ON r.assigned_respondent_id = u.id
            WHERE u.role IN ('respondent', 'dispatcher')
        ";

        $params = [];

        if (!empty($search)) {
            $query .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.badge_number LIKE ?)";
            $searchTerm = '%' . escape_like($search) . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if (!empty($state)) {
            $query .= " AND u.state = ?";
            $params[] = $state;
        }

        if (!empty($status)) {
            $query .= " AND u.status = ?";
            $params[] = $status;
        }

        $query .= " GROUP BY u.id ORDER BY u.id DESC";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $respondents = $stmt->fetchAll();

        // Overall stats
        $stats = $db->query("
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
                COUNT(DISTINCT NULLIF(state, '')) AS states_covered
            FROM users
            WHERE role IN ('respondent', 'dispatcher')
        ")->fetch();

        json_success('Respondents loaded.', [
            'respondents' => $respondents,
            'stats'       => [
                'total'          => (int)($stats['total'] ?? 0),
                'active'         => (int)($stats['active'] ?? 0),
                'inactive'       => (int)($stats['inactive'] ?? 0),
                'states_covered' => (int)($stats['states_covered'] ?? 0)
            ]
        ]);
    }

    // Require POST for mutation actions
    if ($method !== 'POST') {
        json_error('Method not allowed.', 405);
    }

    // 2. ADD RESPONDENT
    if ($action === 'add') {
        $name     = sanitize_string($_POST['name'] ?? '');
        $phone    = sanitize_phone($_POST['phone'] ?? '');
        $email    = sanitize_email($_POST['email'] ?? '');
        $state    = sanitize_string($_POST['state'] ?? '');
        $lga      = sanitize_string($_POST['lga'] ?? '');
        $unit     = sanitize_string($_POST['unit'] ?? 'Emergency Squad');
        $badge    = sanitize_string($_POST['badge_number'] ?? 'RESP-' . rand(100, 999));
        $password = (string)($_POST['password'] ?? 'Respondent@2026!');
        $status   = sanitize_string($_POST['status'] ?? 'active');

        if (empty($name) || empty($phone) || empty($email) || empty($state)) {
            json_error('Name, phone, valid email, and state are required fields.');
        }

        // Check uniqueness of email and phone
        $check = $db->prepare("SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1");
        $check->execute([$email, $phone]);
        if ($check->fetch()) {
            json_error('A respondent with this email or phone number already exists.');
        }

        $uuid = generate_uuid();
        $password_hash = hash_password($password);

        $stmt = $db->prepare("
            INSERT INTO users (
                uuid, name, email, phone, password_hash, role, status,
                state, lga, unit, badge_number, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, 'respondent', ?,
                ?, ?, ?, ?, NOW()
            )
        ");

        $stmt->execute([
            $uuid, $name, $email, $phone, $password_hash, $status,
            $state, $lga, $unit, $badge
        ]);

        $new_id = (int)$db->lastInsertId();
        log_activity('respondent.create', 'users', $new_id, ['name' => $name, 'state' => $state]);

        json_success('Respondent registered successfully.', ['id' => $new_id]);
    }

    // 3. EDIT RESPONDENT
    if ($action === 'edit') {
        $id    = sanitize_int($_POST['id'] ?? null);
        $name  = sanitize_string($_POST['name'] ?? '');
        $phone = sanitize_phone($_POST['phone'] ?? '');
        $email = sanitize_email($_POST['email'] ?? '');
        $state = sanitize_string($_POST['state'] ?? '');
        $lga   = sanitize_string($_POST['lga'] ?? '');
        $unit  = sanitize_string($_POST['unit'] ?? '');
        $status= sanitize_string($_POST['status'] ?? 'active');

        if (!$id || empty($name) || empty($phone) || empty($email) || empty($state)) {
            json_error('Valid ID, name, phone, email, and state required.');
        }

        // Check uniqueness excluding current user
        $check = $db->prepare("SELECT id FROM users WHERE (email = ? OR phone = ?) AND id != ? LIMIT 1");
        $check->execute([$email, $phone, $id]);
        if ($check->fetch()) {
            json_error('Another user already uses this email or phone number.');
        }

        $stmt = $db->prepare("UPDATE users SET name = ?, phone = ?, email = ?, state = ?, lga = ?, unit = ?, status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$name, $phone, $email, $state, $lga, $unit, $status, $id]);

        log_activity('respondent.update', 'users', $id, ['name' => $name]);
        json_success('Respondent updated successfully.');
    }

    // 4. TOGGLE STATUS
    if ($action === 'toggle_status') {
        $id = sanitize_int($_POST['id'] ?? null);
        if (!$id) json_error('Invalid respondent ID.');

        $stmt = $db->prepare("UPDATE users SET status = IF(status = 'active', 'inactive', 'active'), updated_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);

        json_success('Respondent status updated.');
    }

    // 5. DELETE RESPONDENT
    if ($action === 'delete') {
        $id = sanitize_int($_POST['id'] ?? null);
        if (!$id) json_error('Invalid respondent ID.');

        $stmt = $db->prepare("DELETE FROM users WHERE id = ? AND role = 'respondent'");
        $stmt->execute([$id]);

        log_activity('respondent.delete', 'users', $id);
        json_success('Respondent deleted successfully.');
    }

    json_error('Unsupported action.', 400);
} catch (Throwable $e) {
    error_log("[RescueLine Respondents API Error] " . $e->getMessage());
    json_error('Database error: ' . $e->getMessage(), 500);
}
