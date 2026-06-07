<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Category;
use App\Models\Generic;
use App\Models\Medicine;
use App\Models\Supplier;

class ImportMedicinesFromOldDb extends Command
{
    protected $signature = 'import:medicines';

    protected $description = 'Import categories, generics, suppliers, and medicines from the medine_olds database into the doctor database';

    public function handle(): void
    {
        $this->info('Starting import from medine_olds database...');

        // ── Step 1: Import suppliers ─────────────────────────────────────────
        $this->info('Importing suppliers...');

        $oldSuppliers = DB::connection('mysql2')
            ->table('suppliers')
            ->select('id', 'name', 'logo', 'registration_number', 'vat_number', 'industry_type',
                     'contact_person', 'contact_person_designation', 'contact_person_email',
                     'contact_person_phone', 'company_email', 'company_phone', 'address', 'city',
                     'country', 'website')
            ->get();

        $supplierIdMap = []; // old_id => new_id

        $suppliersBar = $this->output->createProgressBar($oldSuppliers->count());
        $suppliersBar->start();

        foreach ($oldSuppliers as $oldSupplier) {
            $newSupplier = Supplier::firstOrCreate(
                ['name' => $oldSupplier->name],
                [
                    'logo' => $oldSupplier->logo,
                    'registration_number' => $oldSupplier->registration_number,
                    'vat_number' => $oldSupplier->vat_number,
                    'industry_type' => $oldSupplier->industry_type,
                    'contact_person' => $oldSupplier->contact_person,
                    'contact_person_designation' => $oldSupplier->contact_person_designation,
                    'contact_person_email' => $oldSupplier->contact_person_email,
                    'contact_person_phone' => $oldSupplier->contact_person_phone,
                    'company_email' => $oldSupplier->company_email,
                    'company_phone' => $oldSupplier->company_phone,
                    'address' => $oldSupplier->address,
                    'city' => $oldSupplier->city,
                    'country' => $oldSupplier->country,
                    'website' => $oldSupplier->website,
                ]
            );
            $supplierIdMap[$oldSupplier->id] = $newSupplier->id;
            $suppliersBar->advance();
        }

        $suppliersBar->finish();
        $this->newLine();
        $this->info("Imported {$oldSuppliers->count()} suppliers.");

        // ── Step 2: Import generics ──────────────────────────────────────────
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

        // ── Step 3: Import categories ────────────────────────────────────────
        $this->info('Importing categories...');

        $oldCategories = DB::connection('mysql2')
            ->table('categories')
            ->select('id', 'name', 'image')
            ->get();

        $categoryIdMap = []; // old_id => new_id

        $categoriesBar = $this->output->createProgressBar($oldCategories->count());
        $categoriesBar->start();

        foreach ($oldCategories as $oldCategory) {
            $newCategory = Category::firstOrCreate(
                ['name' => $oldCategory->name],
                ['image' => $oldCategory->image]
            );
            $categoryIdMap[$oldCategory->id] = $newCategory->id;
            $categoriesBar->advance();
        }

        $categoriesBar->finish();
        $this->newLine();
        $this->info("Imported {$oldCategories->count()} categories.");

        // ── Step 4: Import medicines (products) ──────────────────────────────
        $this->info('Importing medicines from products table...');

        $oldProducts = DB::connection('mysql2')
            ->table('products')
            ->select('name', 'strength', 'generic_id', 'supplier_id', 'category_id')
            ->get();

        $medicinesBar = $this->output->createProgressBar($oldProducts->count());
        $medicinesBar->start();

        $imported = 0;
        $skipped  = 0;

        foreach ($oldProducts as $product) {
            $newGenericId = isset($product->generic_id, $genericIdMap[$product->generic_id])
                ? $genericIdMap[$product->generic_id]
                : null;

            $newSupplierId = isset($product->supplier_id, $supplierIdMap[$product->supplier_id])
                ? $supplierIdMap[$product->supplier_id]
                : null;

            $newCategoryId = isset($product->category_id, $categoryIdMap[$product->category_id])
                ? $categoryIdMap[$product->category_id]
                : null;

            $existingMedicine = Medicine::where('name', $product->name)
                ->where('strength', $product->strength)
                ->first();

            if (! $existingMedicine) {
                Medicine::create([
                    'name'        => $product->name,
                    'strength'    => $product->strength,
                    'generic_id'  => $newGenericId,
                    'supplier_id' => $newSupplierId,
                    'category_id' => $newCategoryId,
                ]);
                $imported++;
            } else {
                $existingMedicine->update([
                    'generic_id'  => $newGenericId ?? $existingMedicine->generic_id,
                    'supplier_id' => $newSupplierId ?? $existingMedicine->supplier_id,
                    'category_id' => $newCategoryId ?? $existingMedicine->category_id,
                ]);
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
