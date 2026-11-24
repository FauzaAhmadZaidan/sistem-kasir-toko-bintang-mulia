import axios from 'axios';
import type { StrukKasir } from './kasir';

const http = axios.create({ timeout: 20000, headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });

export type Transaksi = {
    id: number;
    invoice: string;
    waktu: string;
    kasir: { id: number; username: string };
    total: number;
    bayar: number;
    kembalian: number;
    jumlah_item: number;
    items?: { sku_id: number; nama_barang: string; kode_sku: string | null; nama_varian: string; jumlah: number; harga: number | null; subtotal: number | null }[];
};

export type FilterTransaksi = { cari: string; tanggal_mulai: string; tanggal_selesai: string; kasir_id: string };
export type DaftarTransaksi = {
    data: Transaksi[];
    meta: { current_page: number; last_page: number; total: number; from: number | null; to: number | null };
    ringkasan: { jumlah_transaksi: number; total_penjualan: number; jumlah_item: number };
    kasir: { id: number; username: string }[];
};
export type Checkout = {
    kode_checkout: string; total: number; bayar: number;
    items: { id: number; qty: number; harga: number }[];
};

export function buatKodeCheckout() {
    // getRandomValues juga tersedia ketika aplikasi dicoba melalui HTTP di LAN.
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function ambilTransaksi(filter: FilterTransaksi, page: number, signal: AbortSignal) {
    const { data } = await http.get<DaftarTransaksi>('/transaksi', { params: { ...filter, page }, signal });
    return data;
}

export async function ambilDetailTransaksi(id: number, signal: AbortSignal) {
    const { data } = await http.get<{ data: Transaksi }>('/transaksi/' + id, { signal });
    return data.data;
}

export async function simpanTransaksi(checkout: Checkout) {
    const { data } = await http.post<{ data: Transaksi }>('/transaksi/store', checkout);
    return strukDariTransaksi(data.data);
}

export function strukDariTransaksi(data: Transaksi): StrukKasir {
    return {
        nomor: data.invoice, waktu: data.waktu, kasir: data.kasir.username,
        total: data.total, bayar: data.bayar, kembalian: data.kembalian,
        items: (data.items ?? []).map((item) => ({
            skuId: item.sku_id, nama: item.nama_barang, varian: item.nama_varian,
            jumlah: item.jumlah, harga: item.harga,
        })),
    };
}

export function pesanTransaksi(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 419) return 'Sesi login berakhir. Muat ulang halaman dan masuk kembali.';
        if (error.response?.status === 403) return 'Akun ini tidak memiliki akses. Silakan masuk kembali dengan akun yang aktif.';
        if (error.response?.status === 404) return 'Transaksi tidak ditemukan atau tidak dapat diakses.';
        if (error.response?.status === 400 || error.response?.status === 422) {
            const errors = error.response.data?.error ?? error.response.data?.errors;
            const pesan = errors && Object.values(errors).flat().find((item) => typeof item === 'string');
            if (typeof pesan === 'string') return pesan;
        }
        if (!error.response) return 'Koneksi terputus. Periksa koneksi lalu coba lagi.';
    }
    return 'Transaksi belum dapat diproses. Silakan coba lagi.';
}

export const hasilBelumPasti = (error: unknown) => !axios.isAxiosError(error) || !error.response || error.response.status >= 500;
export const tanggalWib = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export const waktuTransaksi = (waktu: string) => new Date(waktu).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });
