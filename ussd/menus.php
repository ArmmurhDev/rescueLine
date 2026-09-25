<?php
/**
 * RescueLine - USSD Menus and Prompt Definitions
 */

declare(strict_types=1);

/**
 * Returns formatted USSD menu text.
 *
 * @param string $menu_key
 * @param array $extra
 * @return string
 */
function get_ussd_menu(string $menu_key, array $extra = []): string {
    switch ($menu_key) {
        case 'main':
            return "CON Welcome to RescueLine Emergency 24/7\nSelect Emergency Type:\n1. Fire Outbreak\n2. Road Accident\n3. Medical Emergency\n4. Security Threat\n5. Flood & Disaster\n6. Other Emergency";

        case 'select_state':
            return "CON Select Incident State:\n1. Kaduna\n2. Kano\n3. FCT Abuja\n4. Lagos\n5. Rivers\n6. Plateau\n7. Other State";

        case 'enter_lga':
            $state = $extra['state'] ?? 'Selected State';
            return "CON Location in {$state}:\nEnter nearest LGA or landmark description:";

        case 'confirm':
            $cat = $extra['category_name'] ?? 'Emergency';
            $state = $extra['state'] ?? '';
            $lga = $extra['lga'] ?? '';
            return "CON Confirm Emergency Details:\nType: {$cat}\nLocation: {$lga}, {$state}\n\n1. Send Emergency Alert Now\n2. Cancel";

        case 'success':
            $code = $extra['report_code'] ?? 'RL-0000';
            return "END RescueLine Alert Received!\nIncident Ref: {$code}\nEmergency teams in your area have been alerted. Stay safe.";

        case 'cancelled':
            return "END RescueLine emergency reporting cancelled. Stay safe.";

        case 'invalid':
        default:
            return "END Invalid option selected. Please redial *384*911# to report an emergency.";
    }
}
