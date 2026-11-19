<?php

namespace App\Http\Controllers;

use Dotenv\Validator;
use Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator as Val;
use Inertia\Inertia;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    //
    public function toLogin() {
        return Inertia::render('Auth/Login');
    }
    public function login(Request $request)
    {
        $validator = Val::make($request->all(), [
            'username' => 'required',
            'password' => 'required',
        ]);

        $validatedData = $validator->validated();

        if (
            Auth::attempt([
                'username' => $validatedData['username'],
                'password' => $validatedData['password']
            ])
        ) {
            $request->session()->regenerate();
            
            $user = Auth::user();

            if ($user->role === 'admin') {
                return redirect()->route('dashboard.admin');
            } else {
                return redirect()->route('dashboard.user');
            }
        }

        return back()->withErrors([
            'username' => 'Username atau Password salah!'
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    public function extendToken(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if (!$token) {
            return response()->json([
                'message' => 'Action failed',
            ], 401);
        }

        if ($token instanceof PersonalAccessToken) {
            $token->forceFill([
                'created_at' => now()
            ]);
            $token->save();
        }

        return response()->json([
            'message' => 'Token extended successfully',
            // 'token' => $token,
        ]);

    }

    public function user()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Action failed',
            ], 401);
        }

        return response()->json([
            'message' => 'User found',
            'user' => $user
        ]);
    }
}
