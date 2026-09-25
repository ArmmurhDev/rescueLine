<?php
/**
 * RescueLine - USSD Webhook Gateway Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';
require_once __DIR__ . '/handler.php';

if (!headers_sent()) {
    header('Content-Type: text/plain; charset=utf-8');
}

// Read USSD parameters (supports POST and GET from Africa's Talking / Hubtel / Twilio / Simulators)
$sessionId   = (string)($_POST['sessionId'] ?? $_GET['sessionId'] ?? '');
$serviceCode = (string)($_POST['serviceCode'] ?? $_GET['serviceCode'] ?? '*384*911#');
$phoneNumber = (string)($_POST['phoneNumber'] ?? $_GET['phoneNumber'] ?? '');
$text        = (string)($_POST['text'] ?? $_GET['text'] ?? '');

if (empty($sessionId) || empty($phoneNumber)) {
    echo "END Invalid USSD request parameters.";
    exit;
}

$response = handle_ussd_request($sessionId, $serviceCode, $phoneNumber, $text);
echo $response;
