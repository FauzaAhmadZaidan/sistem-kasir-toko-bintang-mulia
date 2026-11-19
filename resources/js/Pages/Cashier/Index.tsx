import { Head } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import PembayaranKasir from "./PembayaranKasir";

type VarianPreview = {
    id: number;
    n_varian: string;
    harga: number;
    stok: number;
}

type BarangPreview = {
    id: number;
    kode: string;
    n_barang: string;
    harga: number | null;
    total_stok: number;
    gambar: string | null;
    kategori: { id:number; n_kategori: string };
    has_varian: boolean;
    varian: VarianPreview[];
};

type ItemKeranjang = {
    key: string;
    barang: BarangPreview;
    varian: VarianPreview | null;
    jumlah: number;
    harga: number;
    stok: number;
};


const barangEx: BarangPreview[] = [
    {
        id: 1,
        kode: 'BRG-001',
        n_barang: 'Buku Tulis',
        harga: null,
        total_stok: 20,
        gambar: null,
        kategori: { id: 1, n_kategori: 'Stationery' }, has_varian: true,
        varian: [
            { id: 101, n_varian: 'Isi 38 lembar', harga: 10000, stok: 15 },
            { id: 102, n_varian: 'Isi 52 lembar', harga: 15000, stok: 5 },
        ]
    },
    {
        id: 2,
        kode: 'BRG-002',
        n_barang: 'Pulpen',
        harga: null,
        total_stok: 10,
        gambar: null,
        kategori: { id: 1, n_kategori: 'Stationery' }, has_varian: true,
        varian: [
            { id: 201, n_varian: 'Snowman hitam', harga: 3000, stok: 7 },
            { id: 202, n_varian: 'Snowman biru', harga: 3000, stok: 0 },
            { id: 203, n_varian: 'Pilot merah', harga: 5000, stok: 3 },
        ]
    },
    {
        id: 3,
        kode: 'BRG-003',
        n_barang: 'Pensil',
        harga: 4000,
        total_stok: 15,
        gambar: null,
        kategori: { id: 1, n_kategori: 'Stationery' }, has_varian: false,
        varian: []
    },
    {
        id: 4,
        kode: 'BRG-004',
        n_barang: 'Penggaris',
        harga: 7000,
        total_stok: 0,
        gambar: null,
        kategori: { id: 1, n_kategori: 'Stationery' }, has_varian: false,
        varian: []
    },
    {
        id: 5,
        kode: 'BRG-005',
        n_barang: 'Paper Bag',
        harga: 7000,
        total_stok: 0,
        gambar: null,
        kategori: { id: 2, n_kategori: 'Packaging' }, has_varian: false,
        varian: []
    }
];

const kategoriEx = Array.from(
    new Map(barangEx.map((barang) => [barang.kategori.id, barang.kategori])).values(),
)

