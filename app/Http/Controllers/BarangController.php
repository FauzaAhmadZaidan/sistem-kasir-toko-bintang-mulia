<?php

namespace App\Http\Controllers;

use App\Http\Resources\KasirBarangResource;
use App\Models\kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator as Val;
use App\Models\barang;

class BarangController extends Controller
{
    //
    public function tambahBarang(Request $request)
    {
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'kategori_barang' => 'required|string|max:255',
            'nama_barang' => 'required|string|max:255',
            'has_varian' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        [$kategori, $barang] = DB::transaction(function () use ($validatedData) {
            $kategori = kategori::firstOrCreate(['n_kategori' => $validatedData['kategori_barang']]);

            $barang = barang::create([
                'kategori_id' => $kategori->id,
                'n_barang' => $validatedData['nama_barang'],
                'has_varian' => $validatedData['has_varian'],
            ]);

            return [$kategori, $barang];
        });

        return response()->json([
            'message' => 'Barang created successfully',
            'kategori' => $kategori,
            'barang' => $barang,
        ], 201);
    }

    public function getBarangAdmin()
    {
        $barang = barang::query()
            ->select('id', 'kategori_id', 'n_barang', 'status', 'has_varian', 'gambar')
            ->with([
                'kategori:id,n_kategori',
                'jenis_varians:id,n_jenis_varian',
                'varians:id,jenis_varian_id,n_varian',
                'skus:id,barang_id,kode_sku,n_sku,harga,stok,status',
            ])
            ->orderBy('n_barang')
            ->get();

        $barang->each(function (barang $item) {
            $item->has_varian = $item->has_varian === null ? null : (bool) $item->has_varian;
            $item->setAttribute('gambar_url', $item->gambar ? asset('storage/' . $item->gambar) : null);
        });

        return response()->json([
            'data' => $barang,
            'kategori' => kategori::orderBy('n_kategori')->get(['id', 'n_kategori']),
        ]);
    }

    public function simpanFoto(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|integer|exists:barang,id',
            'gambar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);
        $path = $validatedData['gambar']->store('barang', 'public');

        if (!$path) {
            return response()->json(['message' => 'Foto gagal disimpan. Coba lagi.'], 500);
        }

        try {
            DB::transaction(function () use ($validatedData, $path) {
                $target = barang::query()->lockForUpdate()->findOrFail($validatedData['id']);
                $target->gambar = $path;
                $target->save();
            });
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($path);
            throw $exception;
        }

        return response()->json(['message' => 'Foto barang disimpan.']);
    }

    public function getBarang() {
        $user = Auth::user();

        if ($user->role != 'user') {
            return response()->json([
                'message' => 'Harap login dengan akun user',
            ], 403);
        }

        $barang = barang::query()
        ->where('status', 'aktif')
        ->whereHas('skus', function ($query) {
            $query->where('status', 'aktif')->whereNotNull('harga');
        })
        ->with([
            'kategori',
            'varians',
            'jenis_varians',

            'skus' => function ($query) {
                $query->where('status', 'aktif')
                    ->whereNotNull('harga')
                    ->with('varians');
            },
        ])
        ->orderBy('n_barang')
        ->get();

        return KasirBarangResource::collection($barang);
        // return response()->json([
        //     'message' => 'Barang fetched successfully',
        //     'data' => $barang,
        // ]);
    }

    public function editBarang(Request $request) {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Not signed in',
            ], 403);
        }

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id' => 'required|integer',
            'kategori_id' => 'sometimes|integer|exists:kategori,id',
            'n_barang' => 'sometimes|string|max:255',
            'has_varian' => 'sometimes|boolean',
            'status' => 'sometimes|in:aktif,tidak aktif',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        return DB::transaction(function () use ($validatedData) {
            $target = barang::query()->lockForUpdate()->find($validatedData['id']);

            if (!$target) {
                return response()->json(['message' => 'Barang not found'], 404);
            }

            if (isset($validatedData['has_varian'])
                && ($target->has_varian === null || (bool) $target->has_varian !== (bool) $validatedData['has_varian'])
                && ($target->skus()->exists() || $target->jenis_varians()->exists())) {
                return response()->json(['message' => 'Tipe barang sudah terkunci karena varian atau SKU telah dibuat.'], 409);
            }

            $target->update(Arr::except($validatedData, ['id']));

            return response()->json([
                'message' => 'Barang updated successfully',
                'data' => $target,
            ], 200);
        });
    }
}
