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
    ];

    public function jenis_varian()
    {
        return $this->belongsTo(jenis_varian::class);
    }

    public function barang_varian()
    {
        return $this->hasMany(barang_varian::class);
    }
}

