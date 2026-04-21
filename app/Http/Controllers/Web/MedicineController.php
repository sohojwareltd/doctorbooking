<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class MedicineController extends Controller
{
    /** GET /doctor/medicines */
    public function index(): Response
    {
        return Inertia::render('doctor/Medicines');
    }
}
