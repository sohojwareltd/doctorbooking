<?php

namespace App\Console\Commands;

use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LinkCategoryToExistingMedicines extends Command
{
    protected $signature = 'link:categories-to-medicines';

    protected $description = 'Import categories from medine_olds and link them to existing medicines';

    public function handle(): void
    {
        $this->info('Importing categories from medine_olds...');

        $oldCategories = DB::connection('mysql2')
            ->table('categories')
            ->select('id', 'name', 'image')
            ->get();

        $categoryIdMap = [];

        foreach ($oldCategories as $oldCategory) {
            $category = Category::firstOrCreate(
                ['name' => $oldCategory->name],
                ['image' => $oldCategory->image]
            );

            $categoryIdMap[$oldCategory->id] = $category->id;
        }

        $this->info('Imported ' . count($categoryIdMap) . ' categories.');
        $this->info('Building product-to-category map...');

        DB::statement('CREATE TEMPORARY TABLE IF NOT EXISTS medicine_category_map (
            name VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
            strength VARCHAR(255) NOT NULL DEFAULT \'\' COLLATE utf8mb4_unicode_ci,
            category_id BIGINT UNSIGNED NOT NULL,
            PRIMARY KEY (name, strength)
        )');

        DB::table('medicine_category_map')->truncate();

        $inserted = 0;

        DB::connection('mysql2')
            ->table('products')
            ->select('name', 'strength', 'category_id')
            ->whereNotNull('category_id')
            ->orderBy('id')
            ->chunk(1000, function ($products) use ($categoryIdMap, &$inserted) {
                $rows = [];

                foreach ($products as $product) {
                    $categoryId = $categoryIdMap[$product->category_id] ?? null;

                    if (! $categoryId) {
                        continue;
                    }

                    $rows[] = [
                        'name' => $product->name,
                        'strength' => $product->strength ?? '',
                        'category_id' => $categoryId,
                    ];
                }

                if ($rows !== []) {
                    DB::table('medicine_category_map')->insertOrIgnore($rows);
                    $inserted += count($rows);
                }
            });

        $this->info("Prepared {$inserted} product category mappings.");
        $this->info('Updating medicines in bulk...');

        $updatedCount = DB::update('
            UPDATE medicines m
            INNER JOIN medicine_category_map map
                ON map.name = m.name
                AND map.strength = COALESCE(m.strength, \'\')
            SET m.category_id = map.category_id
        ');

        DB::statement('DROP TEMPORARY TABLE IF EXISTS medicine_category_map');

        $this->info("Updated {$updatedCount} medicines with category information.");
        $this->info('Category linking completed successfully.');
    }
}