const formatRupiah = (nilai: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(nilai);

const keyItem = (barangId: number, varianId?: number) =>
    `${barangId}:${varianId ?? 'tanpa-varian'}`;

const fokus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';


function labelHarga(barang: BarangPreview) {
    if  (!barang.has_varian) return formatRupiah(barang.harga ?? 0);
    const harga = barang.varian.map((varian) => varian.harga);
    if (harga.length === 0) return 'Varian belum tersedia';
    const terendah = Math.min(...harga);
    return Math.max(...harga) === terendah ? formatRupiah(terendah) : `Mulai ${formatRupiah(terendah)}`;
}

function stokTersedia(barang: BarangPreview) {
    return barang.has_varian
        ? barang.varian.reduce((total, varian) => total + varian.stok, 0)
        : barang.total_stok;
}

function FotoBarang({ barang, compact = false }: { barang: BarangPreview, compact?: boolean }) {
    const [failImage, setFailImage] = useState<string | null>(null);

    if (barang.gambar && failImage !== barang.gambar) {
        return (
            <img src={barang.gambar} alt={barang.n_barang} loading="lazy"
            onError={() => setFailImage(barang.gambar)}
            style={{display:'block', width:'100%', height:'100%', objectFit:'contain', padding: compact ? 6 : 16}}
            className="h-full w-full object-contain p-4" />
        );
        }
    return (
        <div className="bg-indigo-50 text-indigo-300"
            style={{display:'flex', width: '100%', height: '100%', minHeight: 0, flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12, padding: compact ? 8 : 20, overflow: 'hidden', boxSizing: 'border-box' }}>
            <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor"
            strokeWidth="1.5"
            width={compact ? 24 : 64} height={compact ? 24 : 64}
            style={{display: 'block', width: compact ? 28 : 64, height: compact ? 28 : 64, flexShrink: 0 }}>
                <path d="m24 6 17 9v181-17 9-17-9V15L24 6Z"/>
                <path d="m7 15 17 9 17-9M24 24v18M15 10.8l17 9V28"/>
            </svg>
            {!compact && <span className="text-indigo-400" style={{fontSize: 12, lineHeight: 1.5, textAlign: 'center'}}>Belum ada foto</span>}
        </div>
    );
}

function PengaturJumlah({ jumlah, onMin, onPlus, plusDisabled, minDisabled, label }: {
    jumlah: number;
    onMin: () => void;
    onPlus: () => void;
    plusDisabled: boolean;
    minDisabled: boolean;
    label: string;
}) {
    const button = `rounded-lg text-lg hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-300 ${fokus}`;
    return (
        <div role="group" aria-label={`Jumlah ${label}`} className="rounded-xl border border-slate-200 bg-white"
            style={{display: 'inline-grid', gridTemplateColumns: '40px minmax(36px, auto) 40px', alignItems: 'center', flexShrink: 0, padding: 2}}>
            <button type="button" aria-label={`Kurangi ${label}`} disabled={minDisabled}
                onClick={onMin} className={button}
                style={{display: 'grid', placeItems: 'center', width: 40, height: 40, padding: 0, lineHeight: 1}}>-</button>
            <span className="text-sm font-semibold tabular-nums"
                style={{padding: '0 4px', textAlign: 'center' }}>{jumlah}</span>
            <button type="button" aria-label={`Tambah${label}`} disabled={plusDisabled}
                onClick={onPlus} className={button}
                style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, padding: 0, lineHeight: 1 }}>+</button>
        </div>
    );
}

