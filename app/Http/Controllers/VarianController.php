<?php

namespace App\Http\Controllers;

use App\Models\barang;
use App\Models\barang_jenis_varian;
use App\Models\barang_varian;
use App\Models\jenis_varian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
        ]);

        return response()->json([
            'message' => 'Varian created successfully',
            'data' => $newVarian
        ], 201);
    }

    public function updateVarian(Request $request)
    {
        //
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'id' => 'required|integer',
            'jenis_varian_id' => 'sometimes|integer',
            'n_varian' => 'sometimes|string',
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

        if (isset($validatedData['jenis_varian_id'])) {
            $varian->jenis_varian_id = $validatedData['jenis_varian_id'];
        }

        $varian->save();

        return response()->json([
            'message' => 'Varian updated successfully',
            'data' => $varian
        ], 200);
    }

    public function tambahVarian(Request $request)
    {
        //
        $user = Auth::user();

        if ($user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'jenis_varian' => 'required|string|max:255',
            'barang_id' => 'required|integer|exists:barang,id',
            'varian' => 'required|array|min:1|max:500',
            'varian.*' => 'required|string|max:255|distinct:ignore_case',
        ]);

        $validatedData = $validator->validated();

        DB::transaction(function () use ($validatedData) {
            $barang = barang::query()->lockForUpdate()->findOrFail($validatedData['barang_id']);
            abort_unless($barang->has_varian, 409, 'Aktifkan varian untuk barang ini terlebih dahulu.');

            $jenisVarian = jenis_varian::firstOrNew([
                'n_jenis_varian' => $validatedData['jenis_varian'],
            ]);

            if ($barang->skus()->exists()) {
                abort_unless($jenisVarian->exists && $barang->jenis_varians()->whereKey($jenisVarian->id)->exists(),
                    409, 'Jenis varian baru tidak bisa ditambahkan setelah SKU dibuat.');
            }

            if (!$jenisVarian->exists) {
                $jenisVarian = jenis_varian::firstOrCreate(['n_jenis_varian' => $validatedData['jenis_varian']]);
            }

            barang_jenis_varian::firstOrCreate([
                'barang_id' => $barang->id,
                'jenis_varian_id' => $jenisVarian->id,
            ]);

            foreach ($validatedData['varian'] as $n_varian) {
                $varian = varian::firstOrCreate([
                    'jenis_varian_id' => $jenisVarian->id,
                    'n_varian' => $n_varian,
                ]);

                barang_varian::firstOrCreate([
                    'barang_id' => $barang->id,
                    'varian_id' => $varian->id,
                ]);
            }

            $jumlahPilihan = $barang->varians()
                ->get(['varian.id', 'varian.jenis_varian_id'])
                ->countBy('jenis_varian_id');
            $kombinasi = 1;

            foreach ($jumlahPilihan as $jumlah) {
                $kombinasi *= $jumlah;
                abort_if($kombinasi > 500, 422, 'Pilihan ini melebihi batas 500 kombinasi SKU per barang.');
            }
        });

        return response()->json([
            'message' => 'Varian created successfully',
        ], 201);
    }

    public function getVarian(){

        $user = Auth::user();

        if (!$user || $user->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $varian = varian::all();
        return response()->json([
            'message' => 'Varian fetched successfully',
            'data' => $varian,
        ], 200);
    }
}
