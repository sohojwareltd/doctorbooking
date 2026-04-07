<?php

namespace App\Actions\Fortify;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a new patient (default role) user.
     * Accepts email OR phone — stores whichever is provided as username.
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name'     => ['required', 'string', 'max:255'],
            // Accept email or phone — at least one required
            'email'    => ['nullable', 'email', 'max:255'],
            'phone'    => ['nullable', 'string', 'max:50'],
            'password' => $this->passwordRules(),
        ])->after(function ($validator) use ($input) {
            if (empty($input['email']) && empty($input['phone'])) {
                $validator->errors()->add('email', 'Provide an email address or phone number.');
            }
        })->validate();

        // Derive username: email preferred, else phone
        $username = ! empty($input['email']) ? $input['email'] : $input['phone'];

        // Validate uniqueness
        Validator::make(['username' => $username], [
            'username' => ['required', 'unique:users,username'],
        ])->validateWithBag('createNewUser');

        $patientRole = Role::where('name', 'patient')->first();

        return User::create([
            'name'     => $input['name'],
            'username' => $username,
            'email'    => ! empty($input['email']) ? $input['email'] : null,
            'phone'    => ! empty($input['phone']) ? $input['phone'] : null,
            'password' => $input['password'],
            'role_id'  => $patientRole?->id,
        ]);
    }
}
