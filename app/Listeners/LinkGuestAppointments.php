<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Registered;
use App\Models\Appointment;

class LinkGuestAppointments
{
    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        $user = $event->user;
        
        // Link all guest appointments with same email to this user account
        Appointment::where('email', $user->email)
            ->whereNull('user_id')
            ->where('is_guest', true)
            ->update([
                'user_id' => $user->id,
                'is_guest' => false,
            ]);
    }
}
