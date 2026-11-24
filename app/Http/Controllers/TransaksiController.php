<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransaksiResource;
use App\Models\barang;
use App\Models\detail_transaksi;
use App\Models\sku;
use App\Models\transaksi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator as Val;
use Illuminate\Validation\ValidationException;

class TransaksiController extends Controller
{
    public function SaveTransaction(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->role != 'user' || $user->status != 'aktif') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $validator = Val::make($request->all(), [
            'bayar' => 'required|integer|min:0|max:2147483647',
            'total' => 'sometimes|integer|min:0|max:2147483647',
            'kode_checkout' => 'nullable|uuid',
            'items' => 'required|array|min:1|max:200',
            'items.*.id' => 'required|integer|distinct|exists:sku,id',
            'items.*.qty' => 'required|integer|min:1|max:2147483647',
            'items.*.harga' => 'sometimes|integer|min:0|max:2147483647',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors(),
            ], 400);
        }

        $validatedData = $validator->validated();

        $hasil = DB::transaction(function () use ($validatedData, $user) {
            // Serialisasi checkout kasir yang sama, termasuk pengiriman ulang.
            $kasir = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            abort_unless($kasir->role === 'user' && $kasir->status === 'aktif', 403);

            if (!empty($validatedData['kode_checkout'])) {
                $lama = transaksi::where('user_id', $kasir->id)
                    ->where('kode_checkout', $validatedData['kode_checkout'])
                    ->with('detail_transaksi')->first();

                if ($lama) {
                    $itemsLama = $lama->detail_transaksi->mapWithKeys(fn ($item) => [$item->sku_id => (int) $item->jumlah])->sortKeys()->all();
                    $itemsBaru = collect($validatedData['items'])->mapWithKeys(fn ($item) => [$item['id'] => (int) $item['qty']])->sortKeys()->all();
                    if ($itemsLama !== $itemsBaru || (int) $lama->bayar !== (int) $validatedData['bayar'] ||
                        (isset($validatedData['total']) && (int) $lama->total !== (int) $validatedData['total'])) {
                        throw ValidationException::withMessages(['kode_checkout' => 'Kode checkout sudah digunakan untuk transaksi lain.']);
                    }
                    return $lama;
                }
            }

            // Kunci SKU dalam urutan yang sama supaya stok tidak terjual dua kali.
            $skus = sku::whereIn('id', array_column($validatedData['items'], 'id'))
                ->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $barang = barang::whereIn('id', $skus->pluck('barang_id'))
                ->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $skus->load('varians');
            $total = 0;

            foreach ($validatedData['items'] as $item) {
                $sku = $skus->get($item['id']);
                $produk = $sku ? $barang->get($sku->barang_id) : null;
                if (!$sku || !$produk || $sku->status !== 'aktif' || $produk->status !== 'aktif' ||
                    $sku->harga === null || $sku->harga < 0 || $sku->stok < $item['qty']) {
                    throw ValidationException::withMessages(['items' => 'Barang tidak tersedia atau stok tidak cukup. Muat ulang katalog dan sesuaikan keranjang.']);
                }
                if (isset($item['harga']) && (int) $item['harga'] !== (int) $sku->harga) {
                    throw ValidationException::withMessages(['items' => 'Harga barang berubah. Muat ulang katalog dan sesuaikan keranjang.']);
                }
                $total += (int) $sku->harga * (int) $item['qty'];
            }

            if ($total > 2147483647) {
                throw ValidationException::withMessages(['total' => 'Total transaksi melebihi batas yang didukung.']);
            }
            if (isset($validatedData['total']) && (int) $validatedData['total'] !== $total) {
                throw ValidationException::withMessages(['total' => 'Total belanja berubah. Muat ulang katalog dan sesuaikan keranjang.']);
            }
            if ($validatedData['bayar'] < $total) {
                throw ValidationException::withMessages(['bayar' => 'Uang diterima belum mencukupi total belanja.']);
            }

            $kolomDetail = Schema::getColumnListing('detail_transaksi');
            $date = Carbon::now();
            $invoiceDasar = 'TR|' . $kasir->id . '|' . $date->copy()->timezone('Asia/Jakarta')->format('dmyHi');
            $invoice = $invoiceDasar;
            // Checkout kasir yang sama sudah dikunci. Tambahkan urutan jika menitnya sama.
            for ($urutan = 2; transaksi::where('user_id', $kasir->id)->where('invoice', $invoice)->exists(); $urutan++) {
                $invoice = $invoiceDasar . '|' . $urutan;
            }

            $transaksi = transaksi::create([
                'user_id' => $kasir->id,
                'nama_kasir' => $kasir->username,
                'kode_checkout' => $validatedData['kode_checkout'] ?? null,
                'invoice' => $invoice,
                'waktu' => $date,
                'total' => $total,
                'bayar' => $validatedData['bayar'],
                'kembalian' => $validatedData['bayar'] - $total,
            ]);

            foreach ($validatedData['items'] as $item) {
                $sku = $skus->get($item['id']);
                $produk = $barang->get($sku->barang_id);
                $detail = new detail_transaksi([
                    'transaksi_id' => $transaksi->id,
                    'sku_id' => $sku->id,
                    'jumlah' => $item['qty'],
                    'nama_barang' => $produk->n_barang,
                    'kode_sku' => $sku->kode_sku,
                    'nama_varian' => $sku->varians->pluck('n_varian')->implode(' · ') ?: ($produk->has_varian ? $sku->n_sku : ''),
                    'harga' => $sku->harga,
                ]);
                // Skema awal mewajibkan barang dan subtotal di setiap detail.
                if (in_array('barang_id', $kolomDetail, true)) {
                    $detail->barang_id = $produk->id;
                }
                if (in_array('total_harga', $kolomDetail, true)) {
                    $detail->total_harga = (int) $sku->harga * (int) $item['qty'];
                }
                $detail->save();

                $sku->stok -= $item['qty'];
                $sku->save();
            }

            return $transaksi;
        }, 3);

        $hasil->load(['user', 'detail_transaksi.sku.barang', 'detail_transaksi.barang']);

        return response()->json([
            'message' => 'Action success',
            'data' => new TransaksiResource($hasil),
        ], 200)->header('Cache-Control', 'no-store, private');
    }

    public function getTransaksi(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'user']) || $user->status != 'aktif') {
            return response()->json(['message' => 'You are not authorized to perform this action'], 403);
        }

        $rules = [
            'cari' => 'nullable|string|max:100',
            'tanggal_mulai' => 'nullable|date_format:Y-m-d',
            'tanggal_selesai' => 'nullable|date_format:Y-m-d',
            'page' => 'sometimes|integer|min:1',
        ];
        if ($request->filled('tanggal_mulai') && $request->filled('tanggal_selesai')) {
            $rules['tanggal_selesai'] .= '|after_or_equal:tanggal_mulai';
        }
        if ($user->role === 'admin') {
            $rules['kasir_id'] = 'nullable|integer|exists:users,id';
        }
        $validator = Val::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['message' => 'Filter tidak valid', 'error' => $validator->errors()], 400);
        }
        $validatedData = $validator->validated();

        $query = transaksi::query();
        // Batas kepemilikan selalu diterapkan sebelum filter dari browser.
        if ($user->role === 'user') {
            $query->where('user_id', $user->id);
        } elseif (!empty($validatedData['kasir_id'])) {
            $query->where('user_id', $validatedData['kasir_id']);
        }
        if (!empty($validatedData['cari'])) {
            $query->where('invoice', 'like', '%' . $validatedData['cari'] . '%');
        }
        foreach (['tanggal_mulai' => '>=', 'tanggal_selesai' => '<'] as $field => $operator) {
            if (!empty($validatedData[$field])) {
                $date = Carbon::parse($validatedData[$field], 'Asia/Jakarta')->startOfDay();
                if ($field === 'tanggal_selesai') {
                    $date->addDay();
                }
                $query->where('waktu', $operator, $date->setTimezone(config('app.timezone'))->toDateTimeString());
            }
        }

        $ringkasan = (clone $query)->selectRaw('COUNT(*) as jumlah_transaksi, COALESCE(SUM(total), 0) as total_penjualan')->first();
        $jumlahItem = detail_transaksi::whereIn('transaksi_id', (clone $query)->select('id'))->sum('jumlah');
        $data = $query->with('user')->withSum('detail_transaksi as jumlah_item', 'jumlah')
            ->orderByDesc('waktu')->orderByDesc('id')->paginate(10);

        return response()->json([
            'message' => 'Data fetched successfully',
            'data' => TransaksiResource::collection($data->getCollection()),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'total' => $data->total(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem(),
            ],
            'ringkasan' => [
                'jumlah_transaksi' => (int) $ringkasan->jumlah_transaksi,
                'total_penjualan' => (int) $ringkasan->total_penjualan,
                'jumlah_item' => (int) $jumlahItem,
            ],
            'kasir' => $user->role === 'admin'
                ? User::where('role', 'user')->orWhereIn('id', transaksi::select('user_id'))->orderBy('username')->get(['id', 'username'])
                : [],
        ])->header('Cache-Control', 'no-store, private');
    }

    public function getDetailTransaksi($id)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'user']) || $user->status != 'aktif') {
            return response()->json(['message' => 'You are not authorized to perform this action'], 403);
        }

        $query = transaksi::with(['user', 'detail_transaksi.sku.barang', 'detail_transaksi.barang']);
        if ($user->role === 'user') {
            $query->where('user_id', $user->id);
        }
        $data = $query->find($id);
        if (!$data) {
            return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Data fetched successfully',
            'data' => new TransaksiResource($data),
        ])->header('Cache-Control', 'no-store, private');
    }
}
