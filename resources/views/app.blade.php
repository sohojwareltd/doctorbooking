<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            $appName = config('app.name', 'Doctor Booking');
            $metaTitle = $appName;
            $metaDescription = 'Book appointments, manage prescriptions, and stay connected with your doctor.';
            $metaUrl = url()->current();
            $metaImage = asset('favicon.ico');

            $cachedDoctorImage = \Illuminate\Support\Facades\Cache::remember(
                'meta:doctor_profile_image',
                now()->addMinutes(30),
                function () {
                    if (!\Illuminate\Support\Facades\Schema::hasTable('users')) {
                        return null;
                    }

                    $doctorUser = \App\Models\User::query()
                        ->with('doctorProfile')
                        ->whereHas('role', fn ($q) => $q->where('name', 'doctor'))
                        ->first();

                    return $doctorUser?->doctorProfile?->profile_picture
                        ? asset('storage/' . $doctorUser->doctorProfile->profile_picture)
                        : null;
                }
            );

            if ($cachedDoctorImage) {
                $metaImage = $cachedDoctorImage;
            }
        @endphp

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="x-csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="{{ $metaDescription }}">
        <meta name="robots" content="index,follow">

        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ $appName }}">
        <meta property="og:title" content="{{ $metaTitle }}">
        <meta property="og:description" content="{{ $metaDescription }}">
        <meta property="og:url" content="{{ $metaUrl }}">
        <meta property="og:image" content="{{ $metaImage }}">

        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $metaTitle }}">
        <meta name="twitter:description" content="{{ $metaDescription }}">
        <meta name="twitter:image" content="{{ $metaImage }}">

        <link rel="canonical" href="{{ $metaUrl }}">
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
        <link rel="apple-touch-icon" href="{{ asset('favicon.ico') }}">

        <title inertia>{{ config('app.name', 'Doctor Booking') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @if(app()->environment('local'))
            @viteReactRefresh
            @vite('frontend/src/main.jsx')
        @else
            @php
                $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
                $entry = $manifest['frontend/src/main.jsx'] ?? null;
            @endphp
            @if($entry)
                @foreach($entry['css'] ?? [] as $css)
                    <link rel="stylesheet" href="{{ asset('build/' . $css) }}">
                @endforeach
                <script type="module" src="{{ asset('build/' . $entry['file']) }}"></script>
            @endif
        @endif
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
