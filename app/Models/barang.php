<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class barang extends Model
{
    //
    protected $table = 'barang';

    protected $fillable = ['kategori_id', 'n_barang', 'status', 'has_varian'];

    public function kategori()
    {
        return $this->belongsTo(kategori::class);
    }

    public function sku()
    {
        return $this->hasMany(sku::class);
    }

    public function barang_varian()
    {
        return $this->hasMany(barang_varian::class);
    }

    public function jenis_varians()
    {
        return $this->belongsToMany(
            jenis_varian::class,
            'barang_jenis_varian',
            'barang_id',
            'jenis_varian_id'
        );
    }

    public function varians()
    {
        return $this->belongsToMany(
            varian::class,
            'barang_varian',
            'barang_id',
            'varian_id'
        );
    }

    public function skus()
    {
        return $this->hasMany(
            sku::class,
            'barang_id'
        );
    }
}
