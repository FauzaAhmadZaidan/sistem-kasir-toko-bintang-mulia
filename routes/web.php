<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;

Route::redirect('/', '/login');

Route::get('/login', function (Request $request) {
    $user = $request->user();

    if ($user && $user->status === 'aktif') {
        return redirect()->route(
            $user->role === 'admin'
                ? 'dashboard.admin'
                : 'dashboard.user'
        );
    }
    return Inertia::render('Auth/Login');
})->name('login');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:6,1')
    ->name('login.store');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard/admin', function (Request $request) {
        $user = $request->user();

        abort_unless(
            $user->status === 'aktif' && $user->role === 'admin',
            403
        );

        return Inertia::render('Dashboard', [
            'user' => $user->only(['id', 'username', 'role']),
        ]);
    })->name('dashboard.admin');


    Route::get('/dashboard/user', function (Request $request) {
        $user = $request->user();

        abort_unless(
            $user->status === 'aktif' && $user->role === 'user',
            403
        );

        return Inertia::render('Dashboard', [
            'user' => $user->only(['id', 'username', 'role']),
        ]);
    })->name('dashboard.user');

    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('logout');
});


Route::get('/kasir', function () {
    return view('pos');
})->name('cashier');

Route::get('/cek-frontend', function () {
    return Inertia::render('CekFrontend', [
        'namaToko' => 'Toko Bintang Mulia'
    ]);
});

