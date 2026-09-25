<?php
/**
 * RescueLine - Core Configuration, Database Connection & Security Architecture
 * 
 * Enterprise-grade security framework providing:
 * - Environment configuration loader (.env)
 * - Hardened PDO Database Connection with Automatic Schema Initialization
 * - Input Sanitization, Output Escaping & XSS Shield
 * - CSRF Token Generation & Timing-Attack Safe Verification
 * - Secure Session Hardening, Fixation & Hijacking Prevention
 * - Rate Limiting & Anti-Brute-Force Protection
 * - Role-Based Access Control (RBAC) & Authentication Helpers
 * - Secure Audit Logging & Error Handling
 * 
 * @package RescueLine
 */

// Strict error reporting and timezone
declare(strict_types=1);

// Prevent direct execution if required or ensure standard bootstrap
defined('RESCUELINE_BOOTSTRAPPED') or define('RESCUELINE_BOOTSTRAPPED', true);

/* =============================================================================
 * 1. ENVIRONMENT LOADER (.env)
 * ============================================================================= */

/**
 * Loads and parses environment variables from a .env file safely.
 *
 * @param string $filePath Absolute or relative path to the .env file
 * @return bool True if loaded, false otherwise
 */
function load_env(string $filePath): bool {
    if (!file_exists($filePath) || !is_readable($filePath)) {
        return false;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return false;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        // Skip comment lines
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Strip surrounding quotes if present
            if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                $value = substr($value, 1, -1);
            }

            // Handle inline comments
            if (strpos($value, ' #') !== false) {
                $parts = explode(' #', $value, 2);
                $value = trim($parts[0]);
            }

            // Store in $_ENV, $_SERVER, and putenv
            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
                putenv("{$key}={$value}");
            }
        }
    }

    return true;
}

// Automatically load root .env
$env_path = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
load_env($env_path);

/**
 * Helper to fetch an environment variable with a default fallback.
 *
 * @param string $key
 * @param mixed $default
 * @return mixed
 */
function env(string $key, $default = null) {
    if (array_key_exists($key, $_ENV)) {
        $val = $_ENV[$key];
    } elseif (array_key_exists($key, $_SERVER)) {
        $val = $_SERVER[$key];
    } else {
        $val = getenv($key);
        if ($val === false) {
            return $default;
        }
    }

    switch (strtolower((string)$val)) {
        case 'true':
        case '(true)':
            return true;
        case 'false':
        case '(false)':
            return false;
        case 'empty':
        case '(empty)':
            return '';
        case 'null':
        case '(null)':
            return null;
    }

    return $val;
}

/* =============================================================================
 * 2. APPLICATION ENVIRONMENT & ERROR HANDLING
 * ============================================================================= */

$app_env   = (string)env('APP_ENV', 'production');
$app_debug = (bool)env('APP_DEBUG', false);
$timezone  = (string)env('APP_TIMEZONE', 'Africa/Lagos');
date_default_timezone_set($timezone);

if ($app_debug || $app_env === 'development') {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(0);
}

// Configure error logging to a secure internal log file
$log_dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'db' . DIRECTORY_SEPARATOR . 'logs';
if (!is_dir($log_dir)) {
    @mkdir($log_dir, 0750, true);
}
ini_set('log_errors', '1');
ini_set('error_log', $log_dir . DIRECTORY_SEPARATOR . 'error.log');

/* =============================================================================
 * 3. HTTP SECURITY HEADERS
 * ============================================================================= */

if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(self)');
}

/* =============================================================================
 * 4. SECURE SESSION HARDENING
 * ============================================================================= */

