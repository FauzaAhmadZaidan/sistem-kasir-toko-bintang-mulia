<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator as Val;
use App\Models\varian;

class VarianController extends Controller
{
    //
    public function createNewVarian(Request $request)
    {
        //
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'jenis_varian_id' => 'required|integer',
            'n_varian' => 'required|string',
            'harga' => 'required|integer',
            'tambahan_harga' => 'required|integer',
            'stok' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $newVarian = varian::create([
            'jenis_varian_id' => $validatedData['jenis_varian_id'],
            'n_varian' => $validatedData['n_varian'],
            'harga' => $validatedData['harga'],
            'tambahan_harga' => $validatedData['tambahan_harga'],
            'stok' => $validatedData['stok'],
        ]);

        return response()->json([
            'message' => 'Varian created successfully',
            'data' => $newVarian
        ], 201);
    }

    public function updateVarian(Request $request){
        //
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id' => 'required|integer',
            'jenis_varian_id' => 'required|integer',
            'n_varian' => 'sometimes|string',
            'harga' => 'sometimes|integer',
            'tambahan_harga' => 'sometimes|integer',
            'stok' => 'sometimes|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $varian = varian::find($validatedData['id']);

        if (!$varian) {
            return response()->json([
                'message' => 'Varian not found',
            ], 404);
        }

        if (isset($validatedData['n_varian'])) {
            $varian->n_varian = $validatedData['n_varian'];
        }
        if (isset($validatedData['harga'])) {
            $varian->harga = $validatedData['harga'];
        }
        if (isset($validatedData['tambahan_harga'])) {
            $varian->tambahan_harga = $validatedData['tambahan_harga'];
        }
        if (isset($validatedData['stok'])) {
            $varian->stok = $validatedData['stok'];
        }

        $varian->save();

        return response()->json([
            'message' => 'Varian updated successfully',
            'data' => $varian
        ], 200);
    }
}
