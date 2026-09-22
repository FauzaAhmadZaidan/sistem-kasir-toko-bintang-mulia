<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class kategori extends Model
{
    //
    protected $table = 'kategori';

    protected $fillable = [
        'n_kategori',
    ];

    public function barang()
    {
        return $this->hasMany(barang::class);
    }
}
