<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">

        <title>@yield('code') - @yield('title') | {{ config('app.name', 'Doctor Booking') }}</title>

        <style>
            :root {
                --bg: #f4f7f6;
                --card: #ffffff;
                --line: #dbe5e2;
                --title: #123c46;
                --text: #1f2937;
                --muted: #6b7280;
                --brand: #1ea39b;
                --shadow: 0 14px 34px rgba(15, 23, 42, 0.09);
            }

            * {
                box-sizing: border-box;
            }

            html,
            body {
                margin: 0;
                min-height: 100%;
                font-family: "Montserrat", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                color: var(--text);
                background: var(--bg);
            }

            a {
                color: inherit;
            }

            .page {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .card {
                width: 100%;
                max-width: 560px;
                background: var(--card);
                border: 1px solid var(--line);
                border-radius: 16px;
                box-shadow: var(--shadow);
                overflow: hidden;
            }

            .brand-row {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 18px 20px;
                border-bottom: 1px solid var(--line);
            }

            .brand-icon-wrap {
                width: 38px;
                height: 38px;
                border-radius: 10px;
                background: linear-gradient(135deg, #123c46, var(--brand));
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .brand-icon {
                width: 20px;
                height: 20px;
                object-fit: contain;
            }

            .brand-text {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .brand-label {
                margin: 0;
                font-size: 10px;
                font-weight: 700;
                color: var(--muted);
                letter-spacing: 0.1em;
                text-transform: uppercase;
            }

            .doctor-name {
                margin: 2px 0 0;
                color: var(--title);
                font-size: 16px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .body {
                padding: 20px;
            }

            .code {
                margin: 0;
                font-size: clamp(38px, 10vw, 62px);
                line-height: 1;
                color: var(--title);
                font-weight: 700;
            }

            .message {
                margin: 8px 0 8px;
                font-size: clamp(18px, 4vw, 28px);
                line-height: 1.3;
                font-weight: 600;
                color: var(--text);
            }

            .hint {
                margin: 0;
                color: var(--muted);
                font-size: 14px;
                line-height: 1.5;
            }

            .actions {
                margin-top: 18px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 40px;
                padding: 9px 14px;
                border-radius: 8px;
                text-decoration: none;
                font-size: 13px;
                font-weight: 600;
            }

            .btn-home {
                color: #ffffff;
                background: var(--brand);
            }

            .btn-back {
                color: var(--text);
                border: 1px solid var(--line);
                background: #ffffff;
            }

            @media (max-width: 640px) {
                .page {
                    padding: 14px;
                }

                .brand-row,
                .body {
                    padding-left: 18px;
                    padding-right: 18px;
                }

                .doctor-name {
                    font-size: 16px;
                }
            }
        </style>
    </head>
    <body>
        @php
            $doctorName = config('app.name', 'Doctor Booking');
            if (\Illuminate\Support\Facades\Schema::hasTable('users') && \Illuminate\Support\Facades\Schema::hasTable('roles')) {
                $doctorUser = \App\Models\User::query()
                    ->whereHas('role', fn ($q) => $q->where('name', 'doctor'))
                    ->first();
                if ($doctorUser && filled($doctorUser->name)) {
                    $doctorName = $doctorUser->name;
                }
            }
        @endphp
        <main class="page" role="main">
            <section class="card" aria-labelledby="error-message">
                <div class="brand-row">
                    <div class="brand-icon-wrap" aria-hidden="true">
                        <img class="brand-icon" src="{{ asset('favicon.svg') }}" alt="Site icon">
                    </div>
                    <div class="brand-text">
                        <p class="brand-label">Doctor</p>
                        <p class="doctor-name">{{ $doctorName }}</p>
                    </div>
                </div>
                <div class="body">
                    <h1 class="code">@yield('code')</h1>
                    <p id="error-message" class="message">@yield('message')</p>
                    <p class="hint">Please go back or return to home page.</p>

                    <div class="actions">
                        <a class="btn btn-home" href="{{ url('/') }}">Home</a>
                        <a class="btn btn-back" href="javascript:history.back()">Go Back</a>
                    </div>
                </div>
            </section>
        </main>
    </body>
</html>
