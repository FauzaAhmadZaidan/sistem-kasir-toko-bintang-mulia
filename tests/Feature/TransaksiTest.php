<?php

namespace Tests\Feature;

use App\Models\barang;
use App\Models\detail_transaksi;
use App\Models\kategori;
use App\Models\sku;
use App\Models\transaksi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TransaksiTest extends TestCase
{
    use RefreshDatabase;

    private User $kasir;
    private User $lain;
    private User $admin;
    private sku $sku;

    protected function setUp(): void
    {
        parent::setUp();
        $this->kasir = User::create(['username' => 'kasir_satu', 'password' => 'password', 'role' => 'user'])->refresh();
        $this->lain = User::create(['username' => 'kasir_dua', 'password' => 'password', 'role' => 'user'])->refresh();
        $this->admin = User::create(['username' => 'admin', 'password' => 'password', 'role' => 'admin'])->refresh();
        $kategori = kategori::create(['n_kategori' => 'Kemasan']);
        $barang = barang::create(['kategori_id' => $kategori->id, 'n_barang' => 'Kantong kertas', 'has_varian' => false]);
        $this->sku = sku::create(['barang_id' => $barang->id, 'kode_sku' => 'KK-01', 'key' => 'test-1', 'n_sku' => 'Standar', 'harga' => 10000, 'stok' => 20]);
    }

    private function payload(array $extra = []): array
    {
        return array_replace([
            'kode_checkout' => (string) Str::uuid(), 'bayar' => 50000, 'total' => 20000,
            'items' => [['id' => $this->sku->id, 'qty' => 2, 'harga' => 10000]],
        ], $extra);
    }

    private function catat(User $kasir, string $waktu = '2026-11-23 03:00:00', int $total = 20000): transaksi
    {
        $transaksi = transaksi::create([
            'user_id' => $kasir->id, 'invoice' => 'TR-' . Str::uuid(), 'waktu' => $waktu,
            'total' => $total, 'bayar' => $total, 'kembalian' => 0,
        ]);
        detail_transaksi::create(['transaksi_id' => $transaksi->id, 'sku_id' => $this->sku->id, 'jumlah' => 2]);
        return $transaksi;
    }

    public function test_tamu_tidak_dapat_membaca_atau_menyimpan_transaksi(): void
    {
        foreach (['', '/api'] as $prefix) {
            $this->getJson($prefix . '/transaksi')->assertUnauthorized();
            $this->getJson($prefix . '/transaksi/1')->assertUnauthorized();
            $this->postJson($prefix . '/transaksi/store', $this->payload())->assertUnauthorized();
        }
    }

    public function test_kasir_hanya_membaca_milik_sendiri_termasuk_ringkasan_dan_detail(): void
    {
        $milik = $this->catat($this->kasir);
        $orangLain = $this->catat($this->lain, total: 90000);
        $this->actingAs($this->kasir);
        foreach (['', '?kasir_id=' . $this->lain->id, '?user_id=' . $this->lain->id, '?cari=%25'] as $query) {
            $this->getJson('/transaksi' . $query)->assertOk()->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.id', $milik->id)->assertJsonPath('ringkasan.total_penjualan', 20000)
                ->assertJsonPath('ringkasan.jumlah_item', 2)->assertJsonPath('meta.total', 1)->assertJsonCount(0, 'kasir');
        }
        $this->getJson('/transaksi/' . $milik->id)->assertOk();
        $this->getJson('/transaksi/' . $orangLain->id)->assertNotFound()->assertJsonMissing(['invoice' => $orangLain->invoice]);
    }

    public function test_api_sanctum_menerapkan_batas_kepemilikan_yang_sama(): void
    {
        $milik = $this->catat($this->kasir);
        $orangLain = $this->catat($this->lain);
        Sanctum::actingAs($this->kasir);
        $this->getJson('/api/transaksi?kasir_id=' . $this->lain->id)->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $milik->id);
        $this->getJson('/api/transaksi/' . $orangLain->id)->assertNotFound();
        $this->postJson('/api/transaksi/store', $this->payload(['user_id' => $this->lain->id]))->assertOk()->assertJsonPath('data.kasir.id', $this->kasir->id);
    }

    public function test_admin_dapat_membaca_semua_transaksi_dan_memfilter_kasir(): void
    {
        $this->catat($this->kasir);
        $lain = $this->catat($this->lain, total: 90000);
        $this->actingAs($this->admin)->getJson('/transaksi')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('ringkasan.total_penjualan', 110000)->assertJsonPath('ringkasan.jumlah_item', 4)->assertJsonCount(2, 'kasir');
        $this->getJson('/transaksi?kasir_id=' . $this->lain->id)->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $lain->id)->assertJsonPath('ringkasan.total_penjualan', 90000);
        $this->getJson('/transaksi/' . $lain->id)->assertOk()->assertJsonCount(1, 'data.items');
        $this->postJson('/transaksi/store', $this->payload())->assertForbidden();
    }

    public function test_pengelolaan_akun_tetap_memerlukan_role_admin(): void
    {
        $this->actingAs($this->kasir);
        $this->getJson('/admin/users/get-users')->assertForbidden();
        $this->getJson('/admin/users/check-username')->assertForbidden();
        $this->postJson('/admin/user/create')->assertForbidden();
        $this->postJson('/admin/users/create')->assertForbidden();
        $this->patchJson('/admin/users/edit/' . $this->kasir->id)->assertForbidden();

        $this->actingAs($this->admin)->getJson('/admin/users/get-users')->assertOk()->assertJsonCount(3, 'data');
        $this->patchJson('/admin/users/edit/' . $this->lain->id, ['status' => false])->assertOk();
        $this->assertDatabaseHas('users', ['id' => $this->lain->id, 'status' => 'tidak aktif']);
    }

    public function test_checkout_menggunakan_identitas_waktu_dan_perhitungan_server(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 23)->setTime(10, 0));
        $response = $this->actingAs($this->kasir)->postJson('/transaksi/store', $this->payload([
            'user_id' => $this->lain->id, 'waktu' => '2000-01-01', 'kembalian' => 999999,
        ]))->assertOk()->assertJsonPath('data.kasir.id', $this->kasir->id)
            ->assertJsonPath('data.total', 20000)->assertJsonPath('data.kembalian', 30000)
            ->assertJsonPath('data.items.0.harga', 10000)->assertJsonPath('data.items.0.subtotal', 20000);
        $this->assertDatabaseHas('transaksi', ['id' => $response->json('data.id'), 'user_id' => $this->kasir->id, 'waktu' => now()->toDateTimeString()]);
        $this->assertEquals(18, $this->sku->fresh()->stok);
        $this->getJson('/transaksi')->assertJsonPath('meta.total', 1);
        $this->travelBack();
    }

    public function test_pengiriman_ulang_tidak_mencatat_atau_mengurangi_stok_dua_kali(): void
    {
        $payload = $this->payload();
        $this->actingAs($this->kasir);
        $id = $this->postJson('/transaksi/store', $payload)->assertOk()->json('data.id');
        // Retry tetap mengembalikan struk meski katalog berubah setelah commit pertama.
        $this->sku->update(['harga' => 15000, 'status' => 'tidak aktif']);
        $this->postJson('/transaksi/store', $payload)->assertOk()->assertJsonPath('data.id', $id)->assertJsonPath('data.total', 20000);
        $this->postJson('/transaksi/store', array_replace($payload, ['bayar' => 60000]))->assertUnprocessable();
        $this->assertDatabaseCount('transaksi', 1);
        $this->assertDatabaseCount('detail_transaksi', 1);
        $this->assertEquals(18, $this->sku->fresh()->stok);
    }

    public function test_struk_tetap_sama_setelah_nama_harga_dan_akun_diedit(): void
    {
        $id = $this->actingAs($this->kasir)->postJson('/transaksi/store', $this->payload())->assertOk()->json('data.id');
        $this->sku->barang->update(['n_barang' => 'Nama baru']);
        $this->sku->update(['harga' => 50000, 'n_sku' => 'Varian baru', 'kode_sku' => 'NEW']);
        $this->kasir->update(['username' => 'nama_baru']);
        $this->getJson('/transaksi/' . $id)->assertOk()->assertJsonPath('data.kasir.username', 'kasir_satu')
            ->assertJsonPath('data.items.0.nama_barang', 'Kantong kertas')->assertJsonPath('data.items.0.harga', 10000)
            ->assertJsonPath('data.items.0.kode_sku', 'KK-01')->assertJsonPath('data.items.0.nama_varian', '');
    }

    public function test_transaksi_lama_tidak_memakai_harga_sku_saat_ini(): void
    {
        $lama = $this->catat($this->kasir);
        $this->actingAs($this->kasir)->getJson('/transaksi/' . $lama->id)->assertOk()
            ->assertJsonPath('data.items.0.harga', null)->assertJsonPath('data.items.0.subtotal', null)->assertJsonPath('data.total', 20000);
    }

    public function test_checkout_tidak_valid_tidak_mengubah_stok_atau_transaksi(): void
    {
        $this->actingAs($this->kasir);
        foreach ([0, -1, 1.5] as $qty) {
            $this->postJson('/transaksi/store', $this->payload(['items' => [['id' => $this->sku->id, 'qty' => $qty]]]))->assertStatus(400);
        }
        $this->postJson('/transaksi/store', $this->payload(['items' => []]))->assertStatus(400);
        $this->postJson('/transaksi/store', $this->payload(['items' => [['id' => $this->sku->id, 'qty' => 1], ['id' => $this->sku->id, 'qty' => 1]]]))->assertStatus(400);
        $this->postJson('/transaksi/store', $this->payload(['bayar' => 1]))->assertUnprocessable();
        $this->postJson('/transaksi/store', $this->payload(['total' => 1]))->assertUnprocessable();
        $this->postJson('/transaksi/store', $this->payload(['items' => [['id' => $this->sku->id, 'qty' => 21]]]))->assertUnprocessable();
        $this->postJson('/transaksi/store', $this->payload(['items' => [['id' => $this->sku->id, 'qty' => 2, 'harga' => 5000]]]))->assertUnprocessable();
        $this->sku->update(['status' => 'tidak aktif']);
        $this->postJson('/transaksi/store', $this->payload())->assertUnprocessable();
        $this->assertDatabaseCount('transaksi', 0);
        $this->assertDatabaseCount('detail_transaksi', 0);
        $this->assertEquals(20, $this->sku->fresh()->stok);
    }

    public function test_barang_nonaktif_dan_kasir_nonaktif_ditolak(): void
    {
        $this->actingAs($this->kasir);
        $this->sku->barang->update(['status' => 'tidak aktif']);
        $this->postJson('/transaksi/store', $this->payload())->assertUnprocessable();
        $this->kasir->status = 'tidak aktif';
        $this->kasir->save();
        $this->getJson('/transaksi')->assertForbidden();
        $this->getJson('/transaksi/1')->assertForbidden();
        $this->postJson('/transaksi/store', $this->payload())->assertForbidden();
    }

    public function test_filter_tanggal_mengikuti_batas_hari_wib_dan_pencarian_invoice(): void
    {
        $this->catat($this->kasir, '2026-11-22 16:59:59');
        $awal = $this->catat($this->kasir, '2026-11-22 17:00:00');
        $akhir = $this->catat($this->kasir, '2026-11-23 16:59:59');
        $this->catat($this->kasir, '2026-11-23 17:00:00');
        $this->actingAs($this->admin)->getJson('/transaksi?tanggal_mulai=2026-11-23&tanggal_selesai=2026-11-23')
            ->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('data.0.id', $akhir->id)->assertJsonPath('data.1.id', $awal->id)
            ->assertJsonPath('ringkasan.total_penjualan', 40000);
        $this->getJson('/transaksi?cari=' . $awal->invoice)->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/transaksi?tanggal_mulai=2026-11-24&tanggal_selesai=2026-11-23')->assertStatus(400);
        $this->getJson('/transaksi?tanggal_mulai=tidak-valid')->assertStatus(400);
    }

    public function test_ringkasan_menghitung_seluruh_hasil_dan_paginasi_stabil(): void
    {
        for ($i = 0; $i < 12; $i++) $this->catat($this->kasir);
        $this->actingAs($this->kasir)->getJson('/transaksi')->assertOk()->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 12)->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('data.0.id', 12)->assertJsonPath('ringkasan.total_penjualan', 240000)->assertJsonPath('ringkasan.jumlah_item', 24);
        $this->getJson('/transaksi?page=2')->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('data.0.id', 2);
        $this->getJson('/transaksi?cari=TIDAK-ADA')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('ringkasan.total_penjualan', 0);
    }
}
