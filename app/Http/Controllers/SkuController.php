<?php

namespace App\Http\Controllers;

use App\Models\barang;
use App\Models\sku;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator as Val;

class SkuController extends Controller
{
    //
    public function generateSKU(Request $request)
    {
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'barang_id' => 'required|integer|exists:barang,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $barang = barang::find($validatedData['barang_id']);

        if (!$barang) {
            return response()->json([
                'message' => 'Barang not found',
            ], 404);
        }

        if ($barang->has_varian === null) {
            return response()->json([
                'message' => 'Varian belum dikonfigurasikan',
            ], 400);
        }

        $hasil = DB::transaction(function () use ($barang, $validatedData) {
            $barang = Barang::query()
                ->whereKey($barang->id)
                ->lockForUpdate()
                ->firstOrFail();

            $jenis_varians = DB::table('barang_jenis_varian as bjv')
                ->join('jenis_varian as jv', 'bjv.jenis_varian_id', '=', 'jv.id')
                ->where('bjv.barang_id', $barang->id)
                ->orderBy('jv.id')
                ->select('jv.id', 'jv.n_jenis_varian')
                ->get();

            if ($barang->has_varian && $jenis_varians->isEmpty()) {
                return [
                    'action' => 'failed',
                    'message' => 'Barang memerlukan konfigurasi varian, tapi tidak ada jenis varian'
                ];
            }

            if (!$barang->has_varian && !$jenis_varians->isEmpty()) {
                return [
                    'action' => 'failed',
                    'message' => 'Barang tidak memerlukan konfigurasi varian, tapi ada jenis varian'
                ];
            }

            $grup_varians = [];
            $total_kombinasi = 1;

            foreach ($jenis_varians as $jenis) {
                $pilihan = DB::table('barang_varian as bv')
                    ->join('varian as v', 'v.id', '=', 'bv.varian_id')
                    ->where('bv.barang_id', $barang->id)
                    ->where('v.jenis_varian_id', $jenis->id)
                    ->orderBy('v.id')
                    ->select('v.id', 'v.n_varian')
                    ->get();

                if ($pilihan->isEmpty()) {
                    return response()->json([
                        'message' => 'Action failed',
                        'error' => 'Tidak ada varian untuk jenis varian ' . $jenis->n_jenis_varian
                    ], 400);
                }

                $total_kombinasi *= $pilihan->count();

                if ($total_kombinasi > 500) {
                    return response()->json([
                        'message' => 'Action failed',
                        'error' => 'Kombinasi varian terlalu banyak'
                    ]);
                }

                $grup_varians[] = $pilihan->all();
            }

            $kombinasi = [[]];

            foreach ($grup_varians as $pilihanJenis) {

                $baru = [];

                foreach ($kombinasi as $kombinasiSebelumnya) {

                    foreach ($pilihanJenis as $pilihan) {

                        $baru[] = [
                            ...$kombinasiSebelumnya,
                            $pilihan
                        ];
                    }
                }

                $kombinasi = $baru;
            }

            $dibuat = [];
            $dilewati = 0;

            foreach ($kombinasi as $pilihanVarian) {
                $ids = array_map(
                    fn($varian) => (int) $varian->id,
                    $pilihanVarian
                );

                $key = hash(
                    'sha256',
                    $barang->id . '|' . implode('-', $ids)
                );

                if (
                    sku::query()
                        ->where('key', $key)
                        ->exists()
                ) {
                    $dilewati++;
                    continue;
                }

                $namaProduk = $barang->n_barang;

                $kataNama = explode(' ', $namaProduk);

                $bagianNama = array_merge(
                    [$barang->n_barang],
                    array_map(
                        fn($varian) => $varian->n_varian,
                        $pilihanVarian
                    )
                );

                $kodeNama = implode(
                    '-',
                    array_map(
                        fn($nama) => $this->getCode($nama, 4),
                        $kataNama
                    )
                );

                $namaSKU = implode(' ', $bagianNama);

                $kodeVarian = implode(
                    '-',
                    array_map(
                        fn($varian) => $this->getCode($varian->n_varian, 4),
                        $pilihanVarian
                    )
                );
                
                if ($barang->has_varian) {
                    $kodeSKU = $kodeNama . '-' . $kodeVarian;
                }
                else {
                    $kodeSKU = $kodeNama;
                }

                $sku = sku::create([
                    'barang_id' => $barang->id,
                    'kode_sku' => $kodeSKU,
                    'n_sku' => $namaSKU,
                    'key' => $key,
                    'harga' => 0,
                    'stok' => 0,
                    'gambar' => null,
                    'status' => 'tidak aktif'
                ]);

                if ($ids !== []) {
                    $sku->varians()->attach($ids);
                }

                $dibuat[] = [
                    'id' => $sku->id,
                    'kode' => $sku->kode_sku,
                    'nama' => $sku->n_sku,
                    'varian_ids' => $ids
                ];
            }

            return [
                'action' => 'success',
                // 'namaSKU' => $namaSKU,
                // 'kodeSKU' => $kodeSKU,
                // 'PilihanVarian' => $pilihanVarian,
                // 'Kombinasi' => $kombinasi,
                // 'KataNama' => $kataNama,
                // 'KodeNama' => $kodeNama,
                // 'Key' => $key
                'barang_id' => $barang->id,
                'jumlah_kombinasi' => count($kombinasi),
                'jumlah_dibuat' => count($dibuat),
                'jumlah_dilewati' => $dilewati,
                'skus_baru' => $dibuat,
            ];
        });

        if ($hasil['action'] == 'failed') {
            return response()->json([
                'message' => 'Action failed',
                'error' => $hasil['message']
            ], 400);
        }

        return response()->json([
            'message' => 'Skus has been created successfully',
            // 'namaSKU' => $namaSKU,
            // 'kodeSKU' => $kodeSKU,
            // 'PilihanVarian' => $pilihanVarian,
            // 'Kombinasi' => $kombinasi,
            'data' => $hasil,
        ]);
    }

