<?php

namespace Database\Seeders;

use App\Models\barang;
use App\Models\barang_jenis_varian;
use App\Models\barang_varian;
use App\Models\jenis_varian;
use App\Models\kategori;
use App\Models\sku;
use App\Models\sku_detail;
use App\Models\User;
use App\Models\varian;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BarangSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        kategori::create([
            'id' => 1,
            'n_kategori' => 'Plastik',
        ]);

        barang::create([
            'id' => 1,
            'kategori_id' => 1,
            'n_barang' => 'Plastik Rajawali',
            'has_varian' => true,
        ]);

        barang::create([
            'id' => 2,
            'kategori_id' => 1,
            'n_barang' => 'Plastik Boyolali',
            'has_varian' => true,
        ]);

        jenis_varian::create([
            'id' => 1,
            'n_jenis_varian' => 'Warna',
        ]);

        jenis_varian::create([
            'id' => 2,
            'n_jenis_varian' => 'Ukuran',
        ]);

        varian::create([
            'id' => 1,
            'jenis_varian_id' => 1,
            'n_varian' => 'Putih',
        ]);

        varian::create([
            'id' => 2,
            'jenis_varian_id' => 1,
            'n_varian' => 'Merah',
        ]);

        varian::create([
            'id' => 3,
            'jenis_varian_id' => 1,
            'n_varian' => 'Hitam',
        ]);

        varian::create([
            'id' => 4,
            'jenis_varian_id' => 2,
            'n_varian' => '50x50',
        ]);

        varian::create([
            'id' => 5,
            'jenis_varian_id' => 2,
            'n_varian' => '30x30',
        ]);

        varian::create([
            'id' => 6,
            'jenis_varian_id' => 2,
            'n_varian' => '20x20',
        ]);

        varian::create([
            'id' => 7,
            'jenis_varian_id' => 2,
            'n_varian' => '30x40',
        ]);

        varian::create([
            'id' => 8,
            'jenis_varian_id' => 2,
            'n_varian' => '30x20',
        ]);

        varian::create([
            'id' => 9,
            'jenis_varian_id' => 1,
            'n_varian' => 'Bening',
        ]);

        barang_varian::create([
            'barang_id' => 1,
            'varian_id' => 1,
        ]);

        barang_varian::create([
            'barang_id' => 1,
            'varian_id' => 2,
        ]);

        barang_varian::create([
            'barang_id' => 1,
            'varian_id' => 3,
        ]);

        barang_varian::create([
            'barang_id' => 1,
            'varian_id' => 4,
        ]);

        barang_varian::create([
            'barang_id' => 1,
            'varian_id' => 5,
        ]);

        barang_varian::create([
            'barang_id' => 1,
            'varian_id' => 6,
        ]);

        barang_varian::create([
            'barang_id' => 2,
            'varian_id' => 7,
        ]);

        barang_varian::create([
            'barang_id' => 2,
            'varian_id' => 8,
        ]);

        barang_varian::create([
            'barang_id' => 2,
            'varian_id' => 9,
        ]);

        barang_varian::create([
            'barang_id' => 2,
            'varian_id' => 1,
        ]);

        barang_varian::create([
            'barang_id' => 2,
            'varian_id' => 3,
        ]);

        barang_jenis_varian::create([
            'barang_id' => 1,
            'jenis_varian_id' => 1,
        ]);

        barang_jenis_varian::create([
            'barang_id' => 1,
            'jenis_varian_id' => 2,
        ]);

        barang_jenis_varian::create([
            'barang_id' => 2,
            'jenis_varian_id' => 1,
        ]);

        barang_jenis_varian::create([
            'barang_id' => 2,
            'jenis_varian_id' => 2,
        ]);

        sku::create([
            'id' => 1,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-PTH-50x50',
            'n_sku' => 'Plastik Rajawali Putih 50x50',
            'key' => 'A',
            'harga' => 28000,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 2,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-MRH-50x50',
            'n_sku' => 'Plastik Rajawali Merah 50x50',
            'key' => 'B',
            'harga' => 29500,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 3,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-HTM-50x50',
            'n_sku' => 'Plastik Rajawali Hitam 50x50',
            'key' => 'C',
            'harga' => 32000,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 4,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-PTH-30x30',
            'n_sku' => 'Plastik Rajawali Putih 30x30',
            'key' => 'D',
            'harga' => 23500,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 5,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-MRH-30x30',
            'n_sku' => 'Plastik Rajawali Merah 30x30',
            'key' => 'E',
            'harga' => 25000,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 6,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-HTM-30x30',
            'n_sku' => 'Plastik Rajawali Hitam 30x30',
            'key' => 'F',
            'harga' => 27500,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 7,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-PTH-20x20',
            'n_sku' => 'Plastik Rajawali Putih 20x20',
            'key' => 'G',
            'harga' => 19000,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 8,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-MRH-20x20',
            'n_sku' => 'Plastik Rajawali Merah 20x20',
            'key' => 'H',
            'harga' => 20500,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 9,
            'barang_id' => 1,
            'kode_sku' => 'PLSTK-RJWL-HTM-20x20',
            'n_sku' => 'Plastik Rajawali Hitam 20x20',
            'key' => 'I',
            'harga' => 22000,
            'stok' => 100,
            'status' => 'aktif',
        ]);

        sku_detail::create([
            'sku_id' => 1,
            'varian_id' => 1,
        ]);

        sku_detail::create([
            'sku_id' => 1,
            'varian_id' => 4,
        ]);

        sku_detail::create([
            'sku_id' => 2,
            'varian_id' => 2,
        ]);

        sku_detail::create([
            'sku_id' => 2,
            'varian_id' => 4,
        ]);

        sku_detail::create([
            'sku_id' => 3,
            'varian_id' => 3,
        ]);

        sku_detail::create([
            'sku_id' => 3,
            'varian_id' => 4,
        ]);

        sku_detail::create([
            'sku_id' => 4,
            'varian_id' => 1,
        ]);

        sku_detail::create([
            'sku_id' => 4,
            'varian_id' => 5,
        ]);

        sku_detail::create([
            'sku_id' => 5,
            'varian_id' => 2,
        ]);

        sku_detail::create([
            'sku_id' => 5,
            'varian_id' => 5,
        ]);

        sku_detail::create([
            'sku_id' => 6,
            'varian_id' => 3,
        ]);

        sku_detail::create([
            'sku_id' => 6,
            'varian_id' => 5,
        ]);

        sku_detail::create([
            'sku_id' => 7,
            'varian_id' => 1,
        ]);

        sku_detail::create([
            'sku_id' => 7,
            'varian_id' => 6,
        ]);

        sku_detail::create([
            'sku_id' => 8,
            'varian_id' => 2,
        ]);

        sku_detail::create([
            'sku_id' => 8,
            'varian_id' => 6,
        ]);
            
        sku_detail::create([
            'sku_id' => 9,
            'varian_id' => 3,
        ]);

        sku_detail::create([
            'sku_id' => 9,
            'varian_id' => 6,
        ]);

        sku::create([
            'id' => 10,
            'barang_id' => 2,
            'kode_sku' => 'PLSTK-BYLL-PTH-30x40',
            'n_sku' => 'Plastik Boyolali Putih 30x40',
            'key' => 'J',
            'harga' => 14000,
            'stok' => 150,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 11,
            'barang_id' => 2,
            'kode_sku' => 'PLSTK-BYLL-HTM-30x40',
            'n_sku' => 'Plastik Boyolali Hitam 30x40',
            'key' => 'K',
            'harga' => 15000,
            'stok' => 150,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 12,
            'barang_id' => 2,
            'kode_sku' => 'PLSTK-BYLL-BNNG-30x40',
            'n_sku' => 'Plastik Boyolali Bening 30x40',
            'key' => 'L',
            'harga' => 12000,
            'stok' => 150,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 13,
            'barang_id' => 2,
            'kode_sku' => 'PLSTK-BYLL-PTH-30x20',
            'n_sku' => 'Plastik Boyolali Putih 30x20',
            'key' => 'M',
            'harga' => 11000,
            'stok' => 150,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 14,
            'barang_id' => 2,
            'kode_sku' => 'PLSTK-BYLL-HTM-30x20',
            'n_sku' => 'Plastik Boyolali Hitam 30x20',
            'key' => 'N',
            'harga' => 12500,
            'stok' => 150,
            'status' => 'aktif',
        ]);

        sku::create([
            'id' => 15,
            'barang_id' => 2,
            'kode_sku' => 'PLSTK-BYLL-BNNG-30x20',
            'n_sku' => 'Plastik Boyolali Bening 30x20',
            'key' => 'O',
            'harga' => 10000,
            'stok' => 150,
            'status' => 'aktif',
        ]);

        sku_detail::create([
            'sku_id' => 10,
            'varian_id' => 7,
        ]);
        
        sku_detail::create([
            'sku_id' => 10,
            'varian_id' => 1,
        ]);
        
        sku_detail::create([
            'sku_id' => 11,
            'varian_id' => 7,
        ]);

        sku_detail::create([
            'sku_id' => 11,
            'varian_id' => 3,
        ]);

        sku_detail::create([
            'sku_id' => 12,
            'varian_id' => 7,
        ]);

        sku_detail::create([
            'sku_id' => 12,
            'varian_id' => 9,
        ]);

        sku_detail::create([
            'sku_id' => 13,
            'varian_id' => 8,
        ]);

        sku_detail::create([
            'sku_id' => 13,
            'varian_id' => 1,
        ]);
        
        sku_detail::create([
            'sku_id' => 14,
            'varian_id' => 8,
        ]);

        sku_detail::create([
            'sku_id' => 14,
            'varian_id' => 3,
        ]);
        
        sku_detail::create([
            'sku_id' => 15,
            'varian_id' => 8,
        ]);
        
        sku_detail::create([
            'sku_id' => 15,
            'varian_id' => 9,
        ]);
    }
}
