import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DialogKasir from '../../pos/components/DialogKasir';
import Icon from '../../components/Icon';
import { rupiah, type BarisStruk, type ItemKeranjang, type StrukKasir } from '../../pos/kasir';
import { buatKodeCheckout, hasilBelumPasti, pesanTransaksi, simpanTransaksi, waktuTransaksi, type Checkout } from '../../pos/transaksi';

function periksaKeranjang(items: ItemKeranjang[]) {
    if (!items.length) return { valid: false, total: 0 };
    let total = 0;
    for (const item of items) {
        if (!Number.isSafeInteger(item.harga) || item.harga < 0 ||
            !Number.isSafeInteger(item.jumlah) || item.jumlah <= 0 || item.jumlah > item.stok) {
            return { valid: false, total: 0 };
        }
        total += item.harga * item.jumlah;
        if (!Number.isSafeInteger(total)) return { valid: false, total: 0 };
    }
    return { valid: true, total };
}

function bacaNominal(teks: string): number | null {
    const bersih = teks.trim().replace(/^rp\.?\s*/i, '');
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(bersih)) return null;
    const nilai = Number(bersih.replace(/\./g, ''));
    return Number.isSafeInteger(nilai) ? nilai : null;
}

function DaftarBelanja({ items }: { items: BarisStruk[] }) {
    return <ul className="bmp-receipt-lines">{items.map((item) => (
        <li key={item.skuId}>
            <div><strong>{item.nama}</strong>{item.varian && <small>{item.varian}</small>}
                <small>{item.jumlah} × {item.harga === null ? 'Harga tidak tersimpan' : rupiah(item.harga)}</small>
            </div>
            <b>{item.harga === null ? '—' : rupiah(item.harga * item.jumlah)}</b>
        </li>
    ))}</ul>;
}

function IsiStruk({ struk }: { struk: StrukKasir }) {
    return (
        <div className="bmp-receipt">
            <div className="bmp-receipt-head">
                <strong>Bintang Mulia Packaging</strong>
                <span>Struk pembayaran · Tunai</span>
                <code>{struk.nomor}</code>
                <time dateTime={struk.waktu}>{waktuTransaksi(struk.waktu)} WIB</time>
                <span>Kasir: {struk.kasir}</span>
            </div>
            <DaftarBelanja items={struk.items} />
            {struk.items.some((item) => item.harga === null) && <p className="bmp-note">Transaksi lama ini belum menyimpan harga per barang. Total di bawah mengikuti nilai transaksi yang tercatat.</p>}
            <dl className="bmp-totals">
                <div><dt>Total belanja</dt><dd>{rupiah(struk.total)}</dd></div>
                <div><dt>Uang diterima</dt><dd>{rupiah(struk.bayar)}</dd></div>
                <div><dt>Kembalian</dt><dd>{rupiah(struk.kembalian)}</dd></div>
            </dl>
        </div>
    );
}

export function DialogStruk({ struk, onTutup, onBaru }: { struk: StrukKasir; onTutup: () => void; onBaru?: () => void }) {
    return <>
        <DialogKasir judul="Detail transaksi" onTutup={onTutup} footer={<>
            <button className="bmp-secondary" onClick={() => window.print()}><Icon name="cetak" size={16} />Cetak struk</button>
            <button className="bmp-primary" onClick={onBaru ?? onTutup}>{onBaru ? 'Transaksi baru' : 'Selesai'}</button>
        </>}>
            <IsiStruk struk={struk} />
        </DialogKasir>
        {createPortal(<article className="bmp-print" aria-hidden="true"><IsiStruk struk={struk} /></article>, document.body)}
    </>;
}

type Props = {
    keranjang: ItemKeranjang[];
    tersedia: boolean;
    terakhir?: StrukKasir;
    onSelesai: (struk: StrukKasir) => void;
    onPerluMuatUlang?: () => void;
};

