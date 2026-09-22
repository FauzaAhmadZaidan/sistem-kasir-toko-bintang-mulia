<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class log_stok extends Model
{
    //
    protected $table = 'log_stok';

    protected $fillable = [
        'barang_id',
        'varian_id',
        'jumlah',
        'tipe',
    ];

    public $timestamps = true;

    public function barang()
    {
        return $this->belongsTo(barang::class);
    }

    public function varian()
    {
        return $this->belongsTo(varian::class);
    }
}
