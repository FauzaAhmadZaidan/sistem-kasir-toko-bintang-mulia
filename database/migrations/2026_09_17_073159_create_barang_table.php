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
        Schema::create('barang', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('kategori_id');
            $table->string('kode')->nullable()->default(null);
            $table->string('n_barang');
            $table->integer('harga')->nullable()->default(null);
            $table->integer('total_stok')->default(0);
            $table->enum('status', ['aktif', 'tidak aktif'])->default('aktif');
            $table->string('gambar')->nullable()->default(null);
            $table->boolean('has_varian')->default(0);

            $table->timestamps();

            $table->foreign('kategori_id')->references('id')->on('kategori')->onDelete('restrict');
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
