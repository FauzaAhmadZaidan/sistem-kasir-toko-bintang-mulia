<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('jenis_varian', 'barang_id')) {
            Schema::table('jenis_varian', function (Blueprint $table) {
                $table->unsignedBigInteger('barang_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Shared variant types may already have null in the legacy column.
    }
};
