<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Medicine;
use App\Models\Supplier;

class LinkSupplierToExistingMedicines extends Command
{
    protected $signature = 'link:suppliers-to-medicines';

    protected $description = 'Link existing medicines to suppliers from medine_olds database';

    public function handle(): void
    {
        $this->info('Starting to link suppliers to existing medicines...');

        // Get supplier mapping
        $supplierMap = Supplier::pluck('id', 'name')->toArray();

        // Get old products with supplier info
        $oldProducts = DB::connection('mysql2')
            ->table('products')
            ->leftJoin('suppliers', 'products.supplier_id', '=', 'suppliers.id')
            ->select('products.name', 'products.strength', 'suppliers.name as supplier_name')
            ->get();

        $updatedCount = 0;
        $bar = $this->output->createProgressBar($oldProducts->count());
        $bar->start();

        foreach ($oldProducts as $product) {
            $supplierId = $product->supplier_name && isset($supplierMap[$product->supplier_name])
                ? $supplierMap[$product->supplier_name]
                : null;

            if ($supplierId) {
                Medicine::where('name', $product->name)
                    ->where('strength', $product->strength)
                    ->update(['supplier_id' => $supplierId]);
                $updatedCount++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Updated {$updatedCount} medicines with supplier information.");
        $this->info('Linking completed successfully.');
    }
}
