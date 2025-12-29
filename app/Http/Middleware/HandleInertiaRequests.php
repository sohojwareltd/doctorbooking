<?php

namespace App\Http\Middleware;

use App\Models\SiteContent;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $contactPhone = null;
        if (Schema::hasTable('site_contents')) {
            $homeContent = SiteContent::where('key', 'home')->first()?->value;
            $homeContent = SiteContent::normalizeValue($homeContent);

            $footerLines = data_get($homeContent, 'footer.contactLines', []);
            if (is_array($footerLines)) {
                foreach ($footerLines as $line) {
                    if (!is_string($line)) {
                        continue;
                    }
                    if (preg_match('/(\+?\d[\d\s().-]{6,}\d)/', $line, $m) === 1) {
                        $contactPhone = $m[1];
                        break;
                    }
                }
            }

            if (!$contactPhone) {
                $methods = data_get($homeContent, 'contact.methods', []);
                if (is_array($methods)) {
                    foreach ($methods as $method) {
                        $value = is_array($method) ? ($method['value'] ?? null) : null;
                        $icon = is_array($method) ? ($method['icon'] ?? null) : null;
                        if (($icon === 'Phone' || $icon === 'MessageCircle') && is_string($value) && preg_match('/(\+?\d[\d\s().-]{6,}\d)/', $value, $m) === 1) {
                            $contactPhone = $m[1];
                            break;
                        }
                    }
                }
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info') ?? $request->session()->get('status'),
            ],
            'site' => [
                'contactPhone' => $contactPhone,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
