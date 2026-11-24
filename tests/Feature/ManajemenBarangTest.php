<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\BarangSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ManajemenBarangTest extends TestCase
{
    use RefreshDatabase;

    public function test_akses_inventaris_memerlukan_sesi_admin(): void
    {
        $this->getJson('/admin/barang')->assertUnauthorized();

        $kasir = User::create(['username' => 'kasir', 'password' => 'password', 'role' => 'user']);
        $this->actingAs($kasir)->getJson('/admin/barang')->assertForbidden();
        $this->postJson('/admin/barang/add')->assertForbidden();
        $this->postJson('/admin/sku/generate')->assertForbidden();
    }

    public function test_sku_dan_status_barang_mengatur_katalog_kasir(): void
    {
        $admin = User::create(['username' => 'admin', 'password' => 'password', 'role' => 'admin']);
        $kasir = User::create(['username' => 'kasir', 'password' => 'password', 'role' => 'user']);
        $this->actingAs($admin);

        $id = $this->postJson('/admin/barang/add', [
            'nama_barang' => 'Paper Bag',
            'kategori_barang' => 'Kemasan',
            'has_varian' => true,
        ])->assertCreated()->json('barang.id');

        $this->postJson('/admin/sku/generate', ['barang_id' => $id])->assertBadRequest();
        $pilihan = ['barang_id' => $id, 'jenis_varian' => 'Ukuran', 'varian' => ['Kecil', 'Besar']];
        $this->postJson('/admin/varian/add', $pilihan)->assertCreated();
        $this->postJson('/admin/varian/add', $pilihan)->assertCreated();
        $this->postJson('/admin/sku/generate', ['barang_id' => $id])
            ->assertOk()->assertJsonPath('data.jumlah_dibuat', 2);
        $this->postJson('/admin/sku/generate', ['barang_id' => $id])
            ->assertOk()->assertJsonPath('data.jumlah_dilewati', 2);
        $this->postJson('/admin/varian/add', ['barang_id' => $id, 'jenis_varian' => 'Warna', 'varian' => ['Putih']])->assertConflict();
        $this->postJson('/admin/varian/add', array_replace($pilihan, ['varian' => ['Sedang']]))->assertCreated();
        $this->postJson('/admin/sku/generate', ['barang_id' => $id])
            ->assertOk()->assertJsonPath('data.jumlah_dibuat', 1);

        $skuId = $this->getJson('/admin/barang')->assertOk()
            ->assertJsonPath('data.0.kategori.n_kategori', 'Kemasan')
            ->assertJsonCount(3, 'data.0.skus')
            ->assertJsonPath('data.0.skus.0.status', 'tidak aktif')
            ->json('data.0.skus.0.id');

        $this->actingAs($kasir)->getJson('/kasir/katalog')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($admin)->postJson('/admin/sku/edit', [
            'id' => $skuId, 'harga' => 2500, 'stok' => 24, 'stok_sebelumnya' => 0, 'status' => 'aktif',
        ])->assertOk();
        $this->postJson('/admin/sku/edit', ['id' => $skuId, 'stok' => 30, 'stok_sebelumnya' => 0])->assertConflict();

        $this->actingAs($kasir)->getJson('/kasir/katalog')->assertOk()
            ->assertJsonPath('data.0.id', $id)
            ->assertJsonCount(1, 'data.0.skus')
            ->assertJsonPath('data.0.skus.0.harga', 2500)
            ->assertJsonPath('data.0.skus.0.stok', 24);
        $this->actingAs($admin)->postJson('/admin/barang/edit', ['id' => $id, 'status' => 'tidak aktif'])->assertOk();
        $this->actingAs($kasir)->getJson('/kasir/katalog')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_barang_satuan_bisa_diberi_foto_dan_satu_sku(): void
    {
        Storage::fake('public');
        $this->actingAs(User::create(['username' => 'admin', 'password' => 'password', 'role' => 'admin']));
        $id = $this->postJson('/admin/barang/add', [
            'nama_barang' => 'Stapler', 'kategori_barang' => 'Alat tulis', 'has_varian' => false,
        ])->assertCreated()->json('barang.id');

        $this->postJson('/admin/sku/generate', ['barang_id' => $id])
            ->assertOk()->assertJsonPath('data.jumlah_dibuat', 1);

        $gambar = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBf8AAAAASUVORK5CYII=');
        $this->post('/admin/barang/foto', [
            'id' => $id, 'gambar' => UploadedFile::fake()->createWithContent('stapler.png', $gambar),
        ], ['Accept' => 'application/json'])->assertOk();

        $row = $this->getJson('/admin/barang')->assertOk()->json('data.0');
        Storage::disk('public')->assertExists($row['gambar']);
        $this->assertStringEndsWith('/storage/' . $row['gambar'], $row['gambar_url']);
    }

    public function test_generate_mengenali_kombinasi_sku_barang_lama(): void
    {
        $this->seed(BarangSeeder::class);
        $this->actingAs(User::create(['username' => 'admin', 'password' => 'password', 'role' => 'admin']));

        $this->postJson('/admin/sku/generate', ['barang_id' => 1])->assertOk()
            ->assertJsonPath('data.jumlah_dibuat', 0)
            ->assertJsonPath('data.jumlah_dilewati', 9);
        $this->assertDatabaseHas('sku', ['id' => 1, 'key' => 'A', 'harga' => 28000, 'stok' => 100]);
        $this->assertDatabaseCount('sku', 15);
    }
}
