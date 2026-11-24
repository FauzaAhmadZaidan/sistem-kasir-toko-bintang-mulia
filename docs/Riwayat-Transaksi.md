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
- Nomor invoice dibuat oleh `SaveTransaction` memakai format awal `TR|id_kasir|ddmmyyHHmm` dalam WIB. Pembayaran kedua oleh kasir yang sama pada menit yang sama mendapat akhiran `|2`, dan seterusnya. UI menampilkan nomor dari respons checkout.
- SKU dan barang harus aktif, harga harus terisi, jumlah harus positif, stok harus cukup, dan uang harus mencukupi. Penyimpanan detail dan pengurangan stok berada dalam satu transaksi database dengan penguncian baris.
- Kode checkout dari frontend dipakai untuk mengembalikan transaksi yang sama saat permintaan diulang. Klik atau retry dengan kode yang sama tidak mengurangi stok dua kali. Payload berbeda dengan kode yang sudah dipakai ditolak. Jika halaman dimuat ulang setelah koneksi gagal, periksa riwayat sebelum membuat pembayaran baru.
- `TransaksiResource.php`: menyusun data daftar dan detail; informasi akun yang ditampilkan hanya ID dan nama kasir.
- Migrasi baru menambah nama kasir, kode checkout, indeks pencarian, serta salinan nama barang, kode SKU, varian, dan harga saat transaksi. Data lama tidak dihapus.
- Transaksi lama yang belum mempunyai salinan harga satuan menampilkan “Harga tidak tersimpan”. Subtotal yang sebelumnya disimpan di `total_harga` dan total transaksi tetap ditampilkan.
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

Jalankan `php artisan migrate` untuk memasang kedua migrasi riwayat.

1. `2026_11_23_000000_complete_legacy_transaction_columns.php` melengkapi `transaksi.waktu` dan `detail_transaksi.sku_id` jika belum ada. Waktu transaksi lama memakai `created_at` yang tercatat. Jika kedua waktu kosong, struk menampilkan “Waktu tidak tercatat”. Checkout tetap mengisi `barang_id` dan `total_harga` jika tabel masih memiliki kolom tersebut.
2. `2026_11_23_000001_add_receipt_snapshot_to_transaksi.php` menambahkan kolom dan indeks riwayat yang belum ada.

Jika percobaan sebelumnya gagal dengan `Duplicate column name 'nama_kasir'` atau `Key column 'waktu' doesn't exist`, ambil pembaruan branch lalu ulangi `php artisan migrate`. Kedua migrasi dan rollback-nya mempertahankan kolom yang sudah ada dan data struk.

Jika layar masih menampilkan **Struk simulasi** atau nomor `SIM-`, cek bahwa folder untuk menjalankan Laravel berada di branch `feat/riwayat-transaksi`. Hentikan server Laravel dan Vite lama, lalu jalankan dari folder itu:

```powershell
git fetch origin
git switch feat/riwayat-transaksi
git pull --ff-only origin feat/riwayat-transaksi
php artisan config:clear
php artisan route:clear
php artisan route:list --path=transaksi
if (Test-Path .\public\hot) { Remove-Item .\public\hot }
npm.cmd run build
php artisan serve --host=127.0.0.1 --port=8010
```

Buka `http://127.0.0.1:8010/login` untuk memastikan browser terhubung ke server yang baru. Rute web `POST transaksi/store` harus terlihat di daftar rute. Marker `public/hot` menunjuk ke server Vite lama jika tertinggal setelah Vite berhenti. Coba satu checkout baru dan cek nomor dari Laravel, stok, serta halaman riwayat setelah refresh. Struk simulasi lama hanya ada di sesi browser, sehingga tidak bisa muncul sebagai transaksi tersimpan.

## Menggabungkan perubahan

Draft PR menargetkan `ui/partials-kasir`. Perubahan laporan dapat ditinjau di atas versi Manajemen Barang dan Manajemen User yang sudah ada di branch tersebut. Jika masih ada perubahan lokal, simpan dulu dan gabungkan ke branch integrasi. Periksa terutama `routes/web.php`, `Main.tsx`, `Kasir.tsx`, dan `PembayaranKasir.tsx` jika Git menemukan konflik.

## Validasi

- `php artisan test` lulus dengan 24 tes dan 228 assertion di SQLite, termasuk format invoice awal dan dua pembayaran dalam menit yang sama. Kedua tes migrasi juga lulus di MariaDB 11.8 melalui driver MySQL Laravel, termasuk filter struk lama dan checkout setelah migrasi.
- `npm run build` dan `npx tsc --noEmit`: lulus.
- Browser Chromium pada database contoh terpisah: laporan admin, filter kasir, detail struk, checkout tunai, riwayat setelah refresh, serta layout viewport 390 dan 320 piksel. Fixture browser berada di luar repository.
- Penguncian transaksi belum diuji dengan dua koneksi MySQL bersamaan; lakukan uji akhir di database uji Laragon sebelum dipakai operasional.
