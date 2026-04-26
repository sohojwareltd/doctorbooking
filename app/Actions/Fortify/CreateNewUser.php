<?php

namespace App\Actions\Fortify;

use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a new patient (default role) user.
     * Phone is required as an 11-digit local number; email is optional.
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone'    => ['required', 'regex:/^[0-9]{11}$/', 'unique:users,phone'],
            'password' => $this->passwordRules(),
        ], [
            'phone.regex' => 'Phone number must be exactly 11 digits.',
        ])->validate();

        // Keep username aligned with the required login identifier.
        $username = $input['phone'];

        // Validate uniqueness
        Validator::make(['username' => $username], [
            'username' => ['required', 'unique:users,username'],
        ])->validateWithBag('createNewUser');

        $patientRole = Role::where('name', 'patient')->first();

        $isPhoneOnly = empty($input['email']) && ! empty($input['phone']);

        $user = User::create([
            'name'             => $input['name'],
            'username'         => $username,
            'email'            => ! empty($input['email']) ? $input['email'] : null,
            'phone'            => ! empty($input['phone']) ? $input['phone'] : null,
            'password'         => $input['password'],
            'role_id'          => $patientRole?->id,
            // Phone-only accounts have no email to verify — mark as verified immediately
            'email_verified_at' => $isPhoneOnly ? now() : null,
        ]);

        // Create an empty patient profile so the profile page is reachable immediately
        Patient::create(['user_id' => $user->id]);

        return $user;
    }
}
