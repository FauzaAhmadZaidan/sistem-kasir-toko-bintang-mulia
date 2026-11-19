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
        Schema::create('sku', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('barang_id');
            $table->string('kode_sku');
            $table->string('n_sku');
            $table->string('key');
            $table->integer('harga')->nullable()->default(null);
            $table->integer('stok')->nullable()->default(null);
            $table->enum('status', ['aktif', 'tidak aktif'])->default('aktif');

            $table->timestamps();

            $table->foreign('barang_id')->references('id')->on('barang')->onDelete('restrict');
            $table->unique(['key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('varian');
    }
};
