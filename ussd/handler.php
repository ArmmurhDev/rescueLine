<?php
/**
 * RescueLine - USSD Request Flow Processor & State Machine
 */

declare(strict_types=1);

require_once __DIR__ . '/../inc/config.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/menus.php';

/**
 * Handles incoming USSD payload and generates CON/END response.
 *
 * @param string $sessionId
 * @param string $serviceCode
 * @param string $phoneNumber
 * @param string $text
 * @return string
 */
function handle_ussd_request(string $sessionId, string $serviceCode, string $phoneNumber, string $text): string {
    $clean_phone = sanitize_phone($phoneNumber);
    $text = trim($text);

    // Rate limiting USSD attempts by phone number
    if (!check_rate_limit('ussd_request', $clean_phone, 20, 60)) {
        return "END Too many requests. Please wait a minute before retrying.";
    }

    $inputs = ($text === '') ? [] : explode('*', $text);
    $level = count($inputs);

    $categories = [
        '1' => ['id' => 1, 'name' => 'Fire Outbreak', 'priority' => 'critical'],
        '2' => ['id' => 2, 'name' => 'Road Accident', 'priority' => 'high'],
        '3' => ['id' => 3, 'name' => 'Medical Emergency', 'priority' => 'critical'],
        '4' => ['id' => 4, 'name' => 'Security Threat', 'priority' => 'critical'],
        '5' => ['id' => 5, 'name' => 'Flood & Disaster', 'priority' => 'high'],
        '6' => ['id' => 8, 'name' => 'Other Emergency', 'priority' => 'medium']
    ];

    $states = [
        '1' => 'Kaduna',
        '2' => 'Kano',
        '3' => 'FCT Abuja',
        '4' => 'Lagos',
        '5' => 'Rivers',
        '6' => 'Plateau',
        '7' => 'Niger'
    ];

    if ($level === 0) {
        // Step 1: Main Menu
        return get_ussd_menu('main');
    }

    if ($level === 1) {
        // Step 2: User picked category
        $cat_key = $inputs[0];
        if (!isset($categories[$cat_key])) {
            return get_ussd_menu('invalid');
        }
        return get_ussd_menu('select_state');
    }

    if ($level === 2) {
        // Step 3: User picked state
        $state_key = $inputs[1];
        if (!isset($states[$state_key])) {
            return get_ussd_menu('invalid');
        }
        $state = $states[$state_key];
        return get_ussd_menu('enter_lga', ['state' => $state]);
    }

    if ($level === 3) {
        // Step 4: User entered LGA / Landmark
        $cat_key   = $inputs[0];
        $state_key = $inputs[1];
        $lga_input = sanitize_string($inputs[2]);

        $cat   = $categories[$cat_key] ?? ['name' => 'Emergency'];
        $state = $states[$state_key] ?? 'Unknown State';

        return get_ussd_menu('confirm', [
            'category_name' => $cat['name'],
            'state'         => $state,
            'lga'           => $lga_input
        ]);
    }

    if ($level === 4) {
        // Step 5: Confirmation action
        $confirm_choice = $inputs[3];
        if ($confirm_choice === '1') {
            $cat_key   = $inputs[0];
            $state_key = $inputs[1];
            $lga_input = sanitize_string($inputs[2]);

            $cat   = $categories[$cat_key] ?? ['id' => 8, 'name' => 'Emergency', 'priority' => 'high'];
            $state = $states[$state_key] ?? 'Kaduna';

            $report_code = create_ussd_report([
                'category_id'   => $cat['id'],
                'category_name' => $cat['name'],
                'priority'      => $cat['priority'],
                'reporter_name' => 'USSD Caller (' . substr($clean_phone, -4) . ')',
                'phone_number'  => $clean_phone,
                'state'         => $state,
                'lga'           => $lga_input,
                'landmark'      => $lga_input,
                'description'   => "USSD Emergency Alert for {$cat['name']} reported in {$lga_input}, {$state}."
            ]);

            return get_ussd_menu('success', ['report_code' => $report_code]);
        } else {
            return get_ussd_menu('cancelled');
        }
    }

    return get_ussd_menu('invalid');
}
