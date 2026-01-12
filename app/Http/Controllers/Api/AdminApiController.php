<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminApiController extends Controller
{
    public function users(Request $request): JsonResponse
    {
        $users = User::orderByDesc('created_at')->get(['id','name','email','role','created_at','phone']);

        return response()->json([
            'users' => $users->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'phone' => $u->phone,
                'created_at' => $u->created_at?->toDateTimeString(),
            ])->values(),
        ]);
    }

    public function appointments(Request $request): JsonResponse
    {
        $rows = Appointment::with(['user:id,name', 'doctor:id,name'])
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get(['id','user_id','doctor_id','appointment_date','appointment_time','status','symptoms','name','phone','email','age','gender','is_guest']);

        return response()->json([
            'appointments' => $rows->map(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'doctor_id' => $a->doctor_id,
                'is_guest' => $a->is_guest,
                // Show user info if registered, otherwise show guest info
                'patient_name' => $a->user?->name ?? $a->name,
                'patient_phone' => $a->user?->phone ?? $a->phone,
                'patient_email' => $a->user?->email ?? $a->email,
                'patient_age' => $a->age,
                'patient_gender' => $a->gender,
                'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
                'doctor' => $a->doctor ? ['id' => $a->doctor->id, 'name' => $a->doctor->name] : null,
                'appointment_date' => $a->appointment_date?->toDateString() ?? (string) $a->appointment_date,
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
                'symptoms' => $a->symptoms,
            ])->values(),
        ]);
    }
}
