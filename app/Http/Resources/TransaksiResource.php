<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransaksiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'invoice' => $this->invoice,
            'waktu' => $this->waktu === null ? null : Carbon::parse($this->waktu)->toIso8601String(),
            'kasir' => ['id' => $this->user_id, 'username' => $this->nama_kasir ?? $this->user?->username ?? 'Kasir'],
            'total' => (int) $this->total,
            'bayar' => (int) $this->bayar,
            'kembalian' => (int) $this->kembalian,
            'jumlah_item' => (int) ($this->jumlah_item ?? ($this->relationLoaded('detail_transaksi') ? $this->detail_transaksi->sum('jumlah') : 0)),
            'items' => $this->whenLoaded('detail_transaksi', function () {
                return $this->detail_transaksi->map(function ($item) {
                    $harga = $item->harga === null ? null : (int) $item->harga;
                    $subtotal = $item->total_harga ?? ($harga === null ? null : $harga * (int) $item->jumlah);

                    return [
                        'id' => $item->id,
                        'sku_id' => $item->sku_id,
                        'nama_barang' => $item->nama_barang ?? $item->sku?->barang?->n_barang ?? $item->barang?->n_barang ?? 'Barang lama',
                        'kode_sku' => $item->kode_sku ?? $item->sku?->kode_sku,
                        'nama_varian' => $item->nama_varian ?? $item->sku?->n_sku ?? '',
                        'jumlah' => (int) $item->jumlah,
                        // Harga lama tidak bisa ditentukan dari harga SKU saat ini.
                        'harga' => $harga,
                        'subtotal' => $subtotal === null ? null : (int) $subtotal,
                    ];
                });
            }),
        ];
    }
}
