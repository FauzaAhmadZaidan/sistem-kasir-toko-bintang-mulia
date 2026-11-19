import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Bentuk ini cocok dengan ItemKeranjang di Index.tsx sebelumnya.
// Data barang lengkap boleh tetap berada di Index.tsx.
type ItemPembayaran = {
    key: string;
    barang: { n_barang: string };
    varian: { n_varian: string } | null;
    harga: number;
    jumlah: number;
    stok: number;
};

type BarisStruk = {
    key: string;
    nama: string;
    varian: string | null;
    harga: number;
    jumlah: number;
    subtotal: number;
};

type StrukSimulasi = {
    nomor: string;
    waktu: string;
    items: BarisStruk[];
    total: number;
    bayar: number;
    kembalian: number;
};

type Props = {
    keranjang: readonly ItemPembayaran[];
    // Dipanggil sekali setelah konfirmasi simulasi untuk mengosongkan keranjang.
    // Ini belum merupakan callback dari API pembayaran.
    onSelesai: () => void;
};

const rupiah = (nilai: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(nilai);

const fokus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';
const utama = `rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${fokus}`;
const sekunder = `rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 ${fokus}`;

function periksaKeranjang(items: readonly ItemPembayaran[]) {
    if (items.length === 0) return { valid: false, total: 0, pesan: 'Tambahkan barang terlebih dahulu.' };
    let total = 0;
    for (const item of items) {
        if (!Number.isSafeInteger(item.harga) || item.harga < 0 ||
            !Number.isSafeInteger(item.jumlah) || item.jumlah <= 0 ||
            !Number.isSafeInteger(item.stok) || item.stok < item.jumlah) {
            return { valid: false, total: 0, pesan: 'Periksa harga, jumlah, dan stok barang di keranjang.' };
        }
        const subtotal = item.harga * item.jumlah;
        total += subtotal;
        if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(total)) {
            return { valid: false, total: 0, pesan: 'Nominal belanja terlalu besar untuk dihitung dengan aman.' };
        }
    }
    return { valid: true, total, pesan: '' };
}

// Menerima 50000, 50.000, atau Rp50.000. Menolak negatif, desimal,
// notasi eksponen, teks lain, dan angka di luar batas integer aman.
function bacaNominal(teks: string): number | null {
    const bersih = teks.trim().replace(/^rp\.?\s*/i, '');
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(bersih)) return null;
    const nilai = Number(bersih.replace(/\./g, ''));
    return Number.isSafeInteger(nilai) && nilai >= 0 ? nilai : null;
}

function buatBaris(items: readonly ItemPembayaran[]): BarisStruk[] {
    return items.map((item) => ({
        key: item.key, nama: item.barang.n_barang, varian: item.varian?.n_varian ?? null,
        harga: item.harga, jumlah: item.jumlah, subtotal: item.harga * item.jumlah,
    }));
}

function DialogKasir({ judul, onTutup, children, footer }: {
    judul: string;
    onTutup: () => void;
    children: ReactNode;
    footer: ReactNode;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const judulId = useId();

    useEffect(() => {
        const dialog = ref.current;
        const overflow = document.body.style.overflow;
        dialog?.showModal();
        document.body.style.overflow = 'hidden';
        return () => {
            dialog?.close();
            document.body.style.overflow = overflow;
        };
    }, []);

    return (
        <dialog ref={ref} aria-labelledby={judulId}
            onCancel={(event) => { event.preventDefault(); onTutup(); }}
            onClick={(event) => { if (event.target === event.currentTarget) onTutup(); }}
            className="rounded-3xl bg-white text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
            style={{ position: 'fixed', inset: 0, margin: 'auto', width: 'min(680px, calc(100vw - 32px))', maxWidth: 'none', maxHeight: 'calc(100dvh - 32px)', border: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100dvh - 32px)', minHeight: 0 }}>
                <header className="border-b border-slate-100"
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '20px 24px', flexShrink: 0 }}>
                    <div style={{ minWidth: 0 }}>
                        <p className="text-xs font-medium text-indigo-600" style={{ margin: 0 }}>Toko Bintang Mulia</p>
                        <h2 id={judulId} className="text-xl font-bold" style={{ margin: '6px 0 0', lineHeight: 1.4, overflowWrap: 'anywhere' }}>{judul}</h2>
                    </div>
                    <button type="button" onClick={onTutup} aria-label="Tutup pembayaran"
                        className={`rounded-full bg-slate-100 text-xl hover:bg-slate-200 ${fokus}`}
                        style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, padding: 0, flexShrink: 0 }}>×</button>
                </header>
                <div style={{ padding: 24, overflowY: 'auto', minHeight: 0, overscrollBehavior: 'contain' }}>{children}</div>
                <footer className="border-t border-slate-100 bg-white" style={{ padding: '16px 24px 24px', flexShrink: 0 }}>{footer}</footer>
            </div>
        </dialog>
    );
}

