<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    
    /** GET /doctor/appointments */
    public function doctorIndex(): Response
    {
        return Inertia::render('doctor/Appointments');
    }


    /** GET /patient/appointments */
    public function patientIndex(): Response
    {
        return Inertia::render('user/Appointments');
    }

    /** GET /patient/book-appointment */
    public function patientBookView(): Response
    {
        return Inertia::render('user/BookAppointment');
    }


    /** GET /compounder/appointments */
    public function compoundIndex(): Response
    {
        return Inertia::render('admin/Appointments');
    }

    /** GET /compounder/book-appointment */
    public function compoundBookView(): Response
    {
        return Inertia::render('admin/BookAppointment');
    }
}
