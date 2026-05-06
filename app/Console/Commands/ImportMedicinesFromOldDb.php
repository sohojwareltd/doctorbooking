<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Generic;
use App\Models\Medicine;

class ImportMedicinesFromOldDb extends Command
{
    protected $signature = 'import:medicines';

    protected $description = 'Import generics and medicines from the medine_olds database into the doctor database';

    public function handle(): void
    {
        $this->info('Starting import from medine_olds database...');

        // ── Step 1: Import generics ──────────────────────────────────────────
        $this->info('Importing generics...');

        $oldGenerics = DB::connection('mysql2')
            ->table('generics')
            ->select('id', 'name', 'description')
            ->get();

        $genericIdMap = []; // old_id => new_id

        $genericsBar = $this->output->createProgressBar($oldGenerics->count());
        $genericsBar->start();

        foreach ($oldGenerics as $oldGeneric) {
            $newGeneric = Generic::firstOrCreate(
                ['name' => $oldGeneric->name],
                ['descriptions' => $oldGeneric->description]
            );
            $genericIdMap[$oldGeneric->id] = $newGeneric->id;
            $genericsBar->advance();
        }

        $genericsBar->finish();
        $this->newLine();
        $this->info("Imported {$oldGenerics->count()} generics.");

        // ── Step 2: Import medicines (products) ──────────────────────────────
        $this->info('Importing medicines from products table...');

        $oldProducts = DB::connection('mysql2')
            ->table('products')
            ->select('name', 'strength', 'generic_id')
            ->get();

        $medicinesBar = $this->output->createProgressBar($oldProducts->count());
        $medicinesBar->start();

        $imported = 0;
        $skipped  = 0;

        foreach ($oldProducts as $product) {
            $newGenericId = isset($product->generic_id, $genericIdMap[$product->generic_id])
                ? $genericIdMap[$product->generic_id]
                : null;

            $exists = Medicine::where('name', $product->name)
                ->where('strength', $product->strength)
                ->exists();

            if (! $exists) {
                Medicine::create([
                    'name'       => $product->name,
                    'strength'   => $product->strength,
                    'generic_id' => $newGenericId,
                ]);
                $imported++;
            } else {
                $skipped++;
            }

            $medicinesBar->advance();
        }

        $medicinesBar->finish();
        $this->newLine();
        $this->info("Medicines: {$imported} imported, {$skipped} skipped (already exist).");
        $this->info('Import completed successfully.');
    }
}
