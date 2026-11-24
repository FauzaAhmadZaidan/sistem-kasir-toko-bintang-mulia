import { useState } from 'react';

export type SkuKasir = {
    id: number;
    kode_sku: string;
    nama_sku: string;
    harga: number;
    stok: number;
    gambar: string | null;
    varian_ids: number[];
};

// Bentuk katalog mengikuti KasirBarangResource.
export type BarangKasir = {
    id: number;
    nama: string;
    kategori: { id: number; nama: string } | null;
    has_varian: boolean;
    jenis_varian: { id: number; nama: string; pilihan: { id: number; nama: string }[] }[];
    skus: SkuKasir[];
};

export type ItemKeranjang = {
    skuId: number;
    nama: string;
    varian: string;
    harga: number;
    stok: number;
    jumlah: number;
};

export type BarisStruk = Pick<ItemKeranjang, 'nama' | 'varian' | 'jumlah'> & {
    id: number;
    harga: number | null;
    subtotal: number | null;
};
export type StrukKasir = {
    kasir: string;
    nomor: string;
    waktu: string | null;
    items: BarisStruk[];
    total: number;
    bayar: number;
    kembalian: number;
};

const idr = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
});
export const rupiah = (nilai: number) => idr.format(nilai);
export const jumlahItem = (items: readonly { jumlah: number }[]) =>
    items.reduce((total, item) => total + item.jumlah, 0);

export function namaVarian(barang: BarangKasir, sku: SkuKasir) {
    if (!barang.has_varian && barang.skus.length === 1) return '';
    const nama = barang.jenis_varian.flatMap((jenis) =>
        jenis.pilihan.filter((v) => sku.varian_ids.includes(v.id)).map((v) => v.nama),
    );
    return nama.length ? nama.join(' · ') : sku.nama_sku || sku.kode_sku;
}

export function itemDariSku(barang: BarangKasir, sku: SkuKasir, jumlah: number): ItemKeranjang {
    return { skuId: sku.id, nama: barang.nama, varian: namaVarian(barang, sku), harga: sku.harga, stok: sku.stok, jumlah };
}

// Keranjang dan struk terakhir mengikuti sesi halaman. Riwayat penjualan dibaca dari server.
export function useSesiKasir() {
    const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);
    const [strukTerakhir, setStrukTerakhir] = useState<StrukKasir>();

    function selesai(struk: StrukKasir) {
        setStrukTerakhir(struk);
        setKeranjang([]);
    }

    return { keranjang, setKeranjang, strukTerakhir, selesai };
}
export type SesiKasir = ReturnType<typeof useSesiKasir>;
