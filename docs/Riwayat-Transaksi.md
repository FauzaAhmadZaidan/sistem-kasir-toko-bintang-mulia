# Riwayat transaksi dan laporan

Perubahan ini memakai branch `ui/partials-kasir` pada commit `f391f63` yang sudah berisi Manajemen Barang dan Manajemen User. Checkout di branch dasar masih simulasi di frontend. Backend sudah mempunyai `TransaksiController::SaveTransaction`, tabel `transaksi`, dan tabel `detail_transaksi`, tetapi belum menyediakan pembacaan riwayat.

Sekarang pembayaran tunai di halaman kasir memanggil penyimpanan server. Sesudah berhasil, keranjang dikosongkan, katalog dimuat ulang, dan struk server ditampilkan. Menu Riwayat Transaksi dan Laporan membaca database sehingga tetap tersedia setelah refresh.

## Hak akses

| Fitur | Kasir (`user`) | Admin (`admin`) |
| --- | --- | --- |
| Checkout tunai | Ya, atas nama akun yang login | Tidak |
| Daftar, ringkasan, dan detail transaksi | Hanya milik sendiri | Semua kasir |
| Filter tanggal dan nomor transaksi | Ya | Ya |
| Filter kasir | Tidak | Ya |
| Cetak ulang struk | Milik sendiri | Semua kasir |

Pembatasan diterapkan pada controller untuk endpoint web maupun API. Mengubah `kasir_id`, `user_id`, atau ID pada URL tidak memberi kasir akses ke transaksi orang lain. Akun tidak aktif ditolak oleh endpoint transaksi. Role kasir tetap bernama `user` mengikuti database proyek.

Rute pengelolaan akun memakai middleware `EnsureRole` yang sudah dipakai oleh Manajemen Barang. Dengan begitu, hanya admin yang dapat membuat akun atau mengubah role. URL dan form Manajemen User tetap sama.

## Perubahan backend dan alasannya

Struktur controller, model dengan nama huruf kecil, `Auth::user()`, validator `Val`, transaksi database, dan respons `message`/`data` tetap mengikuti proyek. Tidak ada service layer atau paket baru.

- `TransaksiController.php`: melanjutkan method `SaveTransaction`, menambahkan `getTransaksi` dan `getDetailTransaksi`.
- Identitas kasir dan waktu diambil dari server. Harga serta total dihitung dari SKU; total/harga yang dikirim frontend dipakai untuk mendeteksi katalog yang berubah. Nilai `user_id`, `waktu`, dan `kembalian` kiriman browser tidak dipercaya.
- SKU dan barang harus aktif, harga harus terisi, jumlah harus positif, stok harus cukup, dan uang harus mencukupi. Penyimpanan detail dan pengurangan stok berada dalam satu transaksi database dengan penguncian baris.
- Kode checkout dari frontend dipakai untuk mengembalikan transaksi yang sama saat permintaan diulang. Klik atau retry dengan kode yang sama tidak mengurangi stok dua kali. Payload berbeda dengan kode yang sudah dipakai ditolak. Jika halaman dimuat ulang setelah koneksi gagal, periksa riwayat sebelum membuat pembayaran baru.
- `TransaksiResource.php`: menyusun data daftar dan detail; informasi akun yang ditampilkan hanya ID dan nama kasir.
- Migrasi baru menambah nama kasir, kode checkout, indeks pencarian, serta salinan nama barang, kode SKU, varian, dan harga saat transaksi. Data lama tidak dihapus.
- Transaksi lama yang belum mempunyai salinan harga menampilkan “Harga tidak tersimpan”. Total asli tetap ditampilkan; harga SKU terbaru tidak dianggap sebagai harga penjualan lama.
- Filter dan tampilan waktu memakai WIB. Waktu database baru mengikuti timezone Laravel (`config('app.timezone')`); batas tanggal WIB dikonversi saat query. Riwayat lama mengikuti interpretasi timezone konfigurasi aplikasi atas nilai `waktu` yang sudah tersimpan.

| Method | Endpoint web dengan sesi login | Method controller |
| --- | --- | --- |
| POST | `/transaksi/store` | `SaveTransaction` |
| GET | `/transaksi` | `getTransaksi` |
| GET | `/transaksi/{id}` | `getDetailTransaksi` |

