<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Events\Registered;
use App\Listeners\LinkGuestAppointments;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Link guest appointments to user account when they register
        \Illuminate\Support\Facades\Event::listen(
            Registered::class,
            LinkGuestAppointments::class
        );
    }
}
