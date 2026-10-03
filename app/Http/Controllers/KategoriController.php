<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator as Val;
use App\Models\kategori;

class KategoriController extends Controller
{
    //
    public function createNewKategori(Request $request)
    {
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'n_kategori' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $newKategori = kategori::create([
            'n_kategori' => $validatedData['n_kategori'],
        ]);

        return response()->json([
            'message' => 'Kategori created successfully',
            'data' => $newKategori
        ], 200);
    }

    public function updateKategori(Request $request)
    {
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id' => 'required|integer',
            'n_kategori' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $kategori = kategori::find($validatedData['id']);

        if (!$kategori) {
            return response()->json([
                'message' => 'Kategori not found',
            ], 404);
        }

        $kategori->n_kategori = $validatedData['n_kategori'];
        $kategori->save();

        return response()->json([
            'message' => 'Kategori updated successfully',
            'data' => $kategori
        ], 200);
    }
}