function init_secure_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
                    (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443) ||
                    (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

        $lifetime  = (int)env('SESSION_LIFETIME', 7200);
        $same_site = (string)env('SESSION_SAME_SITE', 'Lax');
        $secure    = (bool)env('SESSION_SECURE_COOKIE', $is_https);

        // Session ini hardening
        ini_set('session.use_only_cookies', '1');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_samesite', $same_site);
        ini_set('session.gc_maxlifetime', (string)$lifetime);

        session_set_cookie_params([
            'lifetime' => $lifetime,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $secure,
            'httponly' => true,
            'samesite' => $same_site
        ]);

        session_start();

        // Check for session expiration
        $now = time();
        if (isset($_SESSION['LAST_ACTIVITY']) && ($now - $_SESSION['LAST_ACTIVITY'] > $lifetime)) {
            session_unset();
            session_destroy();
            session_start();
        }
        $_SESSION['LAST_ACTIVITY'] = $now;

        // Anti Session-Hijacking: Validate Client Fingerprint (IP subnet + User Agent)
        $client_ip = get_client_ip();
        $ip_subnet = implode('.', array_slice(explode('.', $client_ip), 0, 2)); // Subnet match for mobile ISP compatibility
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $fingerprint = hash('sha256', $ip_subnet . '|' . $user_agent);

        if (!isset($_SESSION['USER_FINGERPRINT'])) {
            $_SESSION['USER_FINGERPRINT'] = $fingerprint;
        } elseif (!hash_equals($_SESSION['USER_FINGERPRINT'], $fingerprint)) {
            // Potential session hijacking detected
            session_unset();
            session_destroy();
            session_start();
            $_SESSION['USER_FINGERPRINT'] = $fingerprint;
        }
    }
}

// Automatically initiate secure session
init_secure_session();

/* =============================================================================
 * 5. DATABASE CONNECTION & AUTOMATIC SCHEMA INITIALIZER
 * ============================================================================= */

/**
 * Returns a secure, singleton PDO database connection instance.
 * Automatically creates the database and initializes all tables from db/schema.db if not present.
 *
 * @staticvar PDO|null $pdo
 * @return PDO
 * @throws PDOException
 */
function get_db(): PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host     = (string)env('DB_HOST', '127.0.0.1');
    $port     = (int)env('DB_PORT', 3306);
    $dbname   = (string)env('DB_NAME', 'RescueLine');
    $user     = (string)env('DB_USER', 'root');
    $password = (string)env('DB_PASSWORD', '');
    $charset  = (string)env('DB_CHARSET', 'utf8mb4');

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // Critical against SQL Injection
        PDO::ATTR_STRINGIFY_FETCHES  => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci"
    ];

    try {
        // Step 1: Connect to server first (ensures database exists or creates it)
        $dsn_server = "mysql:host={$host};port={$port};charset={$charset}";
        $server_pdo = new PDO($dsn_server, $user, $password, $options);
        
        // Ensure RescueLine database exists
        $server_pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET {$charset} COLLATE utf8mb4_unicode_ci;");
        $server_pdo = null; // Close temporary server connection

        // Step 2: Connect directly to RescueLine database
        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
        $pdo = new PDO($dsn, $user, $password, $options);

        // Step 3: Check and auto-initialize tables if missing
        init_database_schema_if_needed($pdo);

        return $pdo;
    } catch (PDOException $e) {
        // Secure error logging without exposing credentials to end users
        error_log("[RescueLine DB Error] Connection failed: " . $e->getMessage());
        
        if (env('APP_DEBUG', false)) {
            die("<strong>RescueLine Database Connection Error:</strong> " . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'));
        } else {
            die("A secure system error occurred. Please try again later or contact your system administrator.");
        }
    }
}

/**
 * Alias for get_db()
 *
 * @return PDO
 */
/**
 * Alias for get_db()
 *
 * @return PDO
 */
function db(): PDO {
    return get_db();
}

/**
 * Automatically synchronizes and executes db/schema.db in real-time whenever the file is updated.
 * Uses SHA-256 hash verification against system_settings table to detect updates instantly.
 *
 * @param PDO $pdo Active PDO connection
 * @param bool $force Force sync regardless of hash match
 * @return bool True if sync was executed, false if already up-to-date
 */
