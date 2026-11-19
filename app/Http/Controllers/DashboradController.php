<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboradController extends Controller
{
    //
    public function adminDashboard() {
        $user = \Illuminate\Support\Facades\Auth::user();

        return Inertia::render('Main', [
            'user' => $user->only(['id', 'username', 'role']),
        ]);
    }

    public function userDashboard() {
        $user = \Illuminate\Support\Facades\Auth::user();

        return Inertia::render('Main', [
            'user' => $user->only(['id', 'username', 'role']),
        ]);
    }
}
