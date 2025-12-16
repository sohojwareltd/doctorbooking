<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    /**
     * Store a public booking request (no auth required).
     */
    public function storePublic(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255'],
            'date' => ['required', 'date'],
            'time' => ['required'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        // Ensure there is a doctor to assign appointments to
        $doctor = User::where('role', 'doctor')->first();
        if (!$doctor) {
            return back()->withErrors(['booking' => 'No doctor is configured yet. Please contact support.'])->withInput();
        }

        // Find or create the user by email
        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make(Str::random(16)),
                'role' => 'user',
                'phone' => $validated['phone'],
            ]);
        }

        Appointment::create([
            'user_id' => $user->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $validated['date'],
            'appointment_time' => $validated['time'],
            'status' => 'pending',
            'symptoms' => $validated['message'] ?? null,
            'notes' => null,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Your appointment request has been submitted. We will contact you shortly.',
            ]);
        }

        return back()->with('success', 'Your appointment request has been submitted. We will contact you shortly.');
    }

    /**
     * Get available time slots for a specific date.
     */
    public function getAvailableSlots(Request $request, $date)
    {
        $doctor = User::where('role', 'doctor')->first();
        if (!$doctor) {
            return response()->json(['slots' => []]);
        }

        // Define all possible time slots (9 AM to 5 PM)
        $allSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00'
        ];

        // Get booked appointments for this date
        $bookedSlots = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $date)
            ->pluck('appointment_time')
            ->map(fn($time) => substr($time, 0, 5))
            ->toArray();

        // Filter out booked slots
        $availableSlots = array_values(array_diff($allSlots, $bookedSlots));

        return response()->json([
            'slots' => $availableSlots,
            'date' => $date,
        ]);
    }

    /**
     * Update appointment status (doctor/admin only).
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $request->validate([
            'status' => ['required', Rule::in(['pending','approved','completed','cancelled'])],
        ]);

        $user = Auth::user();
        if (!$user || !in_array($user->role, ['doctor','admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'doctor' && $appointment->doctor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment->update(['status' => $request->string('status')]);

        return response()->json([
            'status' => 'success',
            'message' => 'Appointment status updated.',
        ]);
    }
<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'date' => 'required|date|after:today',
            'time' => 'required|string',
            'message' => 'nullable|string|max:1000',
        ]);

        Appointment::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'appointment_date' => $validated['date'],
            'appointment_time' => $validated['time'],
            'notes' => $validated['message'] ?? null,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Appointment request submitted successfully! We will contact you shortly.');
    }
}