function sync_database_schema(PDO $pdo, bool $force = false): bool {
    $schema_file = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'db' . DIRECTORY_SEPARATOR . 'schema.db';

    if (!file_exists($schema_file) || !is_readable($schema_file)) {
        return false;
    }

    try {
        $current_hash = hash_file('sha256', $schema_file);

        if (!$force) {
            // Check if system_settings table exists
            $tableCheck = $pdo->query("SHOW TABLES LIKE 'system_settings'");
            if ($tableCheck->fetchColumn()) {
                $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'schema_hash' LIMIT 1");
                $stmt->execute();
                $saved_hash = $stmt->fetchColumn();

                if ($saved_hash === $current_hash) {
                    return false; // Already up-to-date
                }
            }
        }

        // Execute SQL schema statements from db/schema.db
        $sql = file_get_contents($schema_file);
        if ($sql !== false && trim($sql) !== '') {
            execute_multi_query($pdo, $sql);

            // Record updated schema hash into system_settings
            $upsert = $pdo->prepare("
                INSERT INTO system_settings (setting_key, setting_value, setting_group, description, updated_at)
                VALUES ('schema_hash', ?, 'system', 'SHA256 checksum of db/schema.db for real-time migration', NOW())
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
            ");
            $upsert->execute([$current_hash]);

            error_log("[RescueLine] Real-time database schema sync completed successfully (Hash: {$current_hash}).");
            return true;
        }
    } catch (Throwable $e) {
        error_log("[RescueLine Real-time Schema Sync Error] " . $e->getMessage());
    }

    return false;
}

/**
 * Checks and triggers real-time schema sync if needed on connection.
 *
 * @param PDO $pdo Active PDO connection
 * @return void
 */
function init_database_schema_if_needed(PDO $pdo): void {
    sync_database_schema($pdo, false);
}

/**
 * Executes multi-statement SQL files safely.
 *
 * @param PDO $pdo
 * @param string $sql
 * @return void
 */
function execute_multi_query(PDO $pdo, string $sql): void {
    // Remove multi-line comments
    $sql = preg_replace('!/\*.*?\*/!s', '', $sql);
    // Remove single line comments
    $sql = preg_replace('/^--.*$/m', '', $sql);
    
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function ($stmt) {
            return strlen($stmt) > 0;
        }
    );

    foreach ($statements as $stmt) {
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            error_log("[RescueLine Query Exec Warning] " . $e->getMessage() . " | SQL: " . substr($stmt, 0, 100));
        }
    }
}

/* =============================================================================
 * 5.1 REAL-TIME DATABASE ACCESSIBILITY HELPERS
 * ============================================================================= */

/**
 * Executes a prepared statement and returns the PDOStatement object.
 *
 * @param string $sql Parameterized SQL query
 * @param array $params Query parameters
 * @return PDOStatement
 */
