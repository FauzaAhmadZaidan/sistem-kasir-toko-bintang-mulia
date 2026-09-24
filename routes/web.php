<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('login');
});







// Test Area Only
Route::get('/login', function () {
    return view('login');
});

Route::get('/dashboard/admin', function () {
    return view('admindashboard');
})->middleware('auth:sanctum');

Route::get('/dashboard/user', function () {
    return view('userdashboard');
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
