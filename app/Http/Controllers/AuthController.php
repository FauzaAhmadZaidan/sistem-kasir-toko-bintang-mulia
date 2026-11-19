<?php

namespace App\Http\Controllers;

use Dotenv\Validator;
use Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator as Val;
use Laravel\Sanctum\PersonalAccessToken;

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
            return response()->json([
                'message' => 'Action failed',
                'error' => $validator->errors()
            ]);
        }

        $validatedData = $validator->validated();

        if (
            Auth::attempt([
                'username' => $validatedData['username'],
                'password' => $validatedData['password']
            ])
        )
            ;

        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Login failed',
            ], 401);
        }

        $user->tokens()->delete();

        $token = $user->createToken('token')->plainTextToken;

        return response()->json([
            'message' => 'Login success',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Action failed',
            ], 401);
        }

        $userToken = $user->tokens();

        if (!$userToken) {
            return response()->json([
                'message' => 'You have not beed logged in',
            ], 401);
        }

        $userToken->delete();

        return response()->json([
            'message' => 'Logout success',
            'user' => $user
        ]);
    }

    public function extendToken(Request $request) {
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

    public function user() {
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
