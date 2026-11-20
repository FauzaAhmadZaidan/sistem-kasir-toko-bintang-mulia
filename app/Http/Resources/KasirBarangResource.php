<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class KasirBarangResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Kumpulkan ID varian dari SKU aktif
        |--------------------------------------------------------------------------
        */

        $varianAktifIds = $this->skus
            ->flatMap(function ($sku) {
                return $sku->varians->pluck('id');
            })
            ->unique()
            ->all();

        /*
        |--------------------------------------------------------------------------
        | 2. Susun data jenis varian + pilihan
        |--------------------------------------------------------------------------
        */

        $jenisVarian = $this->jenis_varians
            ->map(function ($jenis) use ($varianAktifIds) {

                $pilihan = $this->varians

                    // Ambil varian sesuai jenisnya.
                    ->where('jenis_varian_id', $jenis->id)

                    // Hanya pilihan dari SKU aktif.
                    ->filter(function ($varian) use ($varianAktifIds) {
                        return in_array(
                            $varian->id,
                            $varianAktifIds
                        );
                    })

                    ->map(function ($varian) {
                        return [
                            'id' => $varian->id,
                            'nama' => $varian->n_varian,
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'id' => $jenis->id,
                    'nama' => $jenis->n_jenis_varian,
                    'pilihan' => $pilihan,
                ];
            })

            ->filter(fn ($jenis) => count($jenis['pilihan']) > 0)
            ->values()
            ->all();

        /*
        |--------------------------------------------------------------------------
        | 3. Susun seluruh SKU aktif
        |--------------------------------------------------------------------------
        */

        $skus = $this->skus
            ->map(function ($sku) {
                $gambar = $sku->gambar ?? $this->gambar;

                return [
                    'id' => $sku->id,
                    'kode_sku' => $sku->kode_sku,
                    'nama_sku' => $sku->n_sku,
                    'harga' => (int) $sku->harga,
                    'stok' => (int) $sku->stok,

                    'gambar' => $gambar
                        ? url(Storage::disk('public')->url($gambar))
                        : null,

                    'varian_ids' => $sku->varians
                        ->pluck('id')
                        ->sort()
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        /*
        |--------------------------------------------------------------------------
        | 4. Response akhir barang
        |--------------------------------------------------------------------------
        */

        return [
            'id' => $this->id,
            'nama' => $this->n_barang,

            'kategori' => $this->kategori
                ? [
                    'id' => $this->kategori->id,
                    'nama' => $this->kategori->n_kategori,
                ]
                : null,

            'has_varian' => (bool) $this->has_varian,

            'jenis_varian' => $jenisVarian,

            'skus' => $skus,
        ];
    }
}