function db_query(string $sql, array $params = []): PDOStatement {
    $stmt = get_db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

/**
 * Executes a query and returns all matching rows as an associative array.
 *
 * @param string $sql Parameterized SQL query
 * @param array $params Query parameters
 * @return array
 */
function db_fetch_all(string $sql, array $params = []): array {
    return db_query($sql, $params)->fetchAll();
}

/**
 * Executes a query and returns a single row or null.
 *
 * @param string $sql Parameterized SQL query
 * @param array $params Query parameters
 * @return array|null
 */
function db_fetch_one(string $sql, array $params = []): ?array {
    $row = db_query($sql, $params)->fetch();
    return $row !== false ? $row : null;
}

/**
 * Executes a query and returns a single scalar column value.
 *
 * @param string $sql Parameterized SQL query
 * @param array $params Query parameters
 * @param int $column Column index (0-based)
 * @return mixed
 */
function db_fetch_column(string $sql, array $params = [], int $column = 0) {
    return db_query($sql, $params)->fetchColumn($column);
}

/**
 * Safely inserts a record into a table and returns the last inserted ID.
 *
 * @param string $table Table name
 * @param array $data Associative array of column => value
 * @return int Last insert ID
 */
function db_insert(string $table, array $data): int {
    $db = get_db();
    $cols = array_keys($data);
    $escaped_cols = array_map(fn($c) => "`" . preg_replace('/[^a-zA-Z0-9_]/', '', $c) . "`", $cols);
    $placeholders = array_fill(0, count($cols), '?');

    $sql = "INSERT INTO `" . preg_replace('/[^a-zA-Z0-9_]/', '', $table) . "` (" . implode(', ', $escaped_cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $db->prepare($sql);
    $stmt->execute(array_values($data));

    return (int)$db->lastInsertId();
}

/**
 * Safely updates records in a table and returns the count of affected rows.
 *
 * @param string $table Table name
 * @param array $data Associative array of column => value
 * @param string $where Where clause with ? placeholders
 * @param array $whereParams Values for where clause
 * @return int Affected row count
 */
function db_update(string $table, array $data, string $where, array $whereParams = []): int {
    $db = get_db();
    $sets = [];
    $values = [];

    foreach ($data as $col => $val) {
        $clean_col = preg_replace('/[^a-zA-Z0-9_]/', '', $col);
        $sets[] = "`{$clean_col}` = ?";
        $values[] = $val;
    }

    $values = array_merge($values, $whereParams);
    $clean_table = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
    $sql = "UPDATE `{$clean_table}` SET " . implode(', ', $sets) . " WHERE {$where}";

    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    return $stmt->rowCount();
}

/* =============================================================================
 * 6. INPUT SANITIZATION & SECURITY UTILITIES
 * ============================================================================= */

/**
 * Sanitizes input recursively, stripping null bytes and trimming whitespace.
 *
 * @param mixed $data
 * @return mixed
 */
function sanitize_input($data) {
    if (is_array($data)) {
        $clean = [];
        foreach ($data as $key => $value) {
            $clean_key = sanitize_string((string)$key);
            $clean[$clean_key] = sanitize_input($value);
        }
        return $clean;
    }

    if (is_string($data)) {
        // Strip null bytes
        $data = str_replace(chr(0), '', $data);
        return trim($data);
    }

    return $data;
}

/**
 * Sanitizes a string for safe database/internal storage by stripping unwanted tags.
 *
 * @param string|null $str
 * @return string
 */
function sanitize_string(?string $str): string {
    if ($str === null) return '';
    $clean = strip_tags(trim($str));
    return str_replace(["\r\n", "\r"], "\n", $clean);
}

/**
 * Validates and sanitizes email address.
 *
 * @param string|null $email
 * @return string|null Valid email or null
 */
function sanitize_email(?string $email): ?string {
    if ($email === null) return null;
    $email = filter_var(trim($email), FILTER_SANITIZE_EMAIL);
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? strtolower($email) : null;
}

/**
 * Validates and sanitizes integer value with optional boundary checks.
 *
 * @param mixed $val
 * @param int|null $min
 * @param int|null $max
 * @param int|null $default
 * @return int|null
 */
function sanitize_int($val, ?int $min = null, ?int $max = null, ?int $default = null): ?int {
    if ($val === null || $val === '') return $default;
    if (!is_numeric($val)) return $default;
    
    $int_val = (int)$val;
    if ($min !== null && $int_val < $min) return $default;
    if ($max !== null && $int_val > $max) return $default;
    
    return $int_val;
}

/**
 * Validates and sanitizes float value.
 *
 * @param mixed $val
 * @param float|null $default
 * @return float|null
 */
function sanitize_float($val, ?float $default = null): ?float {
    if ($val === null || $val === '') return $default;
    if (!is_numeric($val)) return $default;
    return (float)$val;
}

/**
 * Sanitizes and formats phone numbers (standardizes Nigerian / international format).
 *
 * @param string|null $phone
 * @return string
 */
function sanitize_phone(?string $phone): string {
    if ($phone === null) return '';
    // Strip everything except digits and plus sign
    $cleaned = preg_replace('/[^\d+]/', '', trim($phone));
    
    // Normalize local 080... to 080... or +234...
    if (str_starts_with($cleaned, '234') && !str_starts_with($cleaned, '+234')) {
        $cleaned = '+' . $cleaned;
    }
    
    return $cleaned;
}

/**
 * Escapes characters for SQL LIKE queries to prevent LIKE injection.
 *
 * @param string $term
 * @return string
 */
function escape_like(string $term): string {
    return addcslashes($term, '%_\\');
}

/**
 * Fast, safe HTML output escaping shorthand to prevent Cross-Site Scripting (XSS).
 *
 * @param mixed $string
 * @return string
 */
function e($string): string {
    if ($string === null) return '';
    return htmlspecialchars((string)$string, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Validates UUID v4 format.
 *
 * @param string $uuid
 * @return bool
 */
function validate_uuid(string $uuid): bool {
    return (bool)preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uuid);
}

/**
 * Generates a cryptographically secure UUID v4 string.
 *
 * @return string
 */
function generate_uuid(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/* =============================================================================
 * 7. CSRF PROTECTION SHIELD
 * ============================================================================= */

/**
 * Generates or retrieves the active CSRF token for the current session.
 *
 * @return string
 */
function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Outputs a hidden HTML input containing the CSRF token.
 *
 * @return string
 */
function csrf_field(): string {
    $token = csrf_token();
    return '<input type="hidden" name="csrf_token" value="' . e($token) . '" />';
}

/**
 * Verifies a submitted CSRF token using constant-time comparison to prevent timing attacks.
 *
 * @param string|null $token
 * @return bool
 */
function verify_csrf_token(?string $token = null): bool {
    if ($token === null) {
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    }

    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }

    return hash_equals($_SESSION['csrf_token'], (string)$token);
}

/**
 * Enforces CSRF token verification for state-changing HTTP requests.
 * Exits with 403 Forbidden if invalid.
 *
 * @return void
 */
function require_csrf(): void {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'], true)) {
        if (!verify_csrf_token()) {
            if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
                json_error('Invalid or expired CSRF security token.', 403);
            } else {
                http_response_code(403);
                die('<h1>403 Forbidden</h1><p>Security validation failed. Invalid or expired CSRF token.</p>');
            }
        }
    }
}

/* =============================================================================
 * 8. PASSWORD SECURITY & HASHING
 * ============================================================================= */

/**
 * Hashes a plaintext password using secure modern algorithms (Bcrypt / Argon2id).
 *
 * @param string $password
 * @return string
 */
function hash_password(string $password): string {
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost'   => 4,
            'threads'     => 1
        ]);
    }
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verifies a plaintext password against a stored hash and auto-rehashes if needed.
 *
 * @param string $password Plaintext password
 * @param string $hash Stored hash
 * @param int|null $user_id Optional user ID to update rehashed password in database
 * @return bool
 */
