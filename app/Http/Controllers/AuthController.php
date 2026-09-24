<?php

namespace App\Http\Controllers;

use Dotenv\Validator;
use Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator as Val;

class AuthController extends Controller
{
    //
    public function login(Request $request)
    {
        $validator = Val::make($request->all(), [
            'username' => 'required',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validatedData = $validator->validated();

        if (
            !Auth::attempt([
                'username' => $validatedData['username'],
                'password' => $validatedData['password'],
            ])
        ) {
            return back()->withErrors(['login:', 'Invalid username or password'])->withInput();
        }

        $request->session()->regenerate();

        $user = Auth::user();

        if ($user->role == 'admin') {
            return redirect('/dashboard/admin');
        } elseif ($user->role == 'user') {
            return redirect('/dashboard/user');
        }
    }

    public function logout()
    {
        Auth::logout();
        return redirect('/');
    }
}
