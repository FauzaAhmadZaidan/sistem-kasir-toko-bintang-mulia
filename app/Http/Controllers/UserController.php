<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator as Val; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;


class UserController extends Controller
{
    //
    public function createUser($request) {

        $operator = Auth::users();

        if ($operator->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }


        $validator = Val::make($request->all(), [
            'username' => 'required|min=8|string|unique:users',
            'password' => 'required|min=8|string',
            'confirm_password' => 'required|same:password',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $validatedData = $validator->validated();

        $newUser = User::create([
            'username' => $validatedData['username'],
            'password' => Hash::make($validatedData['password']),
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $newUser
        ]);
    }

    public function deactiveUser($id) {

        $operator = Auth::user();

        if ($operator->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        $user->status = 'tidak aktif';
        $user->save();
        return response()->json([
            'message' => 'User deactivated successfully',
            'user' => $user
        ], 200);
    }

    public function reactiveUser($id) {

        $operator = Auth::user();

        if ($operator->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $user = User::find($id);
        $user->status = 'aktif';
        $user->save();
        return response()->json([
            'message' => 'User reactivated successfully',
            'user' => $user
        ], 200); 
    }

    public function editUser(Request $request, $id) {

        $operator = Auth::user();

        if ($operator->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        $validator = Val::make($request->all(), [
            'username' => 'sometimes|min:8|string|unique:users',
            'password' => 'sometimes|min:8|string',
            'confirm_password' => 'sometimes|same:password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Action failed',
                'errors' => $validator->errors(),
            ], 400);
        }

        $validatedData = $validator->validated();

        if (isset($validatedData['username'])) {
            $user->username = $validatedData['username'];
        }

        if (isset($validatedData['password'])) {
            $user->password = Hash::make($validatedData['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Data has been updated!',
            'user' => $user
        ], 200);

    }

    public function viewUsers() {

        $operator = Auth::user();

        if ($operator->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $data = User::all()->select('id', 'username', 'status');

        return response()->json([
            'message' => 'Data fetched successfully',
            'data' => $data
        ], 200);
    }
}