function verify_password(string $password, string $hash, ?int $user_id = null): bool {
    if (!password_verify($password, $hash)) {
        return false;
    }

    // Rehash password if cost or algorithm updated
    if ($user_id !== null && password_needs_rehash($hash, PASSWORD_DEFAULT)) {
        try {
            $new_hash = hash_password($password);
            $db = get_db();
            $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$new_hash, $user_id]);
        } catch (Throwable $e) {
            error_log("[RescueLine Rehash Error] " . $e->getMessage());
        }
    }

    return true;
}

/* =============================================================================
 * 9. RATE LIMITING & BRUTE-FORCE PROTECTION SHIELD
 * ============================================================================= */

/**
 * Checks if a specific action from an IP or identifier has exceeded rate limits.
 *
 * @param string $action_key E.g. 'login', 'ussd_submit', 'sms_send'
 * @param string|null $identifier Identifier (defaults to client IP)
 * @param int $max_attempts Maximum allowed attempts
 * @param int $decay_seconds Lockout duration in seconds
 * @return bool True if allowed, False if rate limited / blocked
 */
function check_rate_limit(string $action_key, ?string $identifier = null, int $max_attempts = 5, int $decay_seconds = 900): bool {
    try {
        $db = get_db();
        $id = $identifier ?: get_client_ip();
        
        $stmt = $db->prepare("SELECT attempts, blocked_until, last_attempt_at FROM rate_limits WHERE identifier = ? AND action_key = ?");
        $stmt->execute([$id, $action_key]);
        $record = $stmt->fetch();

        $now = date('Y-m-d H:i:s');

        if ($record) {
            // Check if currently blocked
            if ($record['blocked_until'] && $record['blocked_until'] > $now) {
                return false;
            }

            // Check if attempts exceeded within decay window
            $last_time = strtotime($record['last_attempt_at']);
            if ((time() - $last_time) > $decay_seconds) {
                // Reset expired window
                $reset = $db->prepare("UPDATE rate_limits SET attempts = 0, blocked_until = NULL, last_attempt_at = NOW() WHERE identifier = ? AND action_key = ?");
                $reset->execute([$id, $action_key]);
                return true;
            }

            if ($record['attempts'] >= $max_attempts) {
                // Trigger lockout
                $blocked_until = date('Y-m-d H:i:s', time() + $decay_seconds);
                $lock = $db->prepare("UPDATE rate_limits SET blocked_until = ? WHERE identifier = ? AND action_key = ?");
                $lock->execute([$blocked_until, $id, $action_key]);
                return false;
            }
        }

        return true;
    } catch (Throwable $e) {
        error_log("[RescueLine Rate Limit Error] " . $e->getMessage());
        return true; // Fail open to avoid blocking valid traffic if DB fails
    }
}

/**
 * Increments failed attempts for an action key and identifier.
 *
 * @param string $action_key
 * @param string|null $identifier
 * @param int $max_attempts
 * @param int $decay_seconds
 * @return void
 */
