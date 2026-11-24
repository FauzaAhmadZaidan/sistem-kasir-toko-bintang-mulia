<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::whenTableDoesntHaveColumn('users', 'status',
            fn (Blueprint $table) => $table->enum('status', ['aktif', 'tidak aktif'])->default('aktif'));
    }

    public function down(): void
    {
        // Pertahankan status akun, termasuk pilihan admin untuk menonaktifkan akun.
    }
};
