<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\DashboradController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::get('/login', [AuthController::class, 'toLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth')->group(function () {
    Route::get('/admin/dashboard', [DashboradController::class, 'adminDashboard'])->name('dashboard.admin');

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

Route::get('/preview/kasir', function () {
    abort_unless(app()->environment('local'), 404);

    return Inertia::render('Cashier/Index');
})->name('preview.kasir');