Endpoint API lama tetap tersedia di `/api/transaksi/store`. Pembacaan tersedia di `/api/transaksi` dan `/api/transaksi/{id}`, memakai middleware `auth:sanctum`. Frontend web menggunakan sesi login yang sudah ada dan CSRF Laravel melalui Axios, tanpa token login tambahan.

Filter GET: `cari`, `tanggal_mulai`, `tanggal_selesai`, `kasir_id` (admin), dan `page`. Daftar dipaginasi 10 transaksi; ringkasan menghitung seluruh hasil filter, bukan hanya halaman saat ini.

## Perubahan frontend

- `RiwayatPenjualan.tsx`: komponen bersama untuk riwayat kasir dan laporan admin, berisi ringkasan, pencarian invoice, periode cepat, filter tanggal, filter kasir admin, pagination, keadaan memuat/kosong/gagal, dan detail transaksi.
- `Laporan.tsx` dan `RiwayatTransaksi.tsx`: menggunakan komponen bersama di area konten Main.
- `PembayaranKasir.tsx`: menyimpan pembayaran melalui server, menampilkan error, menahan konfirmasi ganda, dan mencetak data struk yang tersimpan.
- `Kasir.tsx`: memuat ulang katalog setelah transaksi berhasil atau ketika server menolak harga/stok yang sudah berubah.
- `pos/transaksi.ts`: tipe respons, request, format WIB, serta pemetaan detail server ke struk.
- `Main.tsx`: riwayat tidak lagi menerima daftar struk simulasi dari state halaman.
- `laporan.css`: mengikuti header/sidebar biru yang sudah ada; tabel menjadi kartu transaksi pada layar kecil.

## Mencoba di laptop

Simpan perubahan lokal terlebih dahulu dan arahkan `.env` ke database uji. Checkout pada fitur ini benar-benar mencatat penjualan dan mengurangi stok.

Jika branch laporan belum ada di laptop:

```powershell
git fetch origin
git switch --track origin/feat/riwayat-transaksi
composer install
npm ci
php artisan migrate
php artisan optimize:clear
npm run build
php artisan serve
```

Alternatif untuk mencoba tanpa mengubah folder kerja yang berisi pekerjaan barang/user:

```powershell
git fetch origin
git worktree add -b coba-laporan ../tokobm-laporan origin/feat/riwayat-transaksi
```

Di folder baru, siapkan `.env` dan database uji sendiri, jalankan `composer install`, `npm ci`, `php artisan key:generate`, `php artisan migrate`, `npm run build`, lalu `php artisan serve`. Gunakan akun dan data barang uji yang sudah disiapkan. Tidak ada akun atau password demo yang ditambahkan oleh fitur ini.

Migrasi yang diperlukan: `2026_11_23_000001_add_receipt_snapshot_to_transaksi.php`. Cukup `php artisan migrate`; tidak perlu `migrate:fresh`.

## Menggabungkan perubahan

Draft PR menargetkan `ui/partials-kasir`. Perubahan laporan dapat ditinjau di atas versi Manajemen Barang dan Manajemen User yang sudah ada di branch tersebut. Jika masih ada perubahan lokal, simpan dulu dan gabungkan ke branch integrasi. Periksa terutama `routes/web.php`, `Main.tsx`, `Kasir.tsx`, dan `PembayaranKasir.tsx` jika Git menemukan konflik.

## Validasi

- `php artisan test` lulus dengan 21 tes dan 193 assertion di SQLite. Tes mencakup hak akses web dan API, perubahan akun oleh admin, sinkronisasi katalog, detail struk, validasi dan retry checkout, filter WIB, ringkasan, serta pagination.
- `npm run build` dan `npx tsc --noEmit`: lulus.
- Browser Chromium pada database contoh terpisah: laporan admin, filter kasir, detail struk, checkout tunai, riwayat setelah refresh, serta layout viewport 390 dan 320 piksel. Fixture browser berada di luar repository.
- Penguncian transaksi belum diuji dengan dua koneksi MySQL bersamaan; lakukan uji akhir di database uji Laragon sebelum dipakai operasional.
