<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\DashboradController;
use App\Http\Controllers\SkuController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VarianController;
use App\Http\Middleware\EnsureRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::get('/login', [AuthController::class, 'toLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth')->group(function () {
    Route::get('/admin/dashboard', [DashboradController::class, 'adminDashboard'])->name('dashboard.admin');

    Route::prefix('admin')->middleware(EnsureRole::class . ':admin')->group(function () {
        Route::get('/barang', [BarangController::class, 'getBarangAdmin'])->name('admin.barang');
        Route::post('/barang/add', [BarangController::class, 'tambahBarang']);
        Route::post('/barang/edit', [BarangController::class, 'editBarang']);
        Route::post('/barang/foto', [BarangController::class, 'simpanFoto']);
        Route::post('/varian/add', [VarianController::class, 'tambahVarian']);
        Route::post('/sku/generate', [SkuController::class, 'generateSKU']);
        Route::post('/sku/edit', [SkuController::class, 'editSku']);
    });

    Route::get('/admin/users/get-users', [UserController::class, 'viewUsers']);

    Route::get('/admin/users/check-username', [UserController::class, 'checkUsernameAvail']);

    Route::post('/admin/user/create',[UserController::class, 'createUser']);

    Route::patch('/admin/users/edit/{user}', [UserController::class, 'editUser']);

    Route::post('/admin/users/create', [UserController::class, 'createUser']);

    Route::get('/kasir/dashboard', [DashboradController::class, 'userDashboard'])->name('dashboard.user');

    Route::get('/kasir/katalog', [BarangController::class, 'getBarang'])->name('kasir.katalog');

    Route::get('/kasir', function (Request $request) {
        if ($request->user()->role === 'admin') {
            return redirect()->route('dashboard.admin');
        }

        return redirect(route('dashboard.user') . '#kasir');
    })->name('cashier');

    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('logout');
});

Route::get('/cek-frontend', function () {
    return Inertia::render('CekFrontend', [
        'namaToko' => 'Toko Bintang Mulia',
    ]);
});

