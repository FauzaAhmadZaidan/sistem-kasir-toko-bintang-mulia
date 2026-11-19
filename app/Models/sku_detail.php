<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class sku_detail extends Model
{
    //
    protected $table = 'sku_detail';

    protected $fillable = [
        'sku_id',
        'varian_id',
    ];

    public function sku()
    {
        return $this->belongsTo(sku::class);
    }

    public function varian()
    {
        return $this->belongsTo(varian::class);
    }
}
