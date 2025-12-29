<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserApiController extends Controller
{
    public function appointments(Request $request): JsonResponse
    {
        $user = $request->user();

        $rows = Appointment::where('user_id', $user->id)
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get(['id', 'doctor_id', 'appointment_date', 'appointment_time', 'status', 'symptoms']);

        return response()->json([
            'appointments' => $rows->map(fn ($a) => [
                'id' => $a->id,
                'doctor_id' => $a->doctor_id,
                'appointment_date' => $a->appointment_date?->toDateString() ?? (string) $a->appointment_date,
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
                'symptoms' => $a->symptoms,
            ])->values(),
        ]);
    }

    public function prescriptions(Request $request): JsonResponse
    {
        $user = $request->user();

        $rows = Prescription::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get(['id','doctor_id','diagnosis','medications','instructions','tests','next_visit_date','created_at']);

        return response()->json([
            'prescriptions' => $rows->map(fn ($p) => [
                'id' => $p->id,
                'doctor_id' => $p->doctor_id,
                'diagnosis' => $p->diagnosis,
                'medications' => $p->medications,
                'instructions' => $p->instructions,
                'tests' => $p->tests,
                'next_visit_date' => $p->next_visit_date?->toDateString(),
                'created_at' => $p->created_at?->toDateTimeString(),
            ])->values(),
        ]);
    }
}
