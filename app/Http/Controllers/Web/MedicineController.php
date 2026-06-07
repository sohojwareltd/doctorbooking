<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MedicineController extends Controller
{
    /** GET /doctor/medicines */
    public function index(Request $request): Response
    {
        $query = trim((string) $request->input('query', ''));

        $builder = Medicine::query()
            ->select([
                'medicines.id',
                'medicines.name',
                'medicines.strength',
                'medicines.generic_id',
                'medicines.supplier_id',
                'generics.name as generic_name',
                'suppliers.name as supplier_name',
            ])
            ->leftJoin('generics', 'generics.id', '=', 'medicines.generic_id')
            ->leftJoin('suppliers', 'suppliers.id', '=', 'medicines.supplier_id');

        if ($query !== '') {
            $builder->where(function ($q) use ($query) {
                $q->where('medicines.name', 'like', '%' . $query . '%')
                    ->orWhere('generics.name', 'like', '%' . $query . '%')
                    ->orWhere('suppliers.name', 'like', '%' . $query . '%');
            });
        }

        $medicines = $builder
            ->orderByDesc('medicines.id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('doctor/Medicines', [
            'medicines' => $medicines,
            'filters' => [
                'query' => $query,
            ],
        ]);
    }
}
