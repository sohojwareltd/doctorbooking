<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Doctor Booking') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

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