function DaftarBelanja({ items }: { items: BarisStruk[] }) {
    return (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {items.map((item) => (
                <li key={item.key} className="border-b border-slate-100 last:border-0"
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px 16px', padding: '12px 0', breakInside: 'avoid' }}>
                    <div style={{ flex: '1 1 160px', minWidth: 0, overflowWrap: 'anywhere' }}>
                        <p className="text-sm font-semibold" style={{ margin: 0 }}>{item.nama}</p>
                        {item.varian && <p className="text-xs text-slate-500" style={{ margin: '4px 0 0' }}>{item.varian}</p>}
                        <p className="text-xs text-slate-500" style={{ margin: '6px 0 0' }}>{item.jumlah} × {rupiah(item.harga)}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums" style={{ marginLeft: 'auto', textAlign: 'right', overflowWrap: 'anywhere', maxWidth: '100%' }}>{rupiah(item.subtotal)}</span>
                </li>
            ))}
        </ul>
    );
}

function AngkaRingkasan({ label, nilai, besar = false }: { label: string; nilai: number; besar?: boolean }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 16px' }}>
            <span className="text-sm text-slate-500">{label}</span>
            <strong className={`${besar ? 'text-xl' : 'text-sm'} tabular-nums`} style={{ marginLeft: 'auto', textAlign: 'right', overflowWrap: 'anywhere' }}>{rupiah(nilai)}</strong>
        </div>
    );
}

function IsiStruk({ struk }: { struk: StrukSimulasi }) {
    return (
        <>
            <div className="rounded-xl bg-amber-50 text-amber-800" style={{ padding: 12, fontSize: 12, lineHeight: 1.6 }}>
                STRUK SIMULASI — transaksi belum disimpan ke server.
            </div>
            <div className="text-xs text-slate-500" style={{ marginTop: 16, lineHeight: 1.7, overflowWrap: 'anywhere' }}>
                <p style={{ margin: 0 }}>Nomor simulasi: {struk.nomor}</p>
                <p style={{ margin: 0 }}>Waktu: {struk.waktu}</p>
                <p style={{ margin: 0 }}>Metode: Tunai</p>
            </div>
            <div style={{ marginTop: 12 }}><DaftarBelanja items={struk.items} /></div>
            <div className="border-t border-slate-200" style={{ display: 'grid', gap: 12, marginTop: 12, paddingTop: 16 }}>
                <AngkaRingkasan label="Total belanja" nilai={struk.total} besar />
                <AngkaRingkasan label="Uang diterima" nilai={struk.bayar} />
                <AngkaRingkasan label="Kembalian" nilai={struk.kembalian} besar />
            </div>
        </>
    );
}

