<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\BarangSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class MigrasiRiwayatTransaksiTest extends TestCase
{
    private const MIGRASI_SKEMA_LAMA = '2026_11_23_000000_complete_legacy_transaction_columns.php';
    private const MIGRASI_STRUK = 'database/migrations/2026_11_23_000001_add_receipt_snapshot_to_transaksi.php';
    private const MIGRASI_STATUS = 'database/migrations/2026_11_24_000001_add_status_to_legacy_users.php';

    private function jalankanMigrasiSebelumRiwayat(): void
    {
        $migrasiLama = array_values(array_filter(
            glob(database_path('migrations/*.php')),
            fn ($file) => strcmp(basename($file), self::MIGRASI_SKEMA_LAMA) < 0
        ));
        $this->artisan('migrate', ['--path' => $migrasiLama, '--realpath' => true])->assertSuccessful();
    }

    public function test_migrasi_melengkapi_skema_lama_dan_mempertahankan_struk(): void
    {
        $this->jalankanMigrasiSebelumRiwayat();

        Schema::table('transaksi', function (Blueprint $table) {
            $table->string('nama_kasir')->nullable();
            $table->index(['user_id', 'waktu'], 'riwayat_kasir_lama');
        });
        Schema::table('detail_transaksi', fn (Blueprint $table) => $table->integer('harga')->nullable());

        $user = User::create(['username' => 'kasir_uji', 'password' => 'password', 'role' => 'user']);
        $user->status = 'tidak aktif';
        $user->save();
        $this->seed(BarangSeeder::class);
        $transaksi = DB::table('transaksi')->insertGetId([
            'user_id' => $user->id,
            'invoice' => 'TR-UJI-LAMA',
            'nama_kasir' => 'Kasir Uji Lama',
            'waktu' => '2026-11-23 09:00:00',
            'total' => 28000,
            'bayar' => 30000,
            'kembalian' => 2000,
        ]);
        DB::table('detail_transaksi')->insert([
            'transaksi_id' => $transaksi,
            'sku_id' => 1,
            'jumlah' => 1,
            'harga' => 28000,
        ]);

        $this->artisan('migrate')->assertSuccessful();
        $this->assertTrue(Schema::hasColumn('transaksi', 'kode_checkout'));
        $this->assertTrue(Schema::hasColumns('detail_transaksi', ['nama_barang', 'kode_sku', 'nama_varian']));
        $this->assertTrue(Schema::hasIndex('transaksi', ['user_id', 'kode_checkout'], 'unique'));
        $this->assertTrue(Schema::hasIndex('transaksi', ['waktu']));
        $indeksKasir = collect(Schema::getIndexes('transaksi'))->where('columns', ['user_id', 'waktu']);
        $this->assertSame(['riwayat_kasir_lama'], $indeksKasir->pluck('name')->all());
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'tidak aktif']);

        $this->artisan('migrate:rollback', ['--path' => [self::MIGRASI_STRUK, self::MIGRASI_STATUS], '--step' => 2])->assertSuccessful();
        $this->assertDatabaseHas('transaksi', ['id' => $transaksi, 'nama_kasir' => 'Kasir Uji Lama', 'total' => 28000]);
        $this->assertDatabaseHas('detail_transaksi', ['transaksi_id' => $transaksi, 'harga' => 28000]);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'tidak aktif']);
        $this->artisan('migrate')->assertSuccessful();
    }

    public function test_database_awal_mendukung_riwayat_lama_dan_checkout_baru_setelah_migrasi(): void
    {
        $this->jalankanMigrasiSebelumRiwayat();

        // Struktur awal proyek belum menyimpan status akun dan waktu checkout.
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('status'));
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn('waktu');
            $table->string('nama_kasir')->nullable();
            $table->uuid('kode_checkout')->nullable();
            $table->unique(['user_id', 'kode_checkout']);
        });
        Schema::drop('detail_transaksi');
        Schema::create('detail_transaksi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaksi_id')->constrained('transaksi')->restrictOnDelete();
            $table->foreignId('barang_id')->constrained('barang')->restrictOnDelete();
            $table->integer('jumlah');
            $table->integer('total_harga');
            $table->timestamps();
        });

        $kasir = User::create(['username' => 'kasir_uji', 'password' => 'password', 'role' => 'user'])->refresh();
        $this->seed(BarangSeeder::class);
        $nilaiLama = [
            'user_id' => $kasir->id, 'nama_kasir' => 'Kasir Uji Lama',
            'total' => 54000, 'bayar' => 60000, 'kembalian' => 6000,
        ];
        $idLama = DB::table('transaksi')->insertGetId($nilaiLama + [
            'invoice' => 'TR-UJI-LAMA', 'created_at' => '2026-11-23 09:00:00',
        ]);
        $idTanpaWaktu = DB::table('transaksi')->insertGetId($nilaiLama + ['invoice' => 'TR-UJI-TANPA-WAKTU']);
        DB::table('detail_transaksi')->insert([
            'transaksi_id' => $idLama, 'barang_id' => 1, 'jumlah' => 2, 'total_harga' => 54000,
        ]);

        $checkout = [
            'kode_checkout' => (string) Str::uuid(), 'bayar' => 50000, 'total' => 28000,
            'items' => [['id' => 1, 'qty' => 1, 'harga' => 28000]],
        ];
        $this->actingAs($kasir)->postJson('/transaksi/store', $checkout)->assertForbidden();
        $this->artisan('migrate')->assertSuccessful();

        $this->assertSame('aktif', $kasir->refresh()->status);
        $this->assertDatabaseHas('transaksi', [
            'id' => $idLama, 'waktu' => '2026-11-23 09:00:00', 'nama_kasir' => 'Kasir Uji Lama',
        ]);
        $this->actingAs($kasir)->getJson('/transaksi?tanggal_mulai=2026-11-23&tanggal_selesai=2026-11-23')
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $idLama);
        $this->getJson('/transaksi/' . $idLama)->assertOk()
            ->assertJsonPath('data.items.0.nama_barang', 'Plastik Rajawali')
            ->assertJsonPath('data.items.0.sku_id', null)
            ->assertJsonPath('data.items.0.harga', null)
            ->assertJsonPath('data.items.0.subtotal', 54000);
        $this->getJson('/transaksi/' . $idTanpaWaktu)->assertOk()->assertJsonPath('data.waktu', null);

        $idBaru = $this->postJson('/transaksi/store', $checkout)->assertOk()
            ->assertJsonPath('data.items.0.subtotal', 28000)->json('data.id');
        $this->assertDatabaseHas('detail_transaksi', [
            'transaksi_id' => $idBaru, 'barang_id' => 1, 'sku_id' => 1,
            'jumlah' => 1, 'total_harga' => 28000, 'harga' => 28000,
        ]);
        $this->assertDatabaseHas('sku', ['id' => 1, 'stok' => 99]);
    }
}
