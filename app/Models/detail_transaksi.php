<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class detail_transaksi extends Model
{
    //
    protected $table = 'detail_transaksi';

    protected $fillable = [
        'transaksi_id',
        'barang_id',
        'jumlah',
        'total_harga',
    ];

    public function transaksi()
    {
        return $this->belongsTo(transaksi::class);
    }

    public function barang()
    {
        return $this->belongsTo(barang::class);
    }
}
