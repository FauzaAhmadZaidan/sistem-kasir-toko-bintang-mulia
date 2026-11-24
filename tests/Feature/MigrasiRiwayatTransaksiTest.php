<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\BarangSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MigrasiRiwayatTransaksiTest extends TestCase
{
    public function test_migrasi_melengkapi_skema_lama_dan_mempertahankan_struk(): void
    {
        $path = 'database/migrations/2026_11_23_000001_add_receipt_snapshot_to_transaksi.php';
        $migrasiLama = array_values(array_filter(
            glob(database_path('migrations/*.php')),
            fn ($file) => strcmp(basename($file), basename($path)) < 0
        ));
        $this->artisan('migrate', ['--path' => $migrasiLama, '--realpath' => true])->assertSuccessful();

        Schema::table('transaksi', function (Blueprint $table) {
            $table->string('nama_kasir')->nullable();
            $table->index(['user_id', 'waktu'], 'riwayat_kasir_lama');
        });
        Schema::table('detail_transaksi', fn (Blueprint $table) => $table->integer('harga')->nullable());

        $user = User::create(['username' => 'kasir_uji', 'password' => 'password', 'role' => 'user']);
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

        $this->artisan('migrate', ['--path' => [$path]])->assertSuccessful();
        $this->assertTrue(Schema::hasColumn('transaksi', 'kode_checkout'));
        $this->assertTrue(Schema::hasColumns('detail_transaksi', ['nama_barang', 'kode_sku', 'nama_varian']));
        $this->assertTrue(Schema::hasIndex('transaksi', ['user_id', 'kode_checkout'], 'unique'));
        $this->assertTrue(Schema::hasIndex('transaksi', ['waktu']));
        $indeksKasir = collect(Schema::getIndexes('transaksi'))->where('columns', ['user_id', 'waktu']);
        $this->assertSame(['riwayat_kasir_lama'], $indeksKasir->pluck('name')->all());

        $this->artisan('migrate:rollback', ['--path' => [$path], '--step' => 1])->assertSuccessful();
        $this->assertDatabaseHas('transaksi', ['id' => $transaksi, 'nama_kasir' => 'Kasir Uji Lama', 'total' => 28000]);
        $this->assertDatabaseHas('detail_transaksi', ['transaksi_id' => $transaksi, 'harga' => 28000]);
        $this->artisan('migrate', ['--path' => [$path]])->assertSuccessful();
    }
}
