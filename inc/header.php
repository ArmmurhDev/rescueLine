<?php
/**
 * RescueLine - Reusable Header Component
 * Handles secure session startup, security headers, metadata, fonts, and base stylesheets.
 */

// 1. Secure Session Initialization
if (session_status() === PHP_SESSION_NONE) {
    // Set secure session cookie parameters before starting session
    $is_secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $is_secure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// 2. HTTP Security Headers
if (!headers_sent()) {
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
}

// 3. Configuration & Dynamic Metadata with XSS Sanitization
$page_title       = isset($page_title) ? htmlspecialchars($page_title, ENT_QUOTES, 'UTF-8') : 'RescueLine • Emergency Response';
$page_description = isset($page_description) ? htmlspecialchars($page_description, ENT_QUOTES, 'UTF-8') : 'RescueLine - Emergency Incident Reporting & Response Dashboard';
$current_theme    = isset($_SESSION['theme']) ? htmlspecialchars($_SESSION['theme'], ENT_QUOTES, 'UTF-8') : 'dark';
$assets_path      = isset($assets_path) ? htmlspecialchars($assets_path, ENT_QUOTES, 'UTF-8') : '../assets';
?>
<!DOCTYPE html>
<html lang="en" data-theme="<?= $current_theme ?>">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="<?= $page_description ?>" />
    <title><?= $page_title ?></title>

    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Icon & Chart Libraries -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

    <!-- Page Specific / Extra Stylesheets -->
    <?php if (isset($extra_css)): ?>
        <?php if (is_array($extra_css)): ?>
            <?php foreach ($extra_css as $css_file): ?>
                <link rel="stylesheet" href="<?= htmlspecialchars($css_file, ENT_QUOTES, 'UTF-8') ?>">
            <?php endforeach; ?>
        <?php elseif (is_string($extra_css)): ?>
            <link rel="stylesheet" href="<?= htmlspecialchars($extra_css, ENT_QUOTES, 'UTF-8') ?>">
        <?php endif; ?>
    <?php endif; ?>
</head>
<body>

<div class="app">
