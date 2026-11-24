<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kedua kolom ini belum ada pada definisi tabel transaksi pertama.
        Schema::whenTableDoesntHaveColumn('transaksi', 'waktu',
            fn (Blueprint $table) => $table->dateTime('waktu')->nullable());

        DB::table('transaksi')
            ->whereNull('waktu')
            ->whereNotNull('created_at')
            ->update(['waktu' => DB::raw('created_at')]);

        Schema::whenTableDoesntHaveColumn('detail_transaksi', 'sku_id',
            fn (Blueprint $table) => $table->foreignId('sku_id')->nullable()->constrained('sku')->restrictOnDelete());
    }

    public function down(): void
    {
        // Pertahankan waktu dan kaitan SKU dari transaksi yang sudah tercatat.
    }
};
