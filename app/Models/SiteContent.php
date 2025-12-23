<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property string $key
 * @property array|null $value
 */

class SiteContent extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public static function normalizeValue(mixed $value): mixed
    {
        if (is_array($value)) {
            foreach ($value as $k => $v) {
                $value[$k] = self::normalizeValue($v);
            }
            return $value;
        }

        if (is_string($value)) {
            return self::normalizeUrlString($value);
        }

        return $value;
    }

    private static function normalizeUrlString(string $value): string
    {
        $trimmed = trim($value);
        if ($trimmed === '') return $value;

        $normalized = str_replace('\\', '/', $trimmed);

        // Already a clean web path.
        if (str_starts_with($normalized, '/site-content/')) {
            return $normalized;
        }

        // If user pasted a relative path without leading slash.
        if (str_starts_with($normalized, 'site-content/')) {
            return '/'.$normalized;
        }

        // Convert any absolute Windows path (or copied server path) pointing to public/site-content.
        // Examples:
        // - D:/laragon/www/doctorbooking/public/site-content/x.jpg
        // - /var/www/.../public/site-content/x.jpg
        // - public/site-content/x.jpg
        if (preg_match('~(?:^|/)(?:public/)?site-content/(.+)$~i', $normalized, $m)) {
            return '/site-content/'.$m[1];
        }
        if (preg_match('~^[a-zA-Z]:/.*/public/site-content/(.+)$~', $normalized, $m)) {
            return '/site-content/'.$m[1];
        }
        if (preg_match('~^[a-zA-Z]:/.*/storage/app/public/site-content/(.+)$~', $normalized, $m)) {
            return '/site-content/'.$m[1];
        }

        // Keep legacy storage URLs; Apache rewrite handles /storage/site-content/*.
        if (str_starts_with($normalized, '/storage/site-content/')) {
            return $normalized;
        }

        return $value;
    }
}
