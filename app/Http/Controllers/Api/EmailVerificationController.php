<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Signed email verification for mobile / JSON clients (no session required).
 */
class EmailVerificationController extends Controller
{
    public function __invoke(Request $request, int $id, string $hash): JsonResponse
    {
        if (! $request->hasValidSignature()) {
            return response()->json(['message' => 'Invalid or expired link.'], 403);
        }

        $user = User::query()->find($id);
        if (! $user || ! $user->getEmailForVerification()) {
            return response()->json(['message' => 'Invalid verification link.'], 404);
        }

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified();

        return response()->json(['message' => 'Email verified successfully.']);
    }
}
