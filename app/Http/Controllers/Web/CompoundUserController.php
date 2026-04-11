<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Compounder;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CompoundUserController extends Controller
{
    /** GET /doctor/compounders */
    public function index(): Response
    {
        $compounders = User::query()
            ->whereHas('role', fn ($q) => $q->where('name', 'compounder'))
            ->with(['compoundProfile:id,user_id,designation'])
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('doctor/Compounders', [
            'compounders' => $compounders->through(fn ($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'username'    => $u->username,
                'email'       => $u->email,
                'phone'       => $u->phone,
                'designation' => $u->compoundProfile?->designation,
                'created_at'  => $u->created_at?->toDateTimeString(),
            ]),
        ]);
    }

    /** GET /doctor/compounder/create */
    public function create(): Response
    {
        return Inertia::render('doctor/CreateCompounder');
    }

    /** POST /doctor/compounder */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['nullable', 'email', 'max:255', 'unique:users,email', 'required_without:phone'],
            'phone'       => ['nullable', 'string', 'max:30', 'required_without:email'],
            'password'    => ['required', Password::min(8)],
            'designation' => ['nullable', 'string', 'max:255'],
        ], [
            'email.required_without' => 'Please provide an email or phone number.',
            'phone.required_without' => 'Please provide a phone or email address.',
        ]);

        $role = Role::where('name', 'compounder')->firstOrFail();

        $user = User::create([
            'name'              => $validated['name'],
            'username'          => $this->generateUniqueUsername($validated['name']),
            'email'             => $validated['email'] ?? null,
            'phone'             => $validated['phone'] ?? null,
            'password'          => Hash::make($validated['password']),
            'role_id'           => $role->id,
            'email_verified_at' => isset($validated['email']) ? now() : null,
        ]);

        Compounder::create([
            'user_id'     => $user->id,
            'designation' => $validated['designation'] ?? null,
        ]);

        return redirect()->route('doctor.compounder.create')
            ->with('success', 'Compounder account created successfully.');
    }

    private function generateUniqueUsername(string $name): string
    {
        $base = Str::of($name)->lower()->slug('')->value();
        if ($base === '') {
            $base = 'compounder';
        }

        $username = $base;
        $counter  = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base . $counter;
            $counter++;
        }

        return $username;
    }
}
