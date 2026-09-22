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
        Schema::create('varian', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('jenis_varian_id');
            $table->string('n_varian');
            $table->integer('harga')->nullable()->default(null);
            $table->integer('tambahan_harga')->nullable()->default(null);
            $table->integer('stok')->nullable()->default(null);

            $table->timestamps();

            $table->foreign('jenis_varian_id')->references('id')->on('jenis_varian')->onDelete('restrict');
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
