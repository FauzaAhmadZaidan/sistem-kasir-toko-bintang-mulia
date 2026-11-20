<?php

namespace App\Http\Controllers;

use App\Http\Resources\KasirBarangResource;
use App\Models\kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            'kategori_barang' => 'required|string',
            'nama_barang' => 'required|string',
            'has_varian' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $kategori = kategori::firstOrCreate([
            'n_kategori' => $validatedData['kategori_barang'],
        ]);

        $barang = barang::create([
            'kategori_id' => $kategori->id,
            'n_barang' => $validatedData['nama_barang'],
            'has_varian' => $validatedData['has_varian'],
        ]);

        return response()->json([
            'message' => 'Barang created successfully',
            'kategori' => $kategori,
            'barang' => $barang,
        ], 201);
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
            'kategori_id' => 'sometimes|integer',
            'n_barang' => 'sometimes|string',
            'has_varian' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $target = barang::find( $validatedData['id']);
        
        if (!$target) {
            return response()->json([
                'message' => 'Barang not found',
            ], 404);
        }

        if (isset($validatedData['kategori_id'])) {
            $target->kategori_id = $validatedData['kategori_id'];
        }

        if (isset($validatedData['n_barang'])) {
            $target->n_barang = $validatedData['n_barang'];
        }

        if (isset($validatedData['has_varian'])) {
            $target->has_varian = $validatedData['has_varian'];
        }

        $target->save();

        return response()->json([
            'message' => 'Barang updated successfully',
            'data' => $target,
        ], 200);
    }
}