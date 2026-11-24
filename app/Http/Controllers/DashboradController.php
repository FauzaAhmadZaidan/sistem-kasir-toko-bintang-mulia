<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\ViteException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Vite;
use Inertia\Inertia;

class DashboradController extends Controller
{
    public function adminDashboard()
    {
        return $this->renderDashboard();
    }

    public function userDashboard()
    {
        return $this->renderDashboard();
    }

    private function renderDashboard()
    {
        // Build dari branch simulasi tidak mempunyai aset checkout ini.
        try {
            Vite::asset('resources/js/pos/transaksi.ts');
        } catch (ViteException) {
            return response()->view('errors.build-transaksi', [], 503);
        }

        return Inertia::render('Main', [
            'user' => Auth::user()->only(['id', 'username', 'role']),
        ]);
    }
}
