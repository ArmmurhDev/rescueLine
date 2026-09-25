<?php
/**
 * RescueLine - Secure SMS Dispatch Service
 * Features: Native Africa's Talking & Generic Gateway Support, Phone Sanitization, Audit Logging in sms_logs
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';
require_once __DIR__ . '/sms_templates.php';

/**
 * Dispatches an SMS message and records the transaction in sms_logs.
 *
 * @param string $phone_number Recipient phone number
 * @param string $message Text content
 * @param int|null $report_id Optional linked report ID
 * @return array Result [success => bool, message => string, log_id => int|null]
 */
function send_sms(string $phone_number, string $message, ?int $report_id = null): array {
    $clean_phone = sanitize_phone($phone_number);
    $clean_message = trim($message);

    if (empty($clean_phone) || empty($clean_message)) {
        return ['success' => false, 'message' => 'Invalid phone number or empty message.'];
    }

    $api_key   = (string)env('SMS_API_KEY', '');
    $api_url   = (string)env('SMS_API_URL', 'https://api.africastalking.com/version1/messaging');
    $username  = (string)env('SMS_USERNAME', 'sandbox');
    $sender_id = (string)env('SMS_SENDER_ID', 'RescueLine');
    $provider  = (string)env('SMS_PROVIDER', 'africastalking');

    $status = 'sent';
    $error_msg = null;
    $gateway_ref = null;

    // Check if API credentials exist
    if (!empty($api_key)) {
        try {
            $is_africastalking = ($provider === 'africastalking' || str_starts_with($api_key, 'atsk_'));

            $ch = curl_init();

            if ($is_africastalking) {
                // Africa's Talking API integration
                $postFields = http_build_query([
                    'username' => $username,
                    'to'       => $clean_phone,
                    'message'  => $clean_message,
                    // 'from'  => $sender_id // uncomment if custom alphanumeric sender ID is approved
                ]);

                curl_setopt_array($ch, [
                    CURLOPT_URL            => $api_url,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST           => true,
                    CURLOPT_POSTFIELDS     => $postFields,
                    CURLOPT_HTTPHEADER     => [
                        "apiKey: {$api_key}",
                        "Accept: application/json",
                        "Content-Type: application/x-www-form-urlencoded"
                    ],
                    CURLOPT_TIMEOUT        => 12,
                    CURLOPT_SSL_VERIFYPEER => true
                ]);
            } else {
                // Generic JSON API integration (BulkSMS, Twilio, etc.)
                $postData = json_encode([
                    'to'        => $clean_phone,
                    'from'      => $sender_id,
                    'body'      => $clean_message,
                    'api_token' => $api_key
                ]);

                curl_setopt_array($ch, [
                    CURLOPT_URL            => $api_url,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST           => true,
                    CURLOPT_POSTFIELDS     => $postData,
                    CURLOPT_HTTPHEADER     => [
                        'Content-Type: application/json',
                        'Accept: application/json'
                    ],
                    CURLOPT_TIMEOUT        => 12,
                    CURLOPT_SSL_VERIFYPEER => true
                ]);
            }

            $response  = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_err  = curl_error($ch);
            curl_close($ch);

            if ($curl_err) {
                $status = 'failed';
                $error_msg = 'cURL Error: ' . $curl_err;
            } elseif ($http_code >= 400) {
                $status = 'failed';
                $error_msg = "HTTP {$http_code}: " . $response;
            } else {
                $resData = json_decode((string)$response, true);
                if ($is_africastalking && isset($resData['SMSMessageData'])) {
                    $recipients = $resData['SMSMessageData']['Recipients'] ?? [];
                    if (!empty($recipients)) {
                        $gateway_ref = $recipients[0]['messageId'] ?? ('AT-' . time());
                        $status_str  = strtolower($recipients[0]['status'] ?? 'sent');
                        $status      = in_array($status_str, ['success', 'sent', 'buffered']) ? 'sent' : 'failed';
                    } else {
                        $gateway_ref = 'AT-' . time();
                    }
                } else {
                    $gateway_ref = $resData['data']['message_id'] ?? ($resData['id'] ?? 'REF-' . time());
                }
            }
        } catch (Throwable $e) {
            $status = 'failed';
            $error_msg = $e->getMessage();
        }
    } else {
        // Simulation mode for offline testing
        $gateway_ref = 'SIM-' . strtoupper(bin2hex(random_bytes(4)));
    }

    // Record transaction into database sms_logs
    try {
        $db = get_db();
        $stmt = $db->prepare("INSERT INTO sms_logs (direction, phone_number, message, status, gateway_reference, report_id, error_message, created_at) VALUES ('outbound', ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$clean_phone, $clean_message, $status, $gateway_ref, $report_id, $error_msg]);
        $log_id = (int)$db->lastInsertId();
    } catch (Throwable $e) {
        error_log("[RescueLine SMS Log Error] " . $e->getMessage());
        $log_id = null;
    }

    return [
        'success'   => ($status === 'sent'),
        'reference' => $gateway_ref,
        'log_id'    => $log_id,
        'message'   => ($status === 'sent') ? 'SMS dispatched successfully.' : ($error_msg ?: 'SMS dispatch failed.')
    ];
}
