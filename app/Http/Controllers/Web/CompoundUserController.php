<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Compounder;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
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

    /** GET /doctor/compounder/{compounder}/edit */
    public function edit(User $compounder): Response
    {
        $compounder = $this->resolveCompounder($compounder);

        return Inertia::render('doctor/EditCompounder', [
            'compounder' => [
                'id'          => $compounder->id,
                'name'        => $compounder->name,
                'username'    => $compounder->username,
                'email'       => $compounder->email,
                'phone'       => $compounder->phone,
                'designation' => $compounder->compoundProfile?->designation,
            ],
        ]);
    }

    /** POST /doctor/compounder */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateCompounder($request);

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

    /** PUT /doctor/compounder/{compounder} */
    public function update(Request $request, User $compounder): RedirectResponse
    {
        $compounder = $this->resolveCompounder($compounder);
        $validated = $this->validateCompounder($request, $compounder);

        $compounder->update([
            'name'              => $validated['name'],
            'email'             => $validated['email'] ?? null,
            'phone'             => $validated['phone'] ?? null,
            'email_verified_at' => ! empty($validated['email'])
                ? ($compounder->email_verified_at ?? now())
                : null,
        ]);

        if (! empty($validated['password'])) {
            $compounder->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        $compounder->compoundProfile()->updateOrCreate(
            ['user_id' => $compounder->id],
            ['designation' => $validated['designation'] ?? null]
        );

        return redirect()->route('doctor.compounders.index')
            ->with('success', 'Compounder account updated successfully.');
    }

    /** DELETE /doctor/compounder/{compounder} */
    public function destroy(User $compounder): RedirectResponse
    {
        $compounder = $this->resolveCompounder($compounder);

        $compounder->compoundProfile()?->delete();
        $compounder->delete();

        return redirect()->route('doctor.compounders.index')
            ->with('success', 'Compounder account deleted successfully.');
    }

    private function validateCompounder(Request $request, ?User $compounder = null): array
    {
        $emailRules = ['nullable', 'email', 'max:255', 'required_without:phone'];

        if ($compounder) {
            $emailRules[] = Rule::unique('users', 'email')->ignore($compounder->id);
        } else {
            $emailRules[] = 'unique:users,email';
        }

        $passwordRules = $compounder
            ? ['nullable', Password::min(8)]
            : ['required', Password::min(8)];

        return $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => $emailRules,
            'phone'       => ['nullable', 'string', 'max:30', 'required_without:email'],
            'password'    => $passwordRules,
            'designation' => ['nullable', 'string', 'max:255'],
        ], [
            'email.required_without' => 'Please provide an email or phone number.',
            'phone.required_without' => 'Please provide a phone or email address.',
        ]);
    }

    private function resolveCompounder(User $user): User
    {
        abort_unless($user->hasRole('compounder'), 404);

        return $user->loadMissing('compoundProfile:id,user_id,designation');
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