export default function PembayaranKasir({ keranjang, onSelesai }: Props) {
    const [tahap, setTahap] = useState<'tutup' | 'bayar' | 'selesai'>('tutup');
    const [uangDiterima, setUangDiterima] = useState('');
    const [strukTerakhir, setStrukTerakhir] = useState<StrukSimulasi | null>(null);
    const kunciKonfirmasi = useRef(false);
    const formId = useId();
    const inputId = useId();
    const bantuanId = useId();
    const cek = periksaKeranjang(keranjang);
    const bayar = bacaNominal(uangDiterima);
    const cukup = bayar !== null && bayar >= cek.total;
    const bolehBayar = cek.valid && cukup;
    const kembalian = bolehBayar && bayar !== null ? bayar - cek.total : 0;
    const adaInput = uangDiterima.trim() !== '';
    const inputBermasalah = adaInput && (bayar === null || !cukup);
    const pesanInput = !cek.valid ? cek.pesan : !adaInput ? 'Masukkan uang yang diterima dari pembeli.'
        : bayar === null ? 'Gunakan rupiah bulat, misalnya 50000 atau 50.000.'
        : !cukup ? `Uang masih kurang ${rupiah(cek.total - bayar)}.`
        : bayar === cek.total ? 'Uang pas. Tidak ada kembalian.' : `Kembalian pembeli ${rupiah(kembalian)}.`;

    function bukaPembayaran() {
        if (!cek.valid) return;
        kunciKonfirmasi.current = false;
        setUangDiterima('');
        setTahap('bayar');
    }

    function konfirmasiSimulasi() {
        // Pemeriksaan di handler mencegah konfirmasi lewat Enter maupun klik ganda.
        if (kunciKonfirmasi.current || !bolehBayar || bayar === null) return;
        kunciKonfirmasi.current = true;
        const sekarang = new Date();
        const kode = globalThis.crypto?.randomUUID?.().slice(0, 8).toUpperCase()
            ?? `${sekarang.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
        // Salin nilai transaksi agar struk tetap utuh setelah keranjang dikosongkan.
        setStrukTerakhir({
            nomor: `SIM-${kode}`,
            waktu: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(sekarang),
            items: buatBaris(keranjang), total: cek.total, bayar, kembalian,
        });
        setTahap('selesai');
        onSelesai();
    }

    function transaksiBaru() {
        setTahap('tutup');
        setUangDiterima('');
        // Kembali ke pencarian barang jika id input mengikuti Index.tsx sebelumnya.
        requestAnimationFrame(() => document.getElementById('pencarian')?.focus());
    }

    return (
        <>
            <button type="button" disabled={!cek.valid} onClick={bukaPembayaran}
                className={utama} style={{ display: 'block', width: '100%', minHeight: 48, padding: '12px 16px' }}>Lanjut pembayaran</button>
            <p className="text-xs text-slate-500" style={{ margin: '8px 0 0', textAlign: 'center', lineHeight: 1.6 }}>
                {keranjang.length > 0 && !cek.valid ? cek.pesan : 'Simulasi tunai · transaksi belum tersimpan.'}
            </p>
            {strukTerakhir && (
                <button type="button" onClick={() => setTahap('selesai')}
                    className={`rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 ${fokus}`}
                    style={{ display: 'block', width: '100%', padding: '10px 8px', marginTop: 8 }}>Lihat struk simulasi terakhir</button>
            )}

            {tahap === 'bayar' && (
                <DialogKasir key="bayar" judul="Pembayaran tunai" onTutup={() => setTahap('tutup')}
                    footer={(
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 12 }}>
                            <button type="button" onClick={() => setTahap('tutup')} className={sekunder} style={{ minHeight: 48, padding: '12px 16px' }}>Kembali ke keranjang</button>
                            <button type="submit" form={formId} disabled={!bolehBayar} className={utama} style={{ minHeight: 48, padding: '12px 16px' }}>Konfirmasi simulasi</button>
                        </div>
                    )}>
                    <form id={formId} noValidate onSubmit={(event) => { event.preventDefault(); konfirmasiSimulasi(); }}>
                        <div className="rounded-xl bg-amber-50 text-amber-800" style={{ padding: 12, fontSize: 12, lineHeight: 1.6 }}>
                            Mode simulasi. Pembayaran ini belum menyimpan transaksi atau mengurangi stok di server.
                        </div>
                        <h3 className="text-sm font-semibold" style={{ margin: '20px 0 0' }}>Ringkasan belanja</h3>
                        <DaftarBelanja items={buatBaris(keranjang)} />
                        <div className="rounded-xl bg-indigo-50" style={{ padding: 16, marginTop: 16 }}>
                            <AngkaRingkasan label="Total yang dibayar" nilai={cek.total} besar />
                        </div>
                        <label htmlFor={inputId} className="text-sm font-semibold" style={{ display: 'block', marginTop: 24, marginBottom: 8 }}>Uang diterima (Rp)</label>
                        <input id={inputId} autoFocus type="text" inputMode="numeric" autoComplete="off" maxLength={32}
                            value={uangDiterima} onChange={(event) => setUangDiterima(event.target.value)}
                            placeholder="Contoh: 50000" aria-invalid={inputBermasalah} aria-describedby={bantuanId}
                            className={`rounded-xl border bg-white text-lg tabular-nums ${inputBermasalah ? 'border-rose-400' : 'border-slate-300'} ${fokus}`}
                            style={{ display: 'block', width: '100%', minWidth: 0, padding: '12px 14px', boxSizing: 'border-box' }} />
                        <div aria-label="Nominal cepat" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                            <button type="button" onClick={() => setUangDiterima(String(cek.total))} className={sekunder} style={{ padding: '10px 12px' }}>Uang pas</button>
                            {[20000, 50000, 100000].map((nilai) => (
                                <button type="button" key={nilai} onClick={() => setUangDiterima(String(nilai))} className={sekunder} style={{ padding: '10px 12px' }}>{rupiah(nilai)}</button>
                            ))}
                        </div>
                        <p id={bantuanId} role="status" aria-live="polite"
                            className={`text-xs ${inputBermasalah || !cek.valid ? 'text-rose-600' : 'text-slate-500'}`}
                            style={{ margin: '12px 0 0', lineHeight: 1.6 }}>{pesanInput}</p>
                        <div className={`rounded-xl ${bolehBayar ? 'bg-emerald-50' : 'bg-slate-50'}`} style={{ padding: 16, marginTop: 20 }}>
                            <AngkaRingkasan label="Kembalian" nilai={kembalian} besar />
                        </div>
                    </form>
                </DialogKasir>
            )}

            {tahap === 'selesai' && strukTerakhir && (
                <DialogKasir key="selesai" judul="Simulasi pembayaran selesai" onTutup={() => setTahap('tutup')}
                    footer={(
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 12 }}>
                            <button type="button" onClick={() => window.print()} className={sekunder} style={{ minHeight: 48, padding: '12px 16px' }}>Cetak struk simulasi</button>
                            <button type="button" autoFocus onClick={transaksiBaru} className={utama} style={{ minHeight: 48, padding: '12px 16px' }}>Transaksi baru</button>
                        </div>
                    )}>
                    <IsiStruk struk={strukTerakhir} />
                    <p className="text-xs text-slate-500" style={{ margin: '20px 0 0', lineHeight: 1.6 }}>Struk ini hanya tersedia selama halaman masih terbuka. Muat ulang halaman akan menghapusnya.</p>
                </DialogKasir>
            )}

            {strukTerakhir && typeof document !== 'undefined' && createPortal(
                <article className="tbm-struk-cetak" aria-hidden="true">
                    <style>{`
                        .tbm-struk-cetak { display: none; }
                        @media print {
                            @page { size: auto; margin: 10mm; }
                            html, body { height: auto !important; overflow: visible !important; background: white !important; }
                            body > :not(.tbm-struk-cetak) { display: none !important; }
                            dialog, dialog::backdrop { display: none !important; }
                            body > .tbm-struk-cetak { display: block !important; width: 100%; max-width: 80mm; margin: 0 auto; font: 12px/1.6 monospace; }
                            .tbm-struk-cetak * { color: #111 !important; background: white !important; box-shadow: none !important; }
                        }
                    `}</style>
                    <h1 style={{ fontSize: 18, textAlign: 'center', margin: '0 0 16px' }}>Toko Bintang Mulia</h1>
                    <IsiStruk struk={strukTerakhir} />
                    <p style={{ textAlign: 'center', marginTop: 20 }}>Terima kasih.</p>
                </article>, document.body,
            )}
        </>
    );
}
