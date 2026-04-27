<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PasswordOtpController extends Controller
{
    private const OTP_TTL_SECONDS = 300;

    private const OTP_MAX_ATTEMPTS = 5;

    public function send(Request $request, SmsService $smsService): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\\d{11}$/'],
        ]);

        $normalizedPhone = $this->normalizePhone($validated['phone']);
        $user = $this->findUserByPhone($normalizedPhone);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found for this phone number.',
            ], 404);
        }

        $otp = (string) random_int(100000, 999999);
        $cacheKey = $this->cacheKey($normalizedPhone);

        Cache::put($cacheKey, [
            'user_id' => $user->id,
            'otp_hash' => Hash::make($otp),
            'attempts' => 0,
            'expires_at' => now()->addSeconds(self::OTP_TTL_SECONDS)->timestamp,
        ], now()->addSeconds(self::OTP_TTL_SECONDS));

        $smsResult = $smsService->send(
            $user->phone ?: '+88'.$normalizedPhone,
            "Your DoctorBooking password reset OTP is {$otp}. It will expire in 5 minutes."
        );

        if (! ($smsResult['success'] ?? false)) {
            Cache::forget($cacheKey);

            return response()->json([
                'success' => false,
                'message' => $smsResult['message'] ?? 'OTP SMS could not be sent. Please try again.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully. Please check your phone.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\\d{11}$/'],
            'otp' => ['required', 'string', 'regex:/^\\d{6}$/'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $normalizedPhone = $this->normalizePhone($validated['phone']);
        $cacheKey = $this->cacheKey($normalizedPhone);
        $payload = Cache::get($cacheKey);

        if (! $payload || (int) ($payload['expires_at'] ?? 0) < now()->timestamp) {
            Cache::forget($cacheKey);

            return response()->json([
                'success' => false,
                'message' => 'OTP has expired. Please request a new OTP.',
            ], 422);
        }

        $attempts = (int) ($payload['attempts'] ?? 0);

        if (! Hash::check($validated['otp'], $payload['otp_hash'] ?? '')) {
            $attempts++;

            if ($attempts >= self::OTP_MAX_ATTEMPTS) {
                Cache::forget($cacheKey);

                return response()->json([
                    'success' => false,
                    'message' => 'Too many invalid OTP attempts. Please request a new OTP.',
                ], 422);
            }

            $payload['attempts'] = $attempts;
            Cache::put($cacheKey, $payload, now()->addSeconds(max(30, $payload['expires_at'] - now()->timestamp)));

            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP. Please try again.',
            ], 422);
        }

        $user = User::find($payload['user_id'] ?? 0);

        if (! $user) {
            Cache::forget($cacheKey);

            return response()->json([
                'success' => false,
                'message' => 'Account not found. Please contact support.',
            ], 404);
        }

        $user->forceFill([
            'password' => $validated['password'],
            'remember_token' => Str::random(60),
        ])->save();

        Cache::forget($cacheKey);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successful. You can log in now.',
        ]);
    }

    private function cacheKey(string $normalizedPhone): string
    {
        return 'password_reset_otp:'.$normalizedPhone;
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '88') && strlen($digits) > 11) {
            $digits = substr($digits, 2);
        }

        if (strlen($digits) === 10) {
            $digits = '0'.$digits;
        }

        return $digits;
    }

    private function findUserByPhone(string $normalizedPhone): ?User
    {
        $candidates = array_values(array_unique([
            $normalizedPhone,
            '88'.$normalizedPhone,
            '+88'.$normalizedPhone,
        ]));

        return User::whereIn('phone', $candidates)->first();
    }
}
