<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class varian extends Model
{
    //
    protected $table = 'varian';

    protected $fillable = [
        'jenis_varian_id',
        'n_varian',
        'harga',
        'tambahan_harga',
        'stok',
    ];

    public function jenis_varian()
    {
        return $this->belongsTo(jenis_varian::class);
    }

    public function log_stok()
    {
        return $this->hasMany(log_stok::class);
    }
}

