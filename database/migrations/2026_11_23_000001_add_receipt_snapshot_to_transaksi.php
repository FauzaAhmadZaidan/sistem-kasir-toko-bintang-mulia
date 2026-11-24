<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->string('nama_kasir')->nullable();
            $table->uuid('kode_checkout')->nullable();
            $table->unique(['user_id', 'kode_checkout']);
            $table->index(['user_id', 'waktu']);
            $table->index('waktu');
        });

        Schema::table('detail_transaksi', function (Blueprint $table) {
            $table->string('nama_barang')->nullable();
            $table->string('kode_sku')->nullable();
            $table->text('nama_varian')->nullable();
            $table->integer('harga')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('detail_transaksi', function (Blueprint $table) {
            $table->dropColumn(['nama_barang', 'kode_sku', 'nama_varian', 'harga']);
        });

        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'kode_checkout']);
            $table->dropIndex(['user_id', 'waktu']);
            $table->dropIndex(['waktu']);
            $table->dropColumn(['nama_kasir', 'kode_checkout']);
        });
    }
};
