<?php
/**
 * RescueLine - SMS Message Templates & Builder
 */

declare(strict_types=1);

/**
 * Returns formatted SMS content for system events.
 *
 * @param string $template_key
 * @param array $params
 * @return string
 */
function get_sms_template(string $template_key, array $params = []): string {
    $templates = [
        'report_received' => "RescueLine: Emergency report {report_code} received ({category}) at {location}. Emergency teams are being dispatched.",
        'respondent_assigned' => "RescueLine ALERT: You have been assigned to incident {report_code} ({category}) at {location}. Contact: {phone}. Respond ASAP.",
        'status_responding' => "RescueLine Update: Incident {report_code} - Responders are en route to {location}.",
        'status_resolved' => "RescueLine Update: Emergency {report_code} at {location} has been marked as resolved. Thank you for reporting.",
        'otp_verification' => "Your RescueLine security verification code is {otp}. Valid for 10 minutes."
    ];

    $text = $templates[$template_key] ?? ($params['message'] ?? '');

    foreach ($params as $key => $value) {
        $text = str_replace('{' . $key . '}', (string)$value, $text);
    }

    return $text;
}
