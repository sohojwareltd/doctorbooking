<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function send(string $phone, string $message): array
    {
        $config = config('services.sms', []);

        if (! (bool) ($config['enabled'] ?? false)) {
            return [
                'success' => false,
                'message' => 'SMS is disabled from configuration.',
                'status_code' => null,
                'raw' => null,
            ];
        }

        $baseUrl = trim((string) ($config['base_url'] ?? ''));
        $apiKey = trim((string) ($config['api_key'] ?? ''));
        $senderId = trim((string) ($config['sender_id'] ?? ''));

        if ($baseUrl === '' || $apiKey === '' || $senderId === '') {
            return [
                'success' => false,
                'message' => 'SMS credentials are not configured correctly.',
                'status_code' => null,
                'raw' => null,
            ];
        }

        $payload = [
            'api_key' => $apiKey,
            'type' => 'text',
            'number' => trim($phone),
            'senderid' => $senderId,
            'message' => trim($message),
        ];

        $method = strtolower((string) ($config['method'] ?? 'get'));
        $timeout = (int) ($config['timeout'] ?? 15);

        try {
            $request = Http::timeout(max($timeout, 1));

            $response = $method === 'post'
                ? $request->asForm()->post($baseUrl, $payload)
                : $request->get($baseUrl, $payload);

            $raw = trim((string) $response->body());
            $json = $response->json();

            $successful = $this->isSuccessfulResponse($response->status(), $raw, $json);

            return [
                'success' => $successful,
                'message' => $successful
                    ? 'SMS sent successfully.'
                    : 'SMS provider returned an unsuccessful response.',
                'status_code' => $response->status(),
                'raw' => $raw,
            ];
        } catch (\Throwable $e) {
            Log::error('SMS send failed.', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'SMS sending failed due to an exception.',
                'status_code' => null,
                'raw' => null,
            ];
        }
    }

    protected function isSuccessfulResponse(int $statusCode, string $raw, mixed $json): bool
    {
        if ($statusCode < 200 || $statusCode >= 300) {
            return false;
        }

        if (is_array($json)) {
            if (isset($json['status']) && in_array(strtolower((string) $json['status']), ['success', 'ok', 'sent'], true)) {
                return true;
            }

            if (isset($json['error']) && ! in_array((string) $json['error'], ['', '0'], true)) {
                return false;
            }

            if (isset($json['response_code']) && (int) $json['response_code'] >= 400) {
                return false;
            }
        }

        if ($raw !== '') {
            $lower = strtolower($raw);
            if (str_contains($lower, 'submitted') || str_contains($lower, 'success')) {
                return true;
            }
            if (str_contains($lower, 'failed') || str_contains($lower, 'error')) {
                return false;
            }
        }

        return true;
    }
}