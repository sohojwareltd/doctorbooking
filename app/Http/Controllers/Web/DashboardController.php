<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\DoctorUnavailableRange;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** /dashboard — role-based redirect */
    public function index(): \Illuminate\Http\RedirectResponse|Response
    {
        $user = Auth::user();
        $user?->loadMissing('role');

        if ($user?->hasRole('compounder')) {
            return redirect()->route('compounder.dashboard');
        }
        if ($user?->hasRole('doctor')) {
            return redirect()->route('doctor.dashboard');
        }
        if ($user?->hasRole('patient')) {
            return redirect()->route('patient.dashboard');
        }

        return Inertia::render('Dashboard');
    }

    /** /patient/dashboard */
    public function patient(): Response
    {
        $user = Auth::user();

        $upcomingCount      = Appointment::where('user_id', $user->id)
            ->whereDate('appointment_date', '>=', now()->toDateString())
            ->count();
        $prescriptionsCount = Prescription::where('user_id', $user->id)->count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'upcomingAppointments' => $upcomingCount,
                'prescriptions'        => $prescriptionsCount,
            ],
        ]);
    }

    /** /doctor/dashboard */
    public function doctor(): Response
    {
        $doctor = Auth::user();
        $today  = now()->toDateString();

        $todayAppointments  = Appointment::where('doctor_id', $doctor->doctorId())
            ->whereDate('appointment_date', $today)->count();
        $scheduled          = Appointment::where('doctor_id', $doctor->doctorId())
            ->where('status', 'scheduled')
            ->whereDate('appointment_date', '>=', $today)->count();
        $waitingPatients    = Appointment::where('doctor_id', $doctor->doctorId())
            ->whereDate('appointment_date', $today)
            ->whereIn('status', ['scheduled', 'arrived'])->count();
        $totalPatients      = Appointment::where('doctor_id', $doctor->doctorId())
            ->distinct('user_id')->count('user_id');
        $totalPrescriptions = Prescription::where('doctor_id', $doctor->doctorId())->count();
        $prescribedThisMonth= Appointment::where('doctor_id', $doctor->doctorId())
            ->where('status', 'prescribed')
            ->whereMonth('appointment_date', now()->month)->count();

        // In-consultation appointments (auto-heal if already have prescription)
        $inVisitCollection = Appointment::with(['user:id,name,email,phone', 'prescription:id,appointment_id'])
            ->where('doctor_id', $doctor->doctorId())
            ->where('status', 'in_consultation')
            ->whereDate('appointment_date', $today)
            ->orderBy('appointment_time')
            ->get();

        $inVisitCollection->each(function (Appointment $a) {
            if ($a->prescription) {
                $a->update(['status' => 'awaiting_tests']);
            }
        });

        $inVisitCollection = $inVisitCollection
            ->filter(fn ($a) => $a->getAttribute('status') === 'in_consultation')
            ->values();

        $inVisitAppointments = $inVisitCollection->map(fn ($a) => $this->mapAppointment($a))->values();

        // Awaiting tests
        $awaitingTestsAppointments = Appointment::with(['user:id,name,email,phone', 'prescription:id,appointment_id'])
            ->where('doctor_id', $doctor->doctorId())
            ->where('status', 'awaiting_tests')
            ->whereDate('appointment_date', $today)
            ->orderBy('appointment_time')
            ->get()
            ->map(fn ($a) => [
                'id'             => $a->id,
                'serial_no'      => $a->serial_no,
                'patient_name'   => $a->user?->name ?? $a->name,
                'patient_phone'  => $a->user?->phone ?? $a->phone,
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'symptoms'       => $a->symptoms,
                'prescription_id'=> $a->prescription?->id,
            ])->values();

        // Scheduled today
        $scheduledToday = Appointment::with(['user:id,name,email,phone'])
            ->where('doctor_id', $doctor->doctorId())
            ->whereDate('appointment_date', $today)
            ->where('status', 'scheduled')
            ->leftJoin('users', 'appointments.user_id', '=', 'users.id')
            ->orderByRaw('COALESCE(users.name, appointments.name)')
            ->orderBy('appointment_time')
            ->select('appointments.*')
            ->get()
            ->map(fn ($a) => $this->mapAppointment($a));

        // Today's schedule ranges
        $todayDow            = now()->dayOfWeek;
        $weeklyScheduleToday = DoctorScheduleRange::query()
            ->leftJoin('chambers', 'doctor_schedule_ranges.chamber_id', '=', 'chambers.id')
            ->where('doctor_schedule_ranges.doctor_id', $doctor->doctorId())
            ->where('doctor_schedule_ranges.day_of_week', $todayDow)
            ->orderBy('doctor_schedule_ranges.start_time')
            ->select([
                'doctor_schedule_ranges.id',
                'doctor_schedule_ranges.start_time',
                'doctor_schedule_ranges.end_time',
                'doctor_schedule_ranges.chamber_id',
                'chambers.name as chamber_name',
            ])
            ->get()
            ->map(fn ($r) => [
                'id'           => $r->id,
                'start_time'   => $r->start_time ? substr((string) $r->start_time, 0, 5) : null,
                'end_time'     => $r->end_time   ? substr((string) $r->end_time, 0, 5)   : null,
                'chamber_id'   => $r->chamber_id,
                'chamber_name' => $r->chamber_name,
            ])
            ->values();

        $isScheduleClosedToday = false;
        if ($weeklyScheduleToday->isEmpty()) {
            $legacy = DoctorSchedule::where('doctor_id', $doctor->doctorId())
                ->where('day_of_week', $todayDow)->first();

            if ($legacy?->is_closed) {
                $isScheduleClosedToday = true;
            } elseif ($legacy?->start_time && $legacy?->end_time) {
                $weeklyScheduleToday = collect([[
                    'id'           => 'legacy-' . $todayDow,
                    'start_time'   => substr((string) $legacy->start_time, 0, 5),
                    'end_time'     => substr((string) $legacy->end_time, 0, 5),
                    'chamber_id'   => null,
                    'chamber_name' => null,
                ]]);
            }
        }

        // Unavailable ranges
        $unavailableRanges = DoctorUnavailableRange::where('doctor_id', $doctor->doctorId())
            ->whereDate('end_date', '>=', $today)
            ->orderBy('start_date')
            ->limit(12)
            ->get()
            ->map(fn ($r) => [
                'id'         => $r->id,
                'start_date' => $r->start_date?->toDateString(),
                'end_date'   => $r->end_date?->toDateString(),
            ])->values();

        // Recent appointments (last 7 days)
        $recentAppointments = Appointment::with(['user:id,name,email,phone'])
            ->where('doctor_id', $doctor->doctorId())
            ->where('appointment_date', '>=', now()->subDays(7))
            ->orderByDesc('appointment_date')
            ->limit(5)
            ->get()
            ->map(fn ($a) => $this->mapAppointment($a));

        // Next upcoming appointment
        $upcomingRaw = Appointment::with(['user:id,name,email,phone'])
            ->where('doctor_id', $doctor->doctorId())
            ->where('appointment_date', '>=', $today)
            ->whereIn('status', ['scheduled', 'arrived'])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->first();

        $upcoming = $upcomingRaw ? $this->mapAppointment($upcomingRaw) : null;

        return Inertia::render('doctor/Dashboard', [
            'stats' => [
                'todayAppointments'  => $todayAppointments,
                'scheduled'          => $scheduled,
                'waitingPatients'    => $waitingPatients,
                'totalPatients'      => $totalPatients,
                'totalPrescriptions' => $totalPrescriptions,
                'prescribedThisMonth'=> $prescribedThisMonth,
                'inConsultation'     => $inVisitAppointments->count(),
                'followUpsDue'       => $awaitingTestsAppointments->count(),
            ],
            'scheduledToday'           => $scheduledToday,
            'weeklyScheduleToday'      => $weeklyScheduleToday,
            'isScheduleClosedToday'    => $isScheduleClosedToday,
            'recentAppointments'       => $recentAppointments,
            'upcomingAppointment'      => $upcoming,
            'inVisitAppointment'       => $inVisitAppointments->first(),
            'inVisitAppointments'      => $inVisitAppointments,
            'awaitingTestsAppointments'=> $awaitingTestsAppointments,
            'unavailableRanges'        => $unavailableRanges,
        ]);
    }

    /** /compounder/dashboard */
    public function compounder(): Response
    {
        $today = now()->toDateString();

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'users'               => User::count(),
                'patients'            => User::whereHas('role', fn ($q) => $q->where('name', 'patient'))->count(),
                'doctors'             => User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->count(),
                'appointmentsToday'   => Appointment::whereDate('appointment_date', $today)->count(),
                'scheduledAppointments' => Appointment::where('status', 'scheduled')->count(),
                'totalAppointments'   => Appointment::count(),
                'totalPrescriptions'  => Prescription::count(),
            ],
        ]);
    }

    private function mapAppointment(Appointment $a): array
    {
        return [
            'id'               => $a->id,
            'serial_no'        => $a->serial_no,
            'user_id'          => $a->user_id,
            'patient_name'     => $a->user?->name ?? $a->name,
            'patient_phone'    => $a->user?->phone ?? $a->phone,
            'patient_email'    => $a->user?->email ?? $a->email,
            'user'             => $a->user ? [
                'id'    => $a->user->id,
                'name'  => $a->user->name,
                'email' => $a->user->email,
                'phone' => $a->user->phone,
            ] : null,
            'appointment_date' => $a->appointment_date?->toDateString(),
            'appointment_time' => substr((string) $a->appointment_time, 0, 5),
            'status'           => $a->status,
            'symptoms'         => $a->symptoms,
            'type'             => $a->type ?? null,
            'is_video'         => $a->is_video ?? false,
            'prescription_id'  => $a->prescription?->id ?? null,
        ];
    }
}
