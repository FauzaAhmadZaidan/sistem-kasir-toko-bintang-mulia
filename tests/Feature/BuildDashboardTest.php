<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class BuildDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_tidak_memuat_build_tanpa_aset_checkout(): void
    {
        $public = sys_get_temp_dir() . '/pos-build-test-' . Str::uuid();
        File::ensureDirectoryExists($public . '/build');
        File::put($public . '/build/manifest.json', json_encode([
            'resources/js/app.tsx' => ['file' => 'assets/app-simulasi.js', 'isEntry' => true],
        ], JSON_THROW_ON_ERROR));
        $this->app->usePublicPath($public);

        try {
            foreach (['user' => '/kasir/dashboard', 'admin' => '/admin/dashboard'] as $role => $path) {
                $user = User::create(['username' => $role, 'password' => 'password', 'role' => $role]);
                $this->actingAs($user)->get($path)->assertStatus(503)
                    ->assertSee('Build kasir perlu diperbarui')
                    ->assertDontSee('assets/app-simulasi.js');
            }
        } finally {
            File::deleteDirectory($public);
        }
    }
}