function PopupBarang({ barang, keranjang, onClose, onPlus } : {
    barang: BarangPreview;
    keranjang: ItemKeranjang[];
    onClose: () => void;
    onPlus: (barang: BarangPreview, varian: VarianPreview | null, jumlah: number) => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [varianId, setVarianId] = useState<number | null>(null);
    const [jumlah, setJumlah] = useState(1);
    const varian = barang.varian.find((pilihan) => pilihan.id === varianId)?? null;
    const pilihanLengkap = !barang.has_varian || varian !== null;
    const harga = varian?.harga ?? barang.harga ?? 0;
    const stok = barang.has_varian ? (varian?.stok ?? 0) : barang.total_stok;
    const key = keyItem(barang.id, varian?.id);
    const inKeranjang = keranjang.find((item) => item.key === key)?.jumlah ?? 0;
    const sisa = Math.max(0, stok - inKeranjang);
    const canAdd = pilihanLengkap && jumlah > 0 && jumlah <= sisa;

    useEffect(() => {
        const dialog = dialogRef.current;
        const overflowPreviously = document.body.style.overflow;
        dialog?.showModal();
        document.body.style.overflow = 'hidden';
        return () => {
            dialog?.close();
            document.body.style.overflow = overflowPreviously;
        };
    }, []);

    return (
        <dialog ref={dialogRef} aria-labelledby="judul-popup-barang"
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
            className="rounded-3xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
            style={{position: 'fixed', inset: 0, margin: 'auto', width: 'min(720px, calc(100vw - 32px))',
            maxWidth: 'none', maxHeight: 'calc(100dvh - 32px)', padding: 0, border: 0, overflow: 'hidden' }}>
            <div style={{display: 'flex', flexDirection: 'column', maxHeight: 'calc(100dvh - 32px)', minHeight: 0 }}>
                <header className="border-b border-slate-100"
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '20px 24px', flexShrink: 0 }}>
                    <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                        <p className="text-xs font-medium text-indigo-600" style={{ margin: 0, lineHeight: 1.5 }}>{barang.kategori.n_kategori} · {barang.kode}</p>
                        <h2 id="judul-popup-barang" className="text-xl font-bold" style={{ margin: '6px 0 0', lineHeight: 1.4 }}>{barang.n_barang}</h2>
                    </div>
                    <button type="button" autoFocus onClick={onClose} aria-label="Tutup pilihan barang"
                        className={`rounded-full bg-slate-100 text-xl hover:bg-slate-200 ${fokus}`}
                        style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, padding: 0, flexShrink: 0 }}>x</button>
                </header>

                <div style={{ minHeight: 0, overflowY: 'auto', padding: 24, overscrollBehavior: 'contain' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', alignItems: 'start', gap: 24 }}>
                        <div className="rounded-2xl bg-slate-50"
                            style={{ width: '100%', maxWidth: 240, aspectRatio: '1 / 1', overflow: 'hidden', justifySelf: 'center' }}>
                            <FotoBarang barang={barang} />
                        </div>
                    <div style={{minWidth:0}}>
                        {barang.has_varian ?(
                            <fieldset style={{ margin: 0, padding: 0, minWidth: 0, border: 0 }}>
                                <legend className="text-sm font-semibold"
                                    style={{ padding: 0, marginBottom: 12 }}>Pilih varian</legend>
                                <div style={{ display:'grid', gap:10 }}>
                                    {barang.varian.map((pilihan) => {
                                    const used = keranjang.find((item) => item.key === keyItem(barang.id, pilihan.id))?.jumlah ?? 0;
                                    const sisaPilihan = Math.max(0, pilihan.stok - used);
                                    const dipilih = pilihan.id === varianId;

                                    return (
                                        <label key={pilihan.id} className={`rounded-xl border p-3 text-sm ${dipilih
                                            ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200' }
                                            ${sisaPilihan === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                            style={{display: 'flex', alignItems: 'center', gap: 12, padding: 14, minWidth: 0}}>
                                            <input type="radio" name="varian" value={pilihan.id} checked={dipilih}
                                            disabled={sisaPilihan === 0} className="accent-indigo-600" style={{width: 16, height: 16, margin: 0, flexShrink: 0}}
                                            onChange={() => {setVarianId(pilihan.id); setJumlah(1);}} />
                                            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                                                <span className="font-medium"
                                                    style={{ display: 'block', lineHeight: 1.5}}>{pilihan.n_varian}</span>
                                                <span className="text-xs text-slate-500" style={{display:'block', marginTop:4, lineHeight:1.6}}>
                                                    {formatRupiah(pilihan.harga)} · {pilihan.stok === 0 ? 'Stok habis':`Bisa ditambah:${sisaPilihan}`}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                                </div>
                            </fieldset>
                        ): <p className="text-sm text-slate-500">Barang ini tidak memiliki varian</p>}
                        <p className="text-lg font-bold text-indigo-700"  style={{ margin: '20px 0 0', overflowWrap: 'anywhere' }}>
                            {pilihanLengkap ? formatRupiah(harga) : labelHarga(barang)}
                        </p>
                        <p className="text-xs text-slate-500" style={{ margin: '6px 0 0', lineHeight: 1.6 }}>
                            {pilihanLengkap ? `Stok: ${stok}. Di keranjang: ${inKeranjang}`: `Pilih varian untuk melihat stoknya`}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 20 }}>
                            <span className="text-sm font-medium">Jumlah</span>
                            <PengaturJumlah jumlah={jumlah} label={barang.n_barang}
                            onMin={() => setJumlah((nilai) => Math.max(1, nilai - 1))}
                            onPlus={() => setJumlah((nilai) => Math.min(sisa, nilai + 1))}
                            minDisabled={!pilihanLengkap || jumlah <= 1}
                            plusDisabled={!pilihanLengkap || jumlah >= sisa} />
                        </div>
                    </div>
                </div>
            </div>
                <footer className="border-t border-slate-100 bg-white"  style={{ padding: '20px 24px 24px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                        <span className="text-slate-500">Subtotal pilihan</span>
                        <strong className="text-lg tabular-nums">{pilihanLengkap ? formatRupiah(jumlah * harga) : '—'}</strong>
                    </div>
                    <button type="button" disabled={!canAdd}
                    onClick={() => {if(canAdd) { onPlus(barang, varian, jumlah); onClose();} }}
                    className={`rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white
                    hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${fokus}`}
                    style={{ display: 'block', width: '100%', minHeight: 48, padding: '12px 16px', lineHeight: 1.5 }}>
                        {!pilihanLengkap ? 'Pilih varian dulu': sisa === 0 ? 'Batas stok tercapai' : 'Tambah ke keranjang'}
                    </button>
                </footer>
            </div>
        </dialog>
    );

}

export default function Kasir() {
    const [pencarian, setPencarian] = useState('');
    const [kategoriId, setKategoriId] = useState<number | null>(null);
    const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);
    const [barangDipilih, setBarangDipilih] = useState<BarangPreview | null>(null);
    const [pesan, setPesan] = useState('');
    const kataKunci = pencarian.trim().toLowerCase();
    const barangDisplay = barangEx.filter((barang) => {
        const cocokKategori = kategoriId === null || barang.kategori.id === kategoriId;
        const teks = `${barang.n_barang} ${barang.kode} ${barang.varian.map((v) => v.n_varian).join(' ')}`.toLowerCase();
        return cocokKategori && teks.includes(kataKunci);
    });

    const jumlahItem = keranjang.reduce((total, item) => total + item.jumlah, 0);
    const totalBelanja = keranjang.reduce((total, item) => total + item.harga * item.jumlah, 0);

    function tambahBarang(barang: BarangPreview, varian: VarianPreview | null, jumlah: number) {
        if (barang.has_varian && !varian) return;
        const key = keyItem(barang.id, varian?.id);
        const stok = varian?.stok ?? barang.total_stok;
        const harga = varian?.harga ?? barang.harga ?? 0;
        setKeranjang((previously) => {
            const oldItem = previously.find((item) => item.key === key);
            const newTotal = (oldItem?.jumlah ?? 0) + jumlah;
            if (jumlah <= 0 || newTotal > stok) return previously;
            return oldItem
                ? previously.map((item) => item.key === key ? {...item, jumlah: newTotal} : item)
                : [...previously, {key, barang, varian, jumlah, harga, stok}];
        });
        setPesan(`${jumlah} ${barang.n_barang}${varian ? `(${varian.n_varian})`: ''} ditambahkan ke keranjang.`);
    }

    function changeTotal(key:string, change:number) {
        setKeranjang((previously) => previously.map((item) => item.key === key
            ?{...item, jumlah: Math.max(0, Math.min(item.stok, item.jumlah + change))}
            :item).filter((item) => item.jumlah > 0));
    }

    return (
        <>
            <Head title="Kasir — Toko Bintang Mulia" />
            <main className="min-h-screen bg-slate-100 text-slate-900">
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify between gap-4 px-4 py-5 sm:px-6">
                        <div><p className="text-sm font-semibold text-indigo-600">Toko Bintang Mulia</p><h1 className="mt-1 text-2xl font-bold">Kasir</h1></div>
                        <div className="flex items-center gap-3">
                            <a href="#keranjang" className={`rounded-lg px-2 py-2 text-sm font-medium text-indigo-700 lg:hidden ${fokus}`}>Keranjang ({jumlahItem})</a>
                            <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Preview Local</span>
                        </div>
                    </div>
                </header>
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                    <p className="mb-5 text-sm text-slate-500">Data contoh. Keranjang belum disimpan dan akan kosong kembali saat halaman dimuat ulang.</p>
                    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <section aria-label="Katalog barang" className="min-w-0">
                            <label htmlFor="pencarian" className="mb-2 block text-sm font-semibold">Cari barang</label>
                            <input id="pencarian" type="search" value={pencarian} onChange={(event) =>setPencarian(event.target.value)}
                            placeholder="Cari nama, kode, atau varian barang..."
                            className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm ${fokus}`}/>
                            <div aria-label="Filter kategori" className="mt-3 flex flex-wrap gap-2">
                                {[{ id: null, n_kategori: 'Semua' }, ...kategoriEx].map((kategori) => (
                                <button type="button" key={kategori.id ?? 'semua'} aria-pressed={kategoriId === kategori.id}
                                    onClick={() => setKategoriId(kategori.id)}
                                    className={`rounded-xl border px-4 py-2 text-sm font-medium ${fokus} ${kategoriId === kategori.id ?
                                    'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}>
                                    {kategori.n_kategori}
                                </button>
                                ))}
                            </div>
                            <p className="my-4 text-xs text-slate-500">{barangDisplay.length} barang ditampilkan. Klik barang untuk memilih jumlah dan varian.</p>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                                {barangDisplay.map((barang) => {
                                    const habis =  stokTersedia(barang) === 0;
                                    return (
                                        <button type="button" key={barang.id} disabled={habis} onClick={() => setBarangDipilih(barang)}
                                            aria-label={`Pilih $(barang.n_barang)`}
                                            className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white
                                                text-left transition hover:border-indigo-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${fokus}`}>
                                            <div className="aspect-[4/3] border-b border-slate-100"><FotoBarang barang={barang} /></div>
                                            <div className="p-3 sm:p-4">
                                                <p className="text-[11px] font-medium text-slate-500">{barang.kategori.n_kategori}</p>
                                                <h2 className="mt-1 font-semibold">{barang.n_barang}</h2>
                                                <p className="mt-2 text-sm font-bold text-indigo-600">{labelHarga(barang)}</p>
                                                <p className={`mt-2 text-xs ${habis ? 'text-rose-600' : 'text-slate-500'}`}>{habis ? 'Stok habis' : barang.has_varian ? `${barang.varian.length} pilihan varian` : `Stok: ${barang.total_stok}`}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {barangDisplay.length === 0 &&
                            <div className="rounded-2xl border border-dashed border-slate p-8 text-center">
                                <p className="font-semibold">Barang tidak ditemukan</p>
                                <p className="mt-1 text-sm text-slate-500">Coba cari barang atau kategori lain</p>
                            </div>}
                        </section>

                        <aside id="keranjang" aria-labelledby="keranjang-title" className="min-w-0 scroll-mt-5 rounded-2xl border border-slate-300 bg-white lg:sticky lg:top-6 min-w-0 scroll-mt-5">
                            <div className="flex items-center justify-between border-b border-slate-100 p-5">
                                <h2 id="keranjang-title" className="text-lg font-bold">Keranjang</h2>
                                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">{jumlahItem} item</span>
                            </div>
                            <div className="p-5 lg:max-h-[55vh] lg:overflow-y-auto">
                                {keranjang.length === 0 ? <div className="py-10 text-center"><p className="font-medium text-slate-600">Keranjang kosong</p><p  className="mt-2 text-sm text-slate-500">Pilih barang dari katalog</p></div> : (
                                    <ul className="space-y-5">
                                        {keranjang.map((item) => {
                                            const label = `${item.barang.n_barang} ${item.varian ? `
                                                ${item.varian.n_varian}` : ''}`;
                                            return (
                                                <li key={item.key} className="border-b border-slate-100 last:border-0"
                                                    style={{ padding: '4px 0 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                                        <div className="rounded-xl"
                                                        style={{ width: 56, height: 56, flexShrink: 0, overflow: 'hidden' }}>
                                                            <FotoBarang barang={item.barang} compact />
                                                        </div>
                                                        <div style={{ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}>
                                                            <h3 className="text-sm font-semibold" style={{ margin: 0, lineHeight: 1.5 }}>
                                                                {item.barang.n_barang}
                                                            </h3>
                                                            {item.varian && <p className="text-xs text-slate-500" style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
                                                            {item.varian.n_varian}</p>}
                                                            <p className="mt-1 text-xs text-slate-500" style={{ margin: '6px 0 0', lineHeight: 1.5 }}>
                                                                {formatRupiah(item.harga)} / item
                                                            </p>
                                                        </div>
                                                        <button type="button" aria-label={`Hapus ${label} dari keranjang`}
                                                        onClick={() => setKeranjang((previously) => previously.filter((line) => line.key !== item.key))}
                                                        className={`rounded-lg text-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 ${fokus} `}
                                                        style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, padding: 0, flexShrink: 0 }}>
                                                        x</button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 16 }}>
                                                        <PengaturJumlah jumlah={item.jumlah} label={label}
                                                            onMin={() => changeTotal(item.key, -1)} onPlus={() =>
                                                            changeTotal(item.key, 1)}
                                                            plusDisabled={item.jumlah >= item.stok}
                                                            minDisabled={item.jumlah === 1}
                                                            />
                                                        <span className="text-sm font-bold tabular-nums"
                                                            style={{ marginLeft: 'auto', textAlign: 'right', lineHeight: 1.5, overflowWrap: 'anywhere', maxWidth: '100%' }}>
                                                            {formatRupiah(item.harga * item.jumlah)}
                                                        </span>
                                                    </div>
                                                    {item.jumlah >= item.stok && <p className="mt-2 text-xs text-amber-700">Batas stok tercapai</p>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                            <div className="border-t border-slate-100 p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <span className="text-sm text-slate-500">Total belanja</span><strong className="text-xl tabular-nums">{formatRupiah(totalBelanja)}</strong>
                                </div>
                                <PembayaranKasir
                                    keranjang={keranjang}
                                    onSelesai={() => {
                                        setKeranjang([]);
                                        setPesan(
                                            'Transaksi belum disimpan ke server'
                                        );
                                    }}/>
                            </div>
                        </aside>
                    </div>
                    <p role="status" aria-live="polite" className="mt-4 text-sm text-indigo-700">{pesan}</p>
                </div>
            </main>
            {barangDipilih && <PopupBarang key={barangDipilih.id} barang={barangDipilih} keranjang={keranjang}
            onClose={() => setBarangDipilih(null)} onPlus={tambahBarang} />}
        </>
    )
}
