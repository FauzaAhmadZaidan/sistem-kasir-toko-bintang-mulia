<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Database lama atau migrasi MySQL yang terhenti bisa sudah memiliki sebagian kolom.
        Schema::whenTableDoesntHaveColumn('transaksi', 'nama_kasir',
            fn (Blueprint $table) => $table->string('nama_kasir')->nullable());
        Schema::whenTableDoesntHaveColumn('transaksi', 'kode_checkout',
            fn (Blueprint $table) => $table->uuid('kode_checkout')->nullable());

        Schema::whenTableDoesntHaveIndex('transaksi', ['user_id', 'kode_checkout'],
            fn (Blueprint $table) => $table->unique(['user_id', 'kode_checkout']), 'unique');
        Schema::whenTableDoesntHaveIndex('transaksi', ['user_id', 'waktu'],
            fn (Blueprint $table) => $table->index(['user_id', 'waktu']));
        Schema::whenTableDoesntHaveIndex('transaksi', ['waktu'],
            fn (Blueprint $table) => $table->index('waktu'));

        Schema::whenTableDoesntHaveColumn('detail_transaksi', 'nama_barang',
            fn (Blueprint $table) => $table->string('nama_barang')->nullable());
        Schema::whenTableDoesntHaveColumn('detail_transaksi', 'kode_sku',
            fn (Blueprint $table) => $table->string('kode_sku')->nullable());
        Schema::whenTableDoesntHaveColumn('detail_transaksi', 'nama_varian',
            fn (Blueprint $table) => $table->text('nama_varian')->nullable());
        Schema::whenTableDoesntHaveColumn('detail_transaksi', 'harga',
            fn (Blueprint $table) => $table->integer('harga')->nullable());
    }

    public function down(): void
    {
        // Pertahankan kolom dan indeks yang mungkin sudah ada, beserta data struknya.
    }
};
