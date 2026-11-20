<?php

namespace Tests\Feature;

use App\Models\barang;
use App\Models\sku;
use App\Models\User;
use Database\Seeders\BarangSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KatalogKasirTest extends TestCase
{
    use RefreshDatabase;

    public function test_katalog_menggunakan_sesi_kasir(): void
    {
        $this->getJson('/kasir/katalog')->assertUnauthorized();

        $admin = User::create(['username' => 'admin', 'password' => 'password', 'role' => 'admin']);
        $this->actingAs($admin)->getJson('/kasir/katalog')->assertForbidden();
        $this->get('/kasir')->assertRedirect(route('dashboard.admin'));
    }

    public function test_barang_dan_pilihan_varian_mengikuti_sku_yang_dijual(): void
    {
        $this->seed(BarangSeeder::class);
        $kasir = User::create(['username' => 'kasir', 'password' => 'password', 'role' => 'user']);
        barang::whereKey(2)->update(['status' => 'tidak aktif']);
        sku::whereBetween('id', [3, 9])->update(['status' => 'tidak aktif']);
        sku::whereKey(2)->update(['harga' => null]);

        $this->actingAs($kasir)->get('/kasir')->assertRedirect(route('dashboard.user') . '#kasir');
        $this->getJson('/kasir/katalog')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nama', 'Plastik Rajawali')
            ->assertJsonCount(1, 'data.0.skus')
            ->assertJsonPath('data.0.skus.0.harga', 28000)
            ->assertJsonPath('data.0.skus.0.stok', 100)
            ->assertJsonCount(2, 'data.0.jenis_varian')
            ->assertJsonCount(1, 'data.0.jenis_varian.0.pilihan')
            ->assertJsonCount(1, 'data.0.jenis_varian.1.pilihan');
    }
}
