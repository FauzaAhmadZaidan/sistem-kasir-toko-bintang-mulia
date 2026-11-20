import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DialogKasir from '../../pos/components/DialogKasir';
import Icon from '../../components/Icon';
import { rupiah, type BarisStruk, type ItemKeranjang, type StrukSimulasi } from '../../pos/kasir';

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
                <small>{item.jumlah} × {rupiah(item.harga)}</small>
            </div>
            <b>{rupiah(item.harga * item.jumlah)}</b>
        </li>
    ))}</ul>;
}

function IsiStruk({ struk }: { struk: StrukSimulasi }) {
    return (
        <div className="bmp-receipt">
            <div className="bmp-receipt-head">
                <strong>Bintang Mulia Packaging</strong>
                <span>Struk simulasi · Tunai</span>
                <code>{struk.nomor}</code>
                <time dateTime={struk.waktu}>{new Date(struk.waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</time>
            </div>
            <DaftarBelanja items={struk.items} />
            <dl className="bmp-totals">
                <div><dt>Total belanja</dt><dd>{rupiah(struk.total)}</dd></div>
                <div><dt>Uang diterima</dt><dd>{rupiah(struk.bayar)}</dd></div>
                <div><dt>Kembalian</dt><dd>{rupiah(struk.kembalian)}</dd></div>
            </dl>
        </div>
    );
}

export function DialogStruk({ struk, onTutup, onBaru }: { struk: StrukSimulasi; onTutup: () => void; onBaru?: () => void }) {
    return <>
        <DialogKasir judul="Struk simulasi" onTutup={onTutup} footer={<>
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
    terakhir?: StrukSimulasi;
    onSelesai: (struk: StrukSimulasi) => void;
};

export default function PembayaranKasir({ keranjang, tersedia, terakhir, onSelesai }: Props) {
    const [tahap, setTahap] = useState<'tutup' | 'bayar' | 'struk'>('tutup');
    const [uang, setUang] = useState('');
    const konfirmasi = useRef(false);
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
        setUang('');
        setTahap('bayar');
    }

    function selesaikan() {
        if (konfirmasi.current || !bolehBayar || bayar === null) return;
        konfirmasi.current = true;
        const sekarang = new Date();
        const kode = globalThis.crypto?.randomUUID?.().slice(0, 8)
            ?? sekarang.getTime().toString(36) + Math.random().toString(36).slice(2, 5);
        onSelesai({
            nomor: 'SIM-' + kode.toUpperCase(), waktu: sekarang.toISOString(),
            items: keranjang.map(({ skuId, nama, varian, jumlah, harga }) => ({ skuId, nama, varian, jumlah, harga })),
            total: cek.total, bayar, kembalian: bayar - cek.total,
        });
        setTahap('struk');
    }

    return <>
        <button className="bmp-primary bmp-wide" type="button" disabled={!tersedia || !cek.valid} onClick={bukaPembayaran}>
            Lanjut pembayaran <Icon name="panah" size={17} />
        </button>
        {terakhir && <button type="button" className="bmp-link bmp-last-receipt" onClick={() => setTahap('struk')}>Lihat struk simulasi terakhir</button>}
        {tahap === 'bayar' && <DialogKasir judul="Pembayaran tunai" keterangan="Simulasi" onTutup={() => setTahap('tutup')}
            footer={<>
                <button type="button" className="bmp-secondary" onClick={() => setTahap('tutup')}>Kembali</button>
                <button className="bmp-primary" type="submit" form={formId} disabled={!bolehBayar}>Konfirmasi simulasi</button>
            </>}>
            <form id={formId} noValidate onSubmit={(e) => { e.preventDefault(); selesaikan(); }}>
                <DaftarBelanja items={keranjang} />
                <div className="bmp-amount"><span>Total belanja</span><strong>{rupiah(cek.total)}</strong></div>
                <label className="bmp-field-label" htmlFor={inputId}>Uang diterima (Rp)</label>
                <input id={inputId} autoFocus className="bmp-input" type="text" inputMode="numeric" autoComplete="off"
                    maxLength={32} value={uang} placeholder="Contoh 50.000" aria-invalid={invalid} aria-describedby={inputId + '-bantuan'}
                    onChange={(e) => setUang(e.target.value)} />
                <div className="bmp-chips" aria-label="Nominal cepat">
                    <button type="button" onClick={() => setUang(String(cek.total))}>Uang pas</button>
                    {[20000, 50000, 100000].map((nilai) => <button type="button" key={nilai} onClick={() => setUang(String(nilai))}>{rupiah(nilai)}</button>)}
                </div>
                <p id={inputId + '-bantuan'} role="status" className="bmp-error-text">{invalid ? pesan : ''}</p>
                <div className="bmp-amount"><span>Kembalian</span><strong>{cukup && bayar !== null ? rupiah(bayar - cek.total) : '—'}</strong></div>
                <p className="bmp-note">Simulasi ini tidak mencatat penjualan atau mengurangi stok toko.</p>
            </form>
        </DialogKasir>}
        {tahap === 'struk' && terakhir && <DialogStruk struk={terakhir} onTutup={() => setTahap('tutup')} onBaru={() => {
            setTahap('tutup');
            requestAnimationFrame(() => document.getElementById('pencarian')?.focus());
        }} />}
    </>;
}
