<?php
/**
 * RescueLine - Secure Authentication Login Portal
 * Features: CSRF protection, IP/Account Rate Limiting, Input Sanitization, Secure Password Verification
 */

require_once __DIR__ . '/../inc/config.php';

// If already authenticated, redirect to respective dashboard
if (is_logged_in()) {
    $role = $_SESSION['user_role'] ?? 'respondent';
    if (in_array($role, ['admin', 'superadmin'], true)) {
        header('Location: ../admin/index.php');
    } else {
        header('Location: ../respondant/dashboard.php');
    }
    exit;
}

$error_message = '';
$email_value = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Verify CSRF Token
    if (!verify_csrf_token()) {
        $error_message = 'Security token expired. Please try again.';
    } else {
        $client_ip = get_client_ip();

        // 2. Rate Limiting Check (Anti-Brute Force Shield)
        $max_attempts = (int)env('RATE_LIMIT_LOGIN_ATTEMPTS', 5);
        $lockout_sec  = ((int)env('RATE_LIMIT_LOCKOUT_MINUTES', 15)) * 60;

        if (!check_rate_limit('login', $client_ip, $max_attempts, $lockout_sec)) {
            $error_message = "Too many failed login attempts. For security reasons, please wait 15 minutes before trying again.";
        } else {
            // 3. Input Sanitization
            $email = sanitize_email($_POST['email'] ?? '');
            $password = (string)($_POST['password'] ?? '');
            $email_value = e($_POST['email'] ?? '');

            if (empty($email) || empty($password)) {
                $error_message = 'Please enter both your email address and password.';
            } else {
                try {
                    $db = get_db();
                    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
                    $stmt->execute([$email]);
                    $user = $stmt->fetch();

                    if ($user && verify_password($password, $user['password_hash'], (int)$user['id'])) {
                        if ($user['status'] !== 'active') {
                            $error_message = 'This account has been deactivated or suspended. Please contact HQ.';
                        } else {
                            // Successful authentication
                            clear_rate_limit('login', $client_ip);
                            login_user($user);

                            // Redirect based on role
                            if (in_array($user['role'], ['admin', 'superadmin'], true)) {
                                header('Location: ../admin/index.php');
                            } else {
                                header('Location: ../respondant/dashboard.php');
                            }
                            exit;
                        }
                    } else {
                        // Failed authentication
                        hit_rate_limit('login', $client_ip, $max_attempts, $lockout_sec);
                        log_activity('auth.login_failed', 'users', null, ['email' => $email, 'ip' => $client_ip]);
                        $error_message = 'Invalid email address or password.';
                    }
                } catch (Throwable $e) {
                    error_log("[RescueLine Login Exception] " . $e->getMessage());
                    $error_message = 'A system error occurred. Please try again later.';
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RescueLine • Secure Login</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --bg: #0b0f19;
            --card-bg: rgba(22, 29, 47, 0.75);
            --card-border: rgba(255, 255, 255, 0.08);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent-red: #ef4444;
            --accent-glow: rgba(239, 68, 68, 0.25);
            --input-bg: #0f172a;
            --input-border: #334155;
            --focus-ring: #3b82f6;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }
        body {
            background-color: var(--bg);
            background-image: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0b0f19 75%);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            backdrop-filter: blur(16px);
            padding: 40px;
            width: 100%;
            max-width: 440px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px var(--accent-glow);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 28px;
            justify-content: center;
        }
        .brand-icon {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
        }
        .brand-text h1 {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            background: linear-gradient(90deg, #fff, #cbd5e1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .brand-text p {
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        .title {
            text-align: center;
            margin-bottom: 24px;
        }
        .title h2 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 6px;
        }
        .title p {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        .alert-error {
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.875rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 8px;
            color: #cbd5e1;
        }
        .input-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }
        .input-wrap i {
            position: absolute;
            left: 14px;
            color: #64748b;
            pointer-events: none;
            width: 18px;
            height: 18px;
        }
        .input-wrap input {
            width: 100%;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 10px;
            padding: 12px 14px 12px 42px;
            color: white;
            font-size: 0.925rem;
            outline: none;
            transition: all 0.2s;
        }
        .input-wrap input:focus {
            border-color: var(--focus-ring);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .btn-submit {
            width: 100%;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 14px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            margin-top: 10px;
        }
        .btn-submit:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            transform: translateY(-1px);
        }
        .credentials-box {
            margin-top: 24px;
            padding: 14px;
            border-radius: 10px;
            background: rgba(15, 23, 42, 0.6);
            border: 1px dashed rgba(255, 255, 255, 0.1);
            font-size: 0.775rem;
            color: var(--text-secondary);
        }
        .credentials-box strong {
            color: #e2e8f0;
        }
        .badge-dev {
            display: inline-block;
            background: #1e293b;
            color: #38bdf8;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 700;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>

<div class="login-card">
    <div class="brand">
        <div class="brand-icon">
            <i data-lucide="shield-alert"></i>
        </div>
        <div class="brand-text">
            <h1>RESCUELINE</h1>
            <p>Emergency Response</p>
        </div>
    </div>

    <div class="title">
        <h2>Authorized Personnel Login</h2>
        <p>Access the Incident Dispatch & Response Console</p>
    </div>

    <?php if (!empty($error_message)): ?>
        <div class="alert-error">
            <i data-lucide="alert-circle"></i>
            <span><?= e($error_message) ?></span>
        </div>
    <?php endif; ?>

    <form method="POST" action="login.php" autocomplete="off">
        <?= csrf_field() ?>

        <div class="form-group">
            <label for="email">Work Email Address</label>
            <div class="input-wrap">
                <i data-lucide="mail"></i>
                <input type="email" id="email" name="email" value="<?= $email_value ?>" placeholder="admin@rescueline.ng" required autofocus />
            </div>
        </div>

        <div class="form-group">
            <label for="password">Security Password</label>
            <div class="input-wrap">
                <i data-lucide="lock"></i>
                <input type="password" id="password" name="password" placeholder="••••••••••••" required />
            </div>
        </div>

        <button type="submit" class="btn-submit">
            <i data-lucide="log-in"></i>
            <span>Authenticate Session</span>
        </button>
    </form>

    <div class="credentials-box">
        <span class="badge-dev">DEFAULT CREDENTIALS</span>
        <div><strong>Admin:</strong> admin@rescueline.ng / <code>Admin@Rescue2026!</code></div>
        <div><strong>Respondent:</strong> musa.ibrahim@rescueline.ng / <code>Respondent@2026!</code></div>
    </div>
</div>

<script>
    lucide.createIcons();
</script>
</body>
</html>
