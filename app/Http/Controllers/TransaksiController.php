<?php

namespace App\Http\Controllers;

use App\Models\detail_transaksi;
use App\Models\sku;
use App\Models\transaksi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator as Val;

class TransaksiController extends Controller
{
    //
    public function SaveTransaction(Request $request)
    {
        //
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Not Authenticated',
            ], 403);
        }

        if ($user->role != 'user') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'waktu' => 'required|string',
            'total' => 'required|integer',
            'bayar' => 'required|integer',
            'kembalian' => 'required|integer',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer|distinct:ignore_case|exists:sku,id',
            'items.*.qty' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ], 400);
        }

        $validatedData = $validator->validated();

        // return $validatedData;

        $hasil = DB::transaction(function () use ($validatedData, $user) {
            $date = Carbon::parse($validatedData['waktu']);
            $tanggal = $date->format('dmy');
            $jam = $date->format('Hi');
            $invoice = 'TR|' . $user->id . '|' .  $tanggal . $jam;

            $transaksi = transaksi::create([
                'user_id' => $validatedData['user_id'],
                'invoice' => $invoice,
                'waktu' => $date,
                'total' => $validatedData['total'],
                'bayar' => $validatedData['bayar'],
                'kembalian' => $validatedData['kembalian'],
            ]);

            foreach ($validatedData['items'] as $item) {
                detail_transaksi::create([
                    'transaksi_id' => $transaksi->id,
                    'sku_id' => $item['id'],
                    'jumlah' => $item['qty'],
                ]);

                $sku = sku::find($item['id']);
                $sku->stok -= $item['qty'];
                $sku->save();
            }

            return $transaksi;
        });

        return response()->json([
            'message' => 'Action success',
            'data' => $hasil
        ], 200);
    }
}
