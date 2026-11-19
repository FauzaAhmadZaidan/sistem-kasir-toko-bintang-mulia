<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class sku extends Model
{
    //
    protected $table = 'sku';

    protected $fillable = [
        'barang_id',
        'kode_sku',
        'key',
        'n_sku',
        'harga',
        'stok',
        'gambar',
        'status'
    ];

    public function barang()
    {
        return $this->belongsTo(barang::class);
    }

    public function sku_detail()
    {
        return $this->hasMany(sku_detail::class);
    }

    public function varians(){
        return $this->belongsToMany(varian::class, 'sku_detail', 'sku_id', 'varian_id');
    }

    public function detail_transaksi(){
        return $this->hasMany(detail_transaksi::class);
    }
}