    public function getSkuBarang(Request $request) {
        $user = Auth::user();

        if (!$user || $user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id' => 'required|integer',
        ]);

        $barang = barang::find($request->id);

        if (!$barang) {
            return response()->json([
                'message' => 'Barang not found',
            ], 404);
        }

        $sku = sku::where('barang_id', $barang->id)->get();

        return response()->json([
            'message' => 'Success',
            'data' => $sku,
        ]);
    }

    public function editSku(Request $request) {
        $user = Auth::user();

        if (!$user || $user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id' => 'required|integer',
            'harga' => 'sometimes|integer',
            'stok' => 'sometimes|integer',
            'status' => 'sometimes|string',
            'gambar' => 'sometimes|string',
            'n_sku' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $sku = sku::find($validatedData['id']);

        if (!$sku) {
            return response()->json([
                'message' => 'Sku not found',
            ], 404);
        }

        if (isset($validatedData['harga'])) {
            $sku->harga = $validatedData['harga'];
        }

        if (isset($validatedData['stok'])) {
            $sku->stok = $validatedData['stok'];
        }

        if (isset($validatedData['status'])) {
            $sku->status = $validatedData['status'];
        }

        if (isset($validatedData['gambar'])) {
            $sku->gambar = $validatedData['gambar'];
        }

        if (isset($validatedData['n_sku'])) {
            $sku->n_sku = $validatedData['n_sku'];
        }

        $sku->save();

        return response()->json([
            'message' => 'Sku has been updated successfully',
            'data' => $sku,
        ]);

        //Rediant Was Here ;)
    }


    private function getCode(string $kata, int $jumlah)
    {
        $ubah = preg_replace(
            '/(?<!\b)[aiueoAIUEO]/',
            '',
            $kata
        );

        $kode = strtoupper(substr($ubah, 0, $jumlah));

        return $kode;
    }


}

