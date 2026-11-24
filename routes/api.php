<?php

use App\Http\Controllers\BarangController;
use App\Http\Controllers\JenisVarianController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\SkuController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\VarianController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

#Auth
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {


    #Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    #Users
    Route::post('/extend-token', [AuthController::class, 'extendToken']);
    Route::post('/user/create', [AuthController::class, 'createUser']);
    Route::post('/user/deactive', [AuthController::class, 'deactiveUser']);
    Route::post('/user/reactive', [AuthController::class, 'reactiveUser']);
    Route::post('/user/edit', [AuthController::class, 'editUser']);
    Route::get('/users', [AuthController::class, 'viewUsers']);

    #Kategori
    Route::get('/kategori/get', [KategoriController::class, 'getKategori']);
    Route::post('/kategori/create', [KategoriController::class, 'createNewKategori']);
    Route::post('/kategori/edit', [KategoriController::class, 'updateKategori']);

    #Barang
    Route::post('/barang/add', [BarangController::class, 'tambahBarang']);
    Route::get('/barang/get', [BarangController::class, 'getBarang']);
    Route::post('/barang/edit', [BarangController::class, 'editBarang']);


    #JenisVarian
    Route::post('/jenis-varian/create', [JenisVarianController::class, 'createNewJenisVarian']);
    Route::post('/jenis-varian/edit', [JenisVarianController::class, 'updateJenisVarian']);
    Route::get('/jenis-varian/get', [JenisVarianController::class, 'getJenisVarians']);

    #Varian
    Route::post('varian/add', [VarianController::class, 'tambahVarian']);
    Route::get('/varian/get', [VarianController::class, 'getVarian']);
    Route::post('/varian/edit', [VarianController::class, 'updateVarian']);
    Route::post('/varian/create', [VarianController::class, 'createNewVarian']);

    #Sku
    Route::post('/sku/generate', [SkuController::class, 'generateSKU']);
    Route::post('sku/get', [SkuController::class, 'getSkuBarang']);
    Route::post('/sku/edit', [SkuController::class, 'editSku']);

    #Transaksi
    Route::post('/transaksi/store', [TransaksiController::class, 'SaveTransaction']);
    Route::get('/transaksi', [TransaksiController::class, 'getTransaksi']);
    Route::get('/transaksi/{id}', [TransaksiController::class, 'getDetailTransaksi'])->whereNumber('id');
});
