<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class detail_transaksi extends Model
{
    //
    protected $table = 'detail_transaksi';

    protected $fillable = [
        'transaksi_id',
        'sku_id',
        'jumlah',
        'nama_barang',
        'kode_sku',
        'nama_varian',
        'harga',
    ];

    public function transaksi()
    {
        return $this->belongsTo(transaksi::class);
    }

    public function barang()
    {
        return $this->belongsTo(barang::class);
    }

    public function sku()
    {
        return $this->belongsTo(sku::class);
    }
}
