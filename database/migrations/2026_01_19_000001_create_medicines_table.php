<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('image')->nullable();
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->string('unit')->nullable();
            $table->bigInteger('price')->nullable();
            $table->string('strip_price')->nullable();
            $table->string('box_price')->nullable();
            $table->string('box_size')->nullable();
            $table->text('description')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->tinyInteger('featured')->default(0);
            $table->integer('order')->nullable();
            $table->integer('sold_unit')->default(0);
            $table->integer('quantity')->default(0);
            $table->string('strength')->nullable();
            $table->string('scrapper_url')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->unsignedBigInteger('generic_id')->nullable();
            $table->string('type')->default('Medicine');
            $table->longText('scrapped_data')->nullable();
            $table->tinyInteger('scrapped')->default(0);
            $table->longText('error')->nullable();
            $table->bigInteger('trade_price')->nullable();
            $table->enum('is_bonus', ['Rate Product', 'Bonus Product'])->nullable();
            $table->timestamps();

            // Indexes
            $table->index('category_id');
            $table->index('supplier_id');
            $table->index('generic_id');
            $table->index('status');
            $table->index('featured');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
