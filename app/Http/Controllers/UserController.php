<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator as Val;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;


class UserController extends Controller
{
    //
    public function createUser(Request $request): JsonResponse
    {
        // Semua field wajib diisi pada CREATE.
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'user'])],
            'status' => ['required', 'boolean'],
        ], [
            'username.unique' => 'Username sudah terdaftar.',
            'password.min' => 'Password minimal 8 karakter.',
        ]);

        User::query()->create([
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => $validated['status'],
        ]);

        return response()->json(['message' => 'Akun berhasil dibuat.'], 201);
    }

    public function viewUsers()
    {
        $operator = Auth::user();

        if ($operator->role != 'admin') {
            return response()->json([
                'message' => 'You are not authorized to perform this action',
            ], 403);
        }

        $users = User::select('id', 'username', 'status', 'role')->orderBy('username', 'asc')->get();

        $data = collect($users)->map(function ($item) {
            $item['status'] = $item['status'] === 'aktif' ? true : false;

            return $item;
        })->toArray(); 

        return response()->json([
            'message' => 'Data fetched successfully',
            'data' => $data
        ], 200);
    }

    public function checkUsernameAvail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255'],
        ]);

        return response()->json([
            'available' => ! User::query()
                ->where('username', $validated['username'])
                ->exists(),
        ]);
    }

    public function editUser(Request $request, User $user): JsonResponse
    {
        // ID wajib ada pada URL /admin/users/{user} (route-model binding).
        // Hanya field yang dikirim dan valid yang boleh diubah.
        // Username TIDAK diterima dalam proses update.
        $validated = $request->validate([
            'role' => ['sometimes', 'required', Rule::in(['admin', 'user'])],
            'status' => ['sometimes', 'required', 'boolean'],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
        ], [
            'password.min' => 'Password minimal 8 karakter.',
        ]);

        if ($validated === []) {
            throw ValidationException::withMessages([
                'form' => 'Kirim setidaknya satu field yang ingin diubah.',
            ]);
        }

        // Perlindungan agar admin tidak menonaktifkan / menurunkan rolenya sendiri.
        if ($request->user()->is($user)) {
            if (array_key_exists('role', $validated) && $validated['role'] !== 'admin') {
                throw ValidationException::withMessages([
                    'role' => 'Tidak dapat mengubah role akun admin yang sedang digunakan.',
                ]);
            }
            if (array_key_exists('status', $validated) && ! (bool) $validated['status']) {
                throw ValidationException::withMessages([
                    'status' => 'Tidak dapat menonaktifkan akun yang sedang digunakan.',
                ]);
            }
        }

        if (array_key_exists('role', $validated)) {
            $user->role = $validated['role'];
        }
        if (array_key_exists('status', $validated)) {
            $status = 'aktif';

            if ($validated['status'] === false) {
                $status = 'tidak aktif';
            }

            $user->status = $status;
        }
        if (array_key_exists('password', $validated)) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        return response()->json(['message' => 'Akun berhasil diperbarui.']);
    }
}