export default function PembayaranKasir({ keranjang, tersedia, terakhir, onSelesai, onPerluMuatUlang }: Props) {
    const [tahap, setTahap] = useState<'tutup' | 'bayar' | 'struk'>('tutup');
    const [uang, setUang] = useState('');
    const konfirmasi = useRef(false);
    const percobaan = useRef<Checkout | null>(null);
    const [menyimpan, setMenyimpan] = useState(false);
    const [belumPasti, setBelumPasti] = useState(false);
    const [error, setError] = useState('');
    const formId = useId();
    const inputId = useId();
    const cek = periksaKeranjang(keranjang);
    const bayar = bacaNominal(uang);
    const cukup = bayar !== null && bayar >= cek.total;
    const bolehBayar = tersedia && cek.valid && cukup;
    const pesan = bayar === null ? 'Masukkan rupiah bulat, misalnya 50.000.'
        : !cukup ? 'Uang masih kurang ' + rupiah(cek.total - bayar) + '.' : '';
    const invalid = uang.trim() !== '' && !cukup;

    function bukaPembayaran() {
        if (!tersedia || !cek.valid) return;
        konfirmasi.current = false;
        percobaan.current = null;
        setError('');
        setBelumPasti(false);
        setUang('');
        setTahap('bayar');
    }

    async function selesaikan() {
        if (konfirmasi.current || (!belumPasti && !bolehBayar) || bayar === null) return;
        konfirmasi.current = true;
        setMenyimpan(true);
        setError('');
        try {
            // Kode dan payload tetap sama saat respons checkout belum diterima.
            percobaan.current ??= {
                kode_checkout: buatKodeCheckout(), total: cek.total, bayar,
                items: keranjang.map((item) => ({ id: item.skuId, qty: item.jumlah, harga: item.harga })),
            };
            const struk = await simpanTransaksi(percobaan.current);
            onSelesai(struk);
            setBelumPasti(false);
            percobaan.current = null;
            setTahap('struk');
        } catch (err) {
            const tidakPasti = hasilBelumPasti(err);
            setBelumPasti(tidakPasti);
            setError(pesanTransaksi(err));
            if (!tidakPasti) {
                percobaan.current = null;
                onPerluMuatUlang?.();
            }
        } finally {
            konfirmasi.current = false;
            setMenyimpan(false);
        }
    }

    function tutupPembayaran() {
        if (!menyimpan && !belumPasti) setTahap('tutup');
    }

    return <>
        <button className="bmp-primary bmp-wide" type="button" disabled={!tersedia || !cek.valid} onClick={bukaPembayaran}>
            Lanjut pembayaran
        </button>
        {terakhir && <button type="button" className="bmp-link bmp-last-receipt" onClick={() => setTahap('struk')}>Lihat struk terakhir</button>}
        {tahap === 'bayar' && <DialogKasir judul="Pembayaran tunai" onTutup={tutupPembayaran}
            footer={<>
                <button type="button" className="bmp-secondary" disabled={menyimpan || belumPasti} onClick={tutupPembayaran}>Kembali</button>
                <button className="bmp-primary" type="submit" form={formId} disabled={menyimpan || (!belumPasti && !bolehBayar)}>{menyimpan ? 'Menyimpan…' : belumPasti ? 'Coba konfirmasi lagi' : 'Konfirmasi pembayaran'}</button>
            </>}>
            <form id={formId} noValidate onSubmit={(e) => { e.preventDefault(); selesaikan(); }}>
                <DaftarBelanja items={keranjang} />
                <div className="bmp-amount"><span>Total belanja</span><strong>{rupiah(cek.total)}</strong></div>
                <label className="bmp-field-label" htmlFor={inputId}>Uang diterima (Rp)</label>
                <input id={inputId} autoFocus className="bmp-input" type="text" inputMode="numeric" autoComplete="off"
                    disabled={menyimpan || belumPasti} maxLength={32} value={uang} placeholder="Contoh 50.000" aria-invalid={invalid} aria-describedby={inputId + '-bantuan'}
                    onChange={(e) => setUang(e.target.value)} />
                <div className="bmp-chips" aria-label="Nominal cepat">
                    <button type="button" disabled={menyimpan || belumPasti} onClick={() => setUang(String(cek.total))}>Uang pas</button>
                    {[20000, 50000, 100000].map((nilai) => <button type="button" disabled={menyimpan || belumPasti} key={nilai} onClick={() => setUang(String(nilai))}>{rupiah(nilai)}</button>)}
                </div>
                <p id={inputId + '-bantuan'} role="status" className="bmp-error-text">{invalid ? pesan : ''}</p>
                <div className="bmp-amount"><span>Kembalian</span><strong>{cukup && bayar !== null ? rupiah(bayar - cek.total) : '—'}</strong></div>
                {error && <p className="bmp-error-text" role="alert">{error}</p>}
                {belumPasti && <p className="bmp-notice">Status pembayaran belum diketahui. Gunakan “Coba konfirmasi lagi” untuk memeriksa dan menyelesaikan pembayaran yang sama. Jika perlu memuat ulang halaman, periksa riwayat sebelum membuat transaksi baru.</p>}
            </form>
        </DialogKasir>}
        {tahap === 'struk' && terakhir && <DialogStruk struk={terakhir} onTutup={() => setTahap('tutup')} onBaru={() => {
            setTahap('tutup');
            requestAnimationFrame(() => document.getElementById('pencarian')?.focus());
        }} />}
    </>;
}
