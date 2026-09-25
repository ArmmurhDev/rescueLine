<?php
/**
 * RescueLine - Emergency Incident Categories Management API Endpoint
 * Handles live CRUD operations directly against the connected MySQL database.
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = get_db();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = sanitize_string($_GET['action'] ?? ($_POST['action'] ?? 'list'));

    // 1. LIST ALL CATEGORIES (+ Live Reports Count & Summary Stats)
    if ($action === 'list') {
        $categories = $db->query("
            SELECT 
                c.id, c.name, c.slug, c.description, c.icon, c.icon_class, c.color, 
                c.priority_default, c.status, c.display_order, DATE(c.created_at) AS created,
                COUNT(r.id) AS reports
            FROM categories c
            LEFT JOIN reports r ON (r.category_id = c.id OR r.category_name = c.name)
            GROUP BY c.id
            ORDER BY c.display_order ASC, c.name ASC
        ")->fetchAll();

        $total_reports = (int)$db->query("SELECT COUNT(*) FROM reports")->fetchColumn();

        json_success('Data loaded.', [
            'categories' => $categories,
            'stats'      => [
                'total_categories'    => count($categories),
                'active_categories'   => count(array_filter($categories, fn($c) => ($c['status'] ?? '') === 'active')),
                'inactive_categories' => count(array_filter($categories, fn($c) => ($c['status'] ?? '') === 'inactive')),
                'total_reports'       => $total_reports
            ]
        ]);
    }

    // Require POST for mutation actions
    if ($method !== 'POST') {
        json_error('Method not allowed.', 405);
    }

    // 2. CATEGORY CRUD ACTIONS
    if ($action === 'add_category') {
        $name = sanitize_string($_POST['name'] ?? '');
        $description = sanitize_string($_POST['description'] ?? '');
        $icon = sanitize_string($_POST['icon'] ?? 'alert-circle');
        $icon_class = sanitize_string($_POST['icon_class'] ?? 'other');
        $color = sanitize_string($_POST['color'] ?? '#e63946');
        $priority = sanitize_string($_POST['priority'] ?? 'medium');
        $status = sanitize_string($_POST['status'] ?? 'active');

        if (empty($name)) {
            json_error('Category name is required.');
        }

        $slug = preg_replace('/[^a-z0-9]+/i', '-', strtolower($name));
        $slug = trim($slug, '-');

        $stmt = $db->prepare("INSERT INTO categories (name, slug, description, icon, icon_class, color, priority_default, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$name, $slug, $description, $icon, $icon_class, $color, $priority, $status]);
        
        $new_id = (int)$db->lastInsertId();
        log_activity('category.create', 'categories', $new_id, ['name' => $name]);
        json_success('Category added successfully.', ['id' => $new_id]);
    }

    if ($action === 'edit_category') {
        $id = sanitize_int($_POST['id'] ?? null);
        $name = sanitize_string($_POST['name'] ?? '');
        $description = sanitize_string($_POST['description'] ?? '');
        $icon = sanitize_string($_POST['icon'] ?? 'alert-circle');
        $icon_class = sanitize_string($_POST['icon_class'] ?? 'other');
        $color = sanitize_string($_POST['color'] ?? '#e63946');
        $status = sanitize_string($_POST['status'] ?? 'active');

        if (!$id || empty($name)) {
            json_error('Valid category ID and name required.');
        }

        $stmt = $db->prepare("UPDATE categories SET name = ?, description = ?, icon = ?, icon_class = ?, color = ?, status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$name, $description, $icon, $icon_class, $color, $status, $id]);
        
        log_activity('category.update', 'categories', $id, ['name' => $name]);
        json_success('Category updated successfully.');
    }

    if ($action === 'toggle_category') {
        $id = sanitize_int($_POST['id'] ?? null);
        if (!$id) json_error('Invalid category ID.');

        $stmt = $db->prepare("UPDATE categories SET status = IF(status = 'active', 'inactive', 'active'), updated_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        
        json_success('Category status toggled.');
    }

    if ($action === 'delete_category') {
        $id = sanitize_int($_POST['id'] ?? null);
        if (!$id) json_error('Invalid category ID.');

        $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        
        log_activity('category.delete', 'categories', $id);
        json_success('Category deleted successfully.');
    }

    json_error('Unsupported action.', 400);
} catch (Throwable $e) {
    error_log("[RescueLine Categories API Error] " . $e->getMessage());
    json_error('Database error: ' . $e->getMessage(), 500);
}

