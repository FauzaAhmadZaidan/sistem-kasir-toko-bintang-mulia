<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator as Val;
use Illuminate\Support\Facades\Auth;
use App\Models\jenis_varian;

class JenisVarianController extends Controller
{
    //
    public function createNewJenisVarian(Request $request)
    {
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'n_varian' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $newJenisVarian = jenis_varian::create([
            'n_varian' => $validatedData['n_varian'],
        ]);

        return response()->json([
            'message' => 'Jenis Varian created successfully',
            'data' => $newJenisVarian,
        ], 201);
    }

    public function updateJenisVarian(Request $request)
    {
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id' => 'required|integer',
            'n_varian' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        $jenisVarian = jenis_varian::find($validatedData['id']);

        if (!$jenisVarian) {
            return response()->json([
                'message' => 'Jenis Varian not found',
            ], 404);
        }

        $jenisVarian->n_varian = $validatedData['n_varian'];
        $jenisVarian->save();

        return response()->json([
            'message' => 'Jenis Varian updated successfully',
            'data' => $jenisVarian,
        ], 200);
    }
}
