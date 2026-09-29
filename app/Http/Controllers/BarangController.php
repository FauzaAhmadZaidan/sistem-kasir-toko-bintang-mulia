<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator as Val;
use App\Models\barang;

class BarangController extends Controller
{
    //
    public function addNewBarang(Request $request)
    {
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id_kategori' => 'required|integer|exists:kategori,id',
            'n_barang' => 'required|string',
            'kode' => 'nullable|string',
            'harga' => 'nullable|integer',
            'total_stok' => 'required|integer',
            'status' => 'required|string|in:aktif,tidak aktif',
            'gambar' => 'nullable|string',
            'has_varian' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $newBarang = barang::create([
            'id_kategori' => $validatedData['id_kategori'],
            'n_barang' => $validatedData['n_barang'],
            'kode' => $validatedData['kode'],
            'harga' => $validatedData['harga'],
            'total_stok' => $validatedData['total_stok'],
            'status' => $validatedData['status'],
            'gambar' => $validatedData['gambar'],
            'has_varian' => $validatedData['has_varian'],
        ]);

        return response()->json([
            'message' => 'Barang created successfully',
            'barang' => $newBarang,
        ], 201);
    }

    public function updateBarang(Request $request)
    {
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id' => 'required|integer|exists:barang,id',
            'id_kategori' => 'sometimes|integer|exists:kategori,id',
            'n_barang' => 'sometimes|string',
            'kode' => 'sometimes|string',
            'harga' => 'sometimes|integer',
            'total_stok' => 'sometimes|integer',
            'status' => 'sometimes|string|in:aktif,tidak aktif',
            'gambar' => 'sometimes|string',
            'has_varian' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $barang = barang::find($validatedData['id']);

        if (!$barang) {
            return response()->json([
                'message' => 'Barang not found',
            ], 404);
        }

        if (isset($validatedData['id_kategori'])) {
            $barang->id_kategori = $validatedData['id_kategori'];
        }

        if (isset($validatedData['n_barang'])) {
            $barang->n_barang = $validatedData['n_barang'];
        }

        if (isset($validatedData['kode'])) {
            $barang->kode = $validatedData['kode'];
        }

        if (isset($validatedData['harga'])) {
            $barang->harga = $validatedData['harga'];
        }

        if (isset($validatedData['total_stok'])) {
            $barang->total_stok = $validatedData['total_stok'];
        }

        if (isset($validatedData['status'])) {
            $barang->status = $validatedData['status'];
        }

        if (isset($validatedData['gambar'])) {
            $barang->gambar = $validatedData['gambar'];
        }

        if (isset($validatedData['has_varian'])) {
            $barang->has_varian = $validatedData['has_varian'];
        }

        $barang->save();

        return response()->json([
            'message' => 'Barang updated successfully',
            'barang' => $barang,
        ], 200);
    }
}
