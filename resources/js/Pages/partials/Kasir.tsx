import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import DialogKasir from '../../pos/components/DialogKasir';
import { itemDariSku, jumlahItem, namaVarian, rupiah, type BarangKasir, type ItemKeranjang, type SesiKasir, type SkuKasir } from '../../pos/kasir';
import PembayaranKasir from '../Cashier/PembayaranKasir';
import '../../../css/kasir.css';

function PengaturJumlah({ jumlah, maks, label, onChange }: {
    jumlah: number; maks: number; label: string; onChange: (nilai: number) => void;
}) {
    return <div className="bmp-stepper" role="group" aria-label={'Jumlah ' + label}>
        <button type="button" disabled={jumlah <= 1} aria-label={'Kurangi ' + label} onClick={() => onChange(jumlah - 1)}><Icon name="kurang" size={14} /></button>
        <span>{jumlah}</span>
        <button type="button" disabled={jumlah >= maks} aria-label={'Tambah ' + label} onClick={() => onChange(jumlah + 1)}><Icon name="tambah" size={14} /></button>
    </div>;
}

function PilihBarang({ barang, keranjang, onTambah, onTutup }: {
    barang: BarangKasir; keranjang: ItemKeranjang[]; onTambah: (sku: SkuKasir, jumlah: number) => void; onTutup: () => void;
}) {
    const pilihVarian = barang.has_varian || barang.skus.length > 1;
    const [id, setId] = useState<number | null>(pilihVarian ? null : barang.skus[0]?.id ?? null);
    const [jumlah, setJumlah] = useState(1);
    const sku = barang.skus.find((item) => item.id === id);
    const sisa = (item: SkuKasir) => Math.max(0, item.stok - (keranjang.find((x) => x.skuId === item.id)?.jumlah ?? 0));
    const maks = sku ? sisa(sku) : 0;

    return <DialogKasir judul={barang.nama} keterangan={barang.kategori?.nama ?? 'Barang'} onTutup={onTutup} footer={<>
        <div className="bmp-subtotal"><small>Subtotal pilihan</small><strong>{sku ? rupiah(sku.harga * jumlah) : '—'}</strong></div>
        <button className="bmp-primary" disabled={!sku || jumlah > maks} onClick={() => {
            if (sku && jumlah <= maks) { onTambah(sku, jumlah); onTutup(); }
        }}>Tambah ke keranjang</button>
    </>}>
        {pilihVarian ? <fieldset className="bmp-variants"><legend>Pilih varian</legend>
            {barang.skus.map((item) => <label key={item.id} className={'bmp-variant' + (item.id === id ? ' is-selected' : '')}>
                <input type="radio" name="sku" checked={id === item.id} disabled={sisa(item) === 0}
                    onChange={() => { setId(item.id); setJumlah(1); }} />
                <span><strong>{namaVarian(barang, item)}</strong><small>{item.kode_sku}</small></span>
                <span className="bmp-variant-price"><b>{rupiah(item.harga)}</b><small>{sisa(item) > 0 ? 'Tersedia ' + sisa(item) : 'Tidak tersedia'}</small></span>
            </label>)}
        </fieldset> : sku && <div className="bmp-single-sku"><code>{sku.kode_sku}</code><strong>{rupiah(sku.harga)}</strong><small>Tersedia {maks}</small></div>}
        <div className="bmp-quantity-row"><strong>Jumlah</strong><PengaturJumlah jumlah={jumlah} maks={maks} label={barang.nama} onChange={setJumlah} /></div>
    </DialogKasir>;
}

function BarisBarang({ barang, onPilih }: { barang: BarangKasir; onPilih: () => void }) {
    const gambar = barang.skus.find((sku) => sku.gambar)?.gambar;
    const [rusak, setRusak] = useState<string | null>(null);
    const stok = barang.skus.reduce((n, sku) => n + sku.stok, 0);
    const harga = barang.skus.map((sku) => sku.harga);
    const terendah = Math.min(...harga);
    const bervariasi = harga.some((n) => n !== terendah);
    const kategori = barang.kategori?.nama ?? 'Tanpa kategori';
    return <button type="button" className="bmp-product" disabled={!stok || !harga.length} onClick={onPilih}>
        <span className="bmp-product-image">{gambar && gambar !== rusak
            ? <img src={gambar} loading="lazy" alt="" onError={() => setRusak(gambar)} />
            : <Icon name="barang" size={24} />}</span>
        <span className="bmp-product-info"><strong>{barang.nama}</strong><small>{kategori} · {barang.has_varian ? barang.skus.length + ' varian' : barang.skus[0]?.kode_sku}</small></span>
        <span className="bmp-product-price"><small>{stok === 0 ? 'Stok habis' : bervariasi ? 'Mulai dari' : 'Harga'}</small><b>{harga.length ? rupiah(terendah) : '—'}</b></span>
        <span className="bmp-add"><Icon name="tambah" size={15} /></span>
    </button>;
}

