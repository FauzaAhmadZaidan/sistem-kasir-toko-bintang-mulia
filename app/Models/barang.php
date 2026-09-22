<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class barang extends Model
{
    //
    protected $table = 'barang';

    protected $fillable = ['kategori_id', 'n_barang', 'harga', 'total_stok', 'status', 'gambar', 'has_varian'];

    public function kategori()
    {
        return $this->belongsTo(kategori::class);
    }

    public function jenis_varian()
    {
        return $this->hasMany(jenis_varian::class);
    }

    public function varian()
    {
        return $this->hasMany(varian::class);
    }
}
