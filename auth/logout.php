<?php
/**
 * RescueLine - Secure Authentication Logout
 */

require_once __DIR__ . '/../inc/config.php';

logout_user();

header('Location: login.php?logged_out=1');
exit;
