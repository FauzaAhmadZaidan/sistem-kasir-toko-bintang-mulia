<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class transaksi extends Model
{
    //
    protected $table = 'transaksi';

    protected $fillable = [
        'user_id',
        'invoice',
        'total',
        'bayar',
        'kembalian',
    ];

    public $timestamps = true;

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function detail_transaksi()
    {
        return $this->hasMany(detail_transaksi::class);
    }

}
