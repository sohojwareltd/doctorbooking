<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class ReportsController extends Controller
{
    /** GET /compounder/reports */
    public function index(): Response
    {
        $recentAppointments = Appointment::with(['user:id,name', 'doctor:id,name'])
            ->orderByDesc('appointment_date')
            ->orderBy('serial_no')
            ->take(10)
            ->get()
            ->map(fn ($a) => [
                'id'               => $a->id,
                'serial_no'        => $a->serial_no,
                'patient_name'     => $a->user?->name ?? $a->name,
                'doctor_name'      => $a->doctor?->name,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'appointment_time' => $a->appointment_time,
                'status'           => $a->status,
            ]);

        return Inertia::render('admin/Reports', [
            'stats' => [
                'total_users'                  => User::count(),
                'total_appointments'           => Appointment::count(),
                'total_prescriptions'          => Prescription::count(),
                'scheduled_appointments'       => Appointment::where('status', 'scheduled')->count(),
                'arrived_appointments'         => Appointment::where('status', 'arrived')->count(),
                'in_consultation_appointments' => Appointment::where('status', 'in_consultation')->count(),
                'awaiting_tests_appointments'  => Appointment::where('status', 'awaiting_tests')->count(),
                'prescribed_appointments'      => Appointment::where('status', 'prescribed')->count(),
                'cancelled_appointments'       => Appointment::where('status', 'cancelled')->count(),
                'total_patients'               => User::whereHas('role', fn ($q) => $q->where('name', 'patient'))->count(),
                'total_doctors'                => User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->count(),
            ],
            'recent_appointments' => $recentAppointments,
        ]);
    }
}