export default function Kasir({ sesi }: { sesi: SesiKasir }) {
    const { keranjang, setKeranjang, riwayat, selesai } = sesi;
    const [barang, setBarang] = useState<BarangKasir[]>([]);
    const [status, setStatus] = useState<'memuat' | 'siap' | 'gagal'>('memuat');
    const [versi, setVersi] = useState(0);
    const [error, setError] = useState('');
    const [pencarian, setPencarian] = useState('');
    const [kategoriId, setKategoriId] = useState<number | null>(null);
    const [dipilih, setDipilih] = useState<BarangKasir | null>(null);
    const [pesan, setPesan] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        async function muat() {
            try {
                const response = await fetch('/kasir/katalog', {
                    headers: { Accept: 'application/json' }, signal: controller.signal, cache: 'no-store',
                });
                if (!response.ok) throw new Error(response.status === 401 ? 'Sesi login berakhir. Silakan masuk kembali.' : 'Katalog gagal dimuat.');
                const hasil = await response.json();
                if (!Array.isArray(hasil.data)) throw new Error('Format katalog tidak sesuai.');
                if (controller.signal.aborted) return;
                setBarang(hasil.data);
                setStatus('siap');
            } catch (err) {
                if (controller.signal.aborted) return;
                setError(err instanceof Error && !(err instanceof TypeError) ? err.message : 'Koneksi ke katalog terputus.');
                setStatus('gagal');
            }
        }
        void muat();
        return () => controller.abort();
    }, [versi]);

    function muatUlang() {
        setStatus('memuat');
        setVersi((nilai) => nilai + 1);
    }

    const katalogSku = useMemo(() => new Map(barang.flatMap((b) => b.skus.map((sku) => [sku.id, { barang: b, sku }] as const))), [barang]);
    const terbaru = keranjang.flatMap((item) => {
        const data = katalogSku.get(item.skuId);
        if (!data || data.sku.stok <= 0) return [];
        return [itemDariSku(data.barang, data.sku, Math.min(item.jumlah, data.sku.stok))];
    });
    const berubah = status === 'siap' && (terbaru.length !== keranjang.length ||
        terbaru.some((item, i) => item.harga !== keranjang[i].harga || item.jumlah !== keranjang[i].jumlah));
    const baris = status === 'siap' && !berubah ? terbaru : keranjang;
    const kategori = [...new Map(barang.flatMap((b) => b.kategori ? [[b.kategori.id, b.kategori] as const] : [])).values()];
    const filterKategori = kategori.find((k) => k.id === kategoriId)?.id ?? null;
    const cari = pencarian.trim().toLowerCase();
    const hasil = barang.filter((b) => (filterKategori === null || b.kategori?.id === filterKategori) &&
        [b.nama, ...b.skus.flatMap((s) => [s.kode_sku, s.nama_sku, namaVarian(b, s)])].join(' ').toLowerCase().includes(cari));
    const jumlah = jumlahItem(baris);
    const total = baris.reduce((n, item) => n + item.jumlah * item.harga, 0);

    function tambah(b: BarangKasir, sku: SkuKasir, qty: number) {
        setKeranjang((items) => {
            const lama = items.find((item) => item.skuId === sku.id);
            const baru = (lama?.jumlah ?? 0) + qty;
            if (qty < 1 || baru > sku.stok) return items;
            const item = itemDariSku(b, sku, baru);
            return lama ? items.map((i) => i.skuId === sku.id ? item : i) : [...items, item];
        });
        setPesan(qty + ' ' + b.nama + ' ditambahkan ke keranjang.');
    }

    return <section className="bmp-page bmp-kasir">
        <div className="bmp-page-heading"><h1>Kasir / Penjualan</h1>
            <button className="bmp-secondary bmp-jump-cart" onClick={() => document.getElementById('keranjang')?.focus()}>
                <Icon name="kasir" size={16} />Keranjang ({jumlah})
            </button>
        </div>
        <div className="bmp-pos-grid">
            <section className="bmp-panel bmp-catalog" aria-labelledby="judul-katalog">
                <div className="bmp-panel-heading"><h2 id="judul-katalog">Katalog barang</h2>
                    <button type="button" className="bmp-icon-button" aria-label="Muat ulang katalog" title="Muat ulang katalog" disabled={status === 'memuat'} onClick={muatUlang}><Icon name="ulang" size={17} /></button>
                </div>
                <div className="bmp-filters">
                    <label className="bmp-search"><Icon name="cari" size={18} /><input id="pencarian" type="search" value={pencarian}
                        onChange={(e) => setPencarian(e.target.value)} aria-label="Cari barang" placeholder="Cari nama, SKU, atau varian…" /></label>
                    <div className="bmp-chips" role="group" aria-label="Filter kategori">
                        <button type="button" aria-pressed={filterKategori === null} onClick={() => setKategoriId(null)}>Semua</button>
                        {kategori.map((k) => <button key={k.id} type="button" aria-pressed={filterKategori === k.id} onClick={() => setKategoriId(k.id)}>{k.nama}</button>)}
                    </div>
                </div>
                {status === 'memuat' ? <p className="bmp-empty" role="status">Memuat katalog…</p> : status === 'gagal' ?
                    <div className="bmp-empty" role="alert"><strong>{error}</strong><button type="button" className="bmp-link" onClick={muatUlang}>Coba lagi</button></div> :
                    hasil.length ? <><div className="bmp-list-label">{hasil.length} barang</div><div className="bmp-products">
                        {hasil.map((b) => <BarisBarang key={b.id} barang={b} onPilih={() => setDipilih(b)} />)}
                    </div></> : <div className="bmp-empty"><Icon name={barang.length ? 'cari' : 'barang'} size={25} />
                        <strong>{barang.length ? 'Barang tidak ditemukan' : 'Belum ada barang di katalog'}</strong>
                        {barang.length ? <button className="bmp-link" onClick={() => { setPencarian(''); setKategoriId(null); }}>Reset pencarian dan filter</button>
                            : <p>Barang akan tampil setelah admin mengaktifkan SKU dan mengisi harganya.</p>}
                    </div>}
            </section>

            <aside className="bmp-panel bmp-cart" aria-labelledby="keranjang">
                <div className="bmp-panel-heading"><h2 id="keranjang" tabIndex={-1}>Keranjang</h2><span className="bmp-count">{jumlah} item</span></div>
                {baris.length ? <ul className="bmp-cart-lines">{baris.map((item) => <li key={item.skuId}>
                    <div className="bmp-cart-line-top"><div><strong>{item.nama}</strong>{item.varian && <small>{item.varian}</small>}<small>{rupiah(item.harga)} / item</small></div>
                        <button className="bmp-icon-button" aria-label={'Hapus ' + item.nama + ' ' + item.varian}
                            onClick={() => setKeranjang((items) => items.filter((i) => i.skuId !== item.skuId))}><Icon name="hapus" size={16} /></button>
                    </div>
                    <div className="bmp-cart-line-bottom"><PengaturJumlah jumlah={item.jumlah} maks={status === 'siap' && !berubah ? item.stok : item.jumlah}
                        label={[item.nama, item.varian].filter(Boolean).join(' ')} onChange={(nilai) => setKeranjang((items) =>
                            items.map((i) => i.skuId === item.skuId ? { ...i, jumlah: nilai } : i))} /><b>{rupiah(item.harga * item.jumlah)}</b></div>
                </li>)}</ul> : <div className="bmp-empty bmp-cart-empty"><span className="bmp-empty-icon"><Icon name="kasir" size={24} /></span>
                    <strong>Keranjang masih kosong</strong><p>Pilih barang dari katalog untuk memulai.</p></div>}
                {berubah && <div className="bmp-notice" role="alert">Harga atau stok di katalog berubah. <button className="bmp-link" onClick={() => setKeranjang(terbaru)}>Sesuaikan keranjang</button></div>}
                <div className="bmp-cart-footer">
                    <div className="bmp-total"><span>Total belanja</span><strong>{rupiah(total)}</strong></div>
                    <PembayaranKasir keranjang={baris} tersedia={status === 'siap' && !berubah} terakhir={riwayat[0]} onSelesai={(struk) => {
                        selesai(struk); setPesan('Simulasi pembayaran selesai.');
                    }} />
                    <p className="bmp-note">Simulasi tunai · Stok toko tetap.</p>
                </div>
            </aside>
        </div>
        <p role="status" aria-live="polite" className="bmp-status">{pesan}</p>
        {dipilih && <PilihBarang barang={dipilih} keranjang={keranjang} onTutup={() => setDipilih(null)} onTambah={(sku, qty) => tambah(dipilih, sku, qty)} />}
    </section>;
}
