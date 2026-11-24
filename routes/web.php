<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboradController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::get('/login', [AuthController::class, 'toLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth')->group(function () {
    Route::get('/admin/dashboard', [DashboradController::class, 'adminDashboard'])->name('dashboard.admin');

    Route::get('/kasir/dashboard', [DashboradController::class, 'userDashboard'])->name('dashboard.user');

    Route::get('/kasir', function () {
        return view('pos');
    })->name('cashier');

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/admin/users/get-users', [UserController::class, 'viewUsers']);

    Route::get('/admin/users/check-username', [UserController::class, 'checkUsernameAvail']);

    Route::post('/admin/user/create',[UserController::class, 'createUser']);

    Route::patch('/admin/users/edit/{user}', [UserController::class, 'editUser']);

    Route::post('/admin/users/create', [UserController::class, 'createUser']);
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

