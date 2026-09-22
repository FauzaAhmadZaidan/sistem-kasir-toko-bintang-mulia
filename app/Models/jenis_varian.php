<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class jenis_varian extends Model
{
    //
    protected $table = 'jenis_varian';

    protected $fillable = [
        'n_jenis_varian',
        'status',
    ];

    public function barang()
    {
        return $this->hasMany(barang::class);
    }

    public function varian()
    {
        return $this->hasMany(varian::class);
    }
}
