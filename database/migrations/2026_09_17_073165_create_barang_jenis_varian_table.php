<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('barang_jenis_varian', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('barang_id');
            $table->unsignedBigInteger('jenis_varian_id');
            

            $table->timestamps();

            $table->foreign('barang_id')->references('id')->on('barang')->onDelete('restrict');
            $table->foreign('jenis_varian_id')->references('id')->on('jenis_varian')->onDelete('restrict');

            $table->unique(['barang_id', 'jenis_varian_id']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barang');
    }
};