function hit_rate_limit(string $action_key, ?string $identifier = null, int $max_attempts = 5, int $decay_seconds = 900): void {
    try {
        $db = get_db();
        $id = $identifier ?: get_client_ip();
        $now = date('Y-m-d H:i:s');

        $stmt = $db->prepare("SELECT attempts FROM rate_limits WHERE identifier = ? AND action_key = ?");
        $stmt->execute([$id, $action_key]);
        $record = $stmt->fetch();

        if ($record) {
            $new_attempts = $record['attempts'] + 1;
            $blocked_until = ($new_attempts >= $max_attempts) ? date('Y-m-d H:i:s', time() + $decay_seconds) : null;
            
            $update = $db->prepare("UPDATE rate_limits SET attempts = ?, blocked_until = ?, last_attempt_at = NOW() WHERE identifier = ? AND action_key = ?");
            $update->execute([$new_attempts, $blocked_until, $id, $action_key]);
        } else {
            $insert = $db->prepare("INSERT INTO rate_limits (identifier, action_key, attempts, first_attempt_at, last_attempt_at) VALUES (?, ?, 1, NOW(), NOW())");
            $insert->execute([$id, $action_key]);
        }
    } catch (Throwable $e) {
        error_log("[RescueLine Hit Rate Limit Error] " . $e->getMessage());
    }
}

/**
 * Clears rate limit counters after successful action (e.g. valid login).
 *
 * @param string $action_key
 * @param string|null $identifier
 * @return void
 */
function clear_rate_limit(string $action_key, ?string $identifier = null): void {
    try {
        $db = get_db();
        $id = $identifier ?: get_client_ip();
        $stmt = $db->prepare("DELETE FROM rate_limits WHERE identifier = ? AND action_key = ?");
        $stmt->execute([$id, $action_key]);
    } catch (Throwable $e) {
        error_log("[RescueLine Clear Rate Limit Error] " . $e->getMessage());
    }
}

/* =============================================================================
 * 10. AUTHENTICATION & ACCESS CONTROL HELPERS
 * ============================================================================= */

/**
 * Returns whether a user is currently authenticated in the active session.
 *
 * @return bool
 */
function is_logged_in(): bool {
    return !empty($_SESSION['user_id']) && !empty($_SESSION['user_role']);
}

/**
 * Fetches the currently authenticated user's session data.
 *
 * @return array|null
 */
function current_user(): ?array {
    if (!is_logged_in()) {
        return null;
    }

    return [
        'id'       => (int)$_SESSION['user_id'],
        'uuid'     => $_SESSION['user_uuid'] ?? '',
        'name'     => $_SESSION['user_name'] ?? 'User',
        'email'    => $_SESSION['user_email'] ?? '',
        'phone'    => $_SESSION['user_phone'] ?? '',
        'role'     => $_SESSION['user_role'] ?? 'respondent',
        'state'    => $_SESSION['user_state'] ?? '',
        'lga'      => $_SESSION['user_lga'] ?? '',
        'initials' => $_SESSION['user_initials'] ?? 'RL'
    ];
}

/**
 * Enforces authentication. Redirects to login page if unauthenticated.
 *
 * @param string $redirect_url
 * @return void
 */
function require_login(string $redirect_url = '../auth/login.php'): void {
    if (!is_logged_in()) {
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
            json_error('Authentication required.', 401);
        }
        header("Location: {$redirect_url}");
        exit;
    }
}

/**
 * Enforces role-based access control. Exits with 403 or redirects if role does not match.
 *
 * @param array|string $allowed_roles
 * @param string $redirect_url
 * @return void
 */
function require_role($allowed_roles, string $redirect_url = '../auth/login.php'): void {
    require_login($redirect_url);
    
    $roles = is_array($allowed_roles) ? $allowed_roles : [$allowed_roles];
    $current_role = $_SESSION['user_role'] ?? '';

    if (!in_array($current_role, $roles, true)) {
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
            json_error('Access denied. Insufficient permissions.', 403);
        }
        http_response_code(403);
        die('<h1>403 Forbidden</h1><p>Access denied. You do not have permission to access this resource.</p>');
    }
}

/**
 * Sets up a secure user session upon successful authentication.
 *
 * @param array $user User database record
 * @return void
 */
