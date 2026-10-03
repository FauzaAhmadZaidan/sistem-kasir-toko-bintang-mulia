<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::get('/login', function (Request $request) {
    $user = $request->user();

    if ($user) {
        if ($user->role === 'admin') {
            return redirect()->route('dashboard.admin');
        }

        if ($user->role === 'user') {
            return redirect()->route('dashboard.user');
        }

        abort(403, 'Role pengguna tidak dikenali.');
    }

    return Inertia::render('Auth/Login');
})->name('login');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:6,1')
    ->name('login.store');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard/admin', function (Request $request) {
        $user = $request->user();

        abort_unless($user->role === 'admin', 403);

        return Inertia::render('Dashboard', [
            'user' => $user->only(['id', 'username', 'role']),
        ]);
    })->name('dashboard.admin');

    Route::get('/dashboard/user', function (Request $request) {
        $user = $request->user();

        abort_unless($user->role === 'user', 403);

        return Inertia::render('Dashboard', [
            'user' => $user->only(['id', 'username', 'role']),
        ]);
    })->name('dashboard.user');

    Route::get('/kasir', function () {
        return view('pos');
    })->name('cashier');

    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('logout');
});

Route::get('/cek-frontend', function () {
    return Inertia::render('CekFrontend', [
        'namaToko' => 'Toko Bintang Mulia',
    ]);
});
