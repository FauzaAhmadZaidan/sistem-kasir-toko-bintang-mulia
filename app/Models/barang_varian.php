<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class barang_varian extends Model
{
    //
    protected $table = 'barang_varian';

    protected $fillable = [
        'barang_id',
        'varian_id',
    ];

    public function barang()
    {
        return $this->belongsTo(barang::class);
    }

    public function varian()
    {
        return $this->belongsTo(varian::class);
    }
}