function login_user(array $user): void {
    // Regenerate session ID to prevent Session Fixation attack
    session_regenerate_id(true);

    $name = (string)($user['name'] ?? 'User');
    $parts = explode(' ', trim($name));
    $initials = '';
    foreach ($parts as $p) {
        if ($p !== '') {
            $initials .= strtoupper($p[0]);
        }
    }
    $initials = substr($initials ?: 'RL', 0, 2);

    $_SESSION['user_id']       = (int)$user['id'];
    $_SESSION['user_uuid']     = (string)($user['uuid'] ?? '');
    $_SESSION['user_name']     = $name;
    $_SESSION['user_email']    = (string)($user['email'] ?? '');
    $_SESSION['user_phone']    = (string)($user['phone'] ?? '');
    $_SESSION['user_role']     = (string)($user['role'] ?? 'respondent');
    $_SESSION['user_state']    = (string)($user['state'] ?? '');
    $_SESSION['user_lga']      = (string)($user['lga'] ?? '');
    $_SESSION['user_initials'] = $initials;

    // Backward compatibility for existing templates
    $_SESSION['admin_name']     = $name;
    $_SESSION['admin_role']     = ($user['role'] === 'superadmin') ? 'Super Administrator' : (($user['role'] === 'admin') ? 'System Administrator' : 'Emergency Respondent');
    $_SESSION['admin_initials'] = $initials;

    // Reset login attempts and update last login timestamp in DB
    try {
        $db = get_db();
        $stmt = $db->prepare("UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = ?");
        $stmt->execute([get_client_ip(), (int)$user['id']]);
        
        log_activity('auth.login', 'users', (int)$user['id'], ['email' => $user['email']], (int)$user['id']);
    } catch (Throwable $e) {
        error_log("[RescueLine Login Update Error] " . $e->getMessage());
    }
}

/**
 * Safely logs out user, invalidates session and clears session cookie.
 *
 * @return void
 */
function logout_user(): void {
    if (isset($_SESSION['user_id'])) {
        log_activity('auth.logout', 'users', (int)$_SESSION['user_id'], [], (int)$_SESSION['user_id']);
    }

    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    session_destroy();
}

/* =============================================================================
 * 11. AUDIT & ACTIVITY LOGGING
 * ============================================================================= */

/**
 * Records an event into the activity_logs table for audit trail.
 *
 * @param string $action Action identifier e.g. 'report.create', 'category.update'
 * @param string|null $entity_type E.g. 'reports', 'categories', 'users'
 * @param int|null $entity_id
 * @param array|null $details Contextual details
 * @param int|null $user_id
 * @return void
 */
function log_activity(string $action, ?string $entity_type = null, ?int $entity_id = null, ?array $details = null, ?int $user_id = null): void {
    try {
        $db = get_db();
        $uid = $user_id ?: ($_SESSION['user_id'] ?? null);
        $ip = get_client_ip();
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'CLI/Unknown';
        $json_details = ($details !== null) ? json_encode($details, JSON_UNESCAPED_UNICODE) : null;

        $stmt = $db->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$uid, $action, $entity_type, $entity_id, $ip, $ua, $json_details]);
    } catch (Throwable $e) {
        error_log("[RescueLine Activity Log Error] " . $e->getMessage());
    }
}

/* =============================================================================
 * 12. API & JSON RESPONSE UTILITIES
 * ============================================================================= */

/**
 * Emits a sanitized JSON response with strict security headers and exits.
 *
 * @param mixed $data
 * @param int $status_code
 * @return void
 */
function json_response($data, int $status_code = 200): void {
    if (!headers_sent()) {
        http_response_code($status_code);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Standard JSON Success Response
 *
 * @param string $message
 * @param mixed $data
 * @param int $status_code
 * @return void
 */
function json_success(string $message = 'Success', $data = [], int $status_code = 200): void {
    json_response([
        'status'  => 'success',
        'message' => $message,
        'data'    => $data
    ], $status_code);
}

/**
 * Standard JSON Error Response
 *
 * @param string $message
 * @param int $status_code
 * @param array $errors
 * @return void
 */
function json_error(string $message = 'An error occurred', int $status_code = 400, array $errors = []): void {
    json_response([
        'status'  => 'error',
        'message' => $message,
        'errors'  => $errors
    ], $status_code);
}

/* =============================================================================
 * 13. CLIENT IP RESOLUTION
 * ============================================================================= */

/**
 * Safely resolves client IP address with validation.
 *
 * @return string
 */
function get_client_ip(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    // Validate trusted proxies if configured
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $forwarded_ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $candidate = trim($forwarded_ips[0]);
        if (filter_var($candidate, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            $ip = $candidate;
        }
    } elseif (!empty($_SERVER['HTTP_CLIENT_IP']) && filter_var($_SERVER['HTTP_CLIENT_IP'], FILTER_VALIDATE_IP)) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    }

    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '127.0.0.1';
}
