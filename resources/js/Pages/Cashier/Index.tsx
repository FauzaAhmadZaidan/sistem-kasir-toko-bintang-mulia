import { Head } from '@inertiajs/react';
import Kasir from '../partials/Kasir';
import { useSesiKasir, type BarangKasir, type SkuKasir } from '../../pos/kasir';

const alatTulis = { id: 1, nama: 'Stationery' };
const kemasan = { id: 2, nama: 'Packaging' };
function sku(id: number, kode: string, nama: string, harga: number, stok: number): SkuKasir {
    return { id, kode_sku: kode, nama_sku: nama, harga, stok, gambar: null, varian_ids: [] };
}

// Data contoh hanya digunakan oleh route preview lokal.
const contoh: BarangKasir[] = [
    { id: 1, nama: 'Buku Tulis', kategori: alatTulis, has_varian: true, jenis_varian: [], skus: [
        sku(101, 'BRG-001-38', 'Isi 38 lembar', 10000, 15), sku(102, 'BRG-001-52', 'Isi 52 lembar', 15000, 5),
    ] },
    { id: 2, nama: 'Pulpen', kategori: alatTulis, has_varian: true, jenis_varian: [], skus: [
        sku(201, 'BRG-002-SH', 'Snowman hitam', 3000, 7), sku(202, 'BRG-002-SB', 'Snowman biru', 3000, 0),
        sku(203, 'BRG-002-PM', 'Pilot merah', 5000, 3),
    ] },
    { id: 3, nama: 'Pensil', kategori: alatTulis, has_varian: false, jenis_varian: [], skus: [sku(3, 'BRG-003', 'Pensil', 4000, 15)] },
    { id: 4, nama: 'Penggaris', kategori: alatTulis, has_varian: false, jenis_varian: [], skus: [sku(4, 'BRG-004', 'Penggaris', 7000, 0)] },
    { id: 5, nama: 'Paper Bag', kategori: kemasan, has_varian: false, jenis_varian: [], skus: [sku(5, 'BRG-005', 'Paper Bag', 7000, 0)] },
];

export default function PreviewKasir() {
    const sesi = useSesiKasir();
    return <main className="bmp-preview">
        <Head title="Pratinjau kasir · Bintang Mulia" /><Kasir sesi={sesi} contoh={contoh} />
    </main>;
}
