<?php
/**
 * RescueLine - Root Entry Point
 * Redirects incoming visitors to the secure authentication portal or active dashboard.
 */

require_once __DIR__ . '/inc/config.php';

// If user is already authenticated, route them to their dashboard
if (is_logged_in()) {
    $role = $_SESSION['user_role'] ?? 'respondent';
    if (in_array($role, ['admin', 'superadmin'], true)) {
        header('Location: admin/index.php');
    } else {
        header('Location: respondant/dashboard.php');
    }
    exit;
}

// Unauthenticated users are redirected to login
header('Location: auth/login.php');
exit;
