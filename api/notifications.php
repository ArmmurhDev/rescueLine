<?php
/**
 * RescueLine - Real-time Notifications API
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = get_db();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = sanitize_string($_GET['action'] ?? ($_POST['action'] ?? 'list'));
    $user_id = $_SESSION['user_id'] ?? null;

    if ($action === 'list') {
        $stmt = $db->prepare("
            SELECT id, report_id, title, message, type, icon, is_read, created_at
            FROM notifications
            WHERE user_id = ? OR user_id IS NULL
            ORDER BY created_at DESC
            LIMIT 20
        ");
        $stmt->execute([$user_id]);
        $notifications = $stmt->fetchAll();

        $unread_count = (int)$db->query("SELECT COUNT(*) FROM notifications WHERE is_read = 0")->fetchColumn();

        json_success('Notifications loaded.', [
            'notifications' => $notifications,
            'unread_count'  => $unread_count
        ]);
    }

    if ($action === 'mark_all_read' && $method === 'POST') {
        $db->exec("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE is_read = 0");
        json_success('All notifications marked as read.');
    }

    json_error('Unsupported action.', 400);
} catch (Throwable $e) {
    error_log("[RescueLine Notifications API Error] " . $e->getMessage());
    json_error('Database error: ' . $e->getMessage(), 500);
}
