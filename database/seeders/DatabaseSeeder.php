<?php

namespace Database\Seeders;

use App\Models\barang;
use App\Models\jenis_varian;
use App\Models\kategori;
use App\Models\sku;
use App\Models\sku_detail;
use App\Models\User;
use App\Models\varian;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::create([
            'username' => 'Admin',
            'role' => 'admin',
            'password' => Hash::make('Admin1234!'),
        ]);

        User::create([
            'username' => 'User',
            'role' => 'user',
            'password' => Hash::make('User1234!'),
        ]);
    }
};


