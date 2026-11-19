<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class barang_jenis_varian extends Model
{
    //
    protected $table = 'barang_jenis_varian';

    protected $fillable = [
        'barang_id',
        'jenis_varian_id',
    ];
}
