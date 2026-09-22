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
        Schema::create('log_stok', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('barang_id');
            $table->unsignedBigInteger('varian_id');
            $table->integer('jumlah');
            $table->enum('tipe', ['masuk', 'keluar']);
            $table->timestamps();

            $table->foreign('barang_id')->references('id')->on('barang')->onDelete('restrict');
            $table->foreign('varian_id')->references('id')->on('varian')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_stok');
    }
};
