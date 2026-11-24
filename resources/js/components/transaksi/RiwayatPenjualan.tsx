import { useEffect, useState, type FormEvent } from 'react';
import Icon from '../Icon';
import DialogKasir from '../../pos/components/DialogKasir';
import { rupiah } from '../../pos/kasir';
import { ambilDetailTransaksi, ambilTransaksi, pesanTransaksi, strukDariTransaksi, tanggalWib, waktuTransaksi, type DaftarTransaksi, type FilterTransaksi, type Transaksi } from '../../pos/transaksi';
import { DialogStruk } from '../../Pages/Cashier/PembayaranKasir';
import '../../../css/kasir.css';
import '../../../css/laporan.css';

const filterKosong: FilterTransaksi = { cari: '', tanggal_mulai: '', tanggal_selesai: '', kasir_id: '' };

function DetailTransaksi({ id, onTutup }: { id: number; onTutup: () => void }) {
    const [data, setData] = useState<Transaksi | null>(null);
    const [error, setError] = useState('');
    const [versi, setVersi] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setData(null);
        setError('');
        ambilDetailTransaksi(id, controller.signal).then((hasil) => {
            if (!controller.signal.aborted) setData(hasil);
        }).catch((err) => {
            if (!controller.signal.aborted) setError(pesanTransaksi(err));
        });
        return () => controller.abort();
    }, [id, versi]);

    if (data) return <DialogStruk struk={strukDariTransaksi(data)} onTutup={onTutup} />;
    return <DialogKasir judul="Detail transaksi" onTutup={onTutup} footer={<button className="bmp-secondary" onClick={onTutup}>Tutup</button>}>
        {error ? <div className="bmp-empty" role="alert"><p>{error}</p><button className="bmp-link" onClick={() => setVersi((n) => n + 1)}>Coba lagi</button></div>
            : <p className="bmp-empty" role="status">Memuat detail transaksi…</p>}
    </DialogKasir>;
}

export default function RiwayatPenjualan({ admin = false }: { admin?: boolean }) {
    const [draft, setDraft] = useState<FilterTransaksi>(filterKosong);
    const [filter, setFilter] = useState<FilterTransaksi>(filterKosong);
    const [page, setPage] = useState(1);
    const [versi, setVersi] = useState(0);
    const [data, setData] = useState<DaftarTransaksi | null>(null);
    const [kasir, setKasir] = useState<DaftarTransaksi['kasir']>([]);
    const [memuat, setMemuat] = useState(true);
    const [error, setError] = useState('');
    const [errorFilter, setErrorFilter] = useState('');
    const [dipilih, setDipilih] = useState<number | null>(null);
    const adaFilter = Object.values(filter).some(Boolean);
    const hariIni = tanggalWib();
    const awalBulan = hariIni.slice(0, 7) + '-01';

    useEffect(() => {
        const controller = new AbortController();
        setMemuat(true);
        setError('');
        ambilTransaksi(filter, page, controller.signal).then((hasil) => {
            if (controller.signal.aborted) return;
            if (page > hasil.meta.last_page) {
                setPage(hasil.meta.last_page);
                return;
            }
            setData(hasil);
            setKasir(hasil.kasir);
            setMemuat(false);
        }).catch((err) => {
            if (controller.signal.aborted) return;
            setData(null);
            setMemuat(false);
            setError(pesanTransaksi(err));
        });
        return () => controller.abort();
    }, [filter, page, versi]);

    function terapkan(next: FilterTransaksi) {
        if (next.tanggal_mulai && next.tanggal_selesai && next.tanggal_mulai > next.tanggal_selesai) {
            setErrorFilter('Tanggal akhir harus sama atau sesudah tanggal awal.');
            return;
        }
        setErrorFilter('');
        setDraft(next);
        setFilter({ ...next, cari: next.cari.trim(), kasir_id: admin ? next.kasir_id : '' });
        setPage(1);
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        terapkan(draft);
    }
    function periode(mulai: string, selesai: string) {
        terapkan({ ...draft, tanggal_mulai: mulai, tanggal_selesai: selesai });
    }
    function field(key: keyof FilterTransaksi, value: string) {
        setDraft((lama) => ({ ...lama, [key]: value }));
        setErrorFilter('');
    }
    const ringkasan = !memuat && !error ? data?.ringkasan : null;

    return <section className="bmp-page bmp-riwayat bmp-laporan">
        <div className="bmp-page-heading">
            <div><h1>{admin ? 'Laporan' : 'Riwayat Transaksi'}</h1><p className="bmp-report-intro">{admin ? 'Pantau penjualan dan transaksi dari seluruh kasir.' : 'Lihat kembali transaksi yang kamu layani.'}</p></div>
            <button type="button" className="bmp-secondary" disabled={memuat} onClick={() => setVersi((n) => n + 1)}><Icon name="ulang" size={17} />Muat ulang</button>
        </div>

        <div className="bmp-report-stats" aria-label="Ringkasan sesuai filter">
            <article className="bmp-panel bmp-report-stat"><span className="bmp-report-stat-icon"><Icon name="laporan" size={23} /></span><div><p>Total penjualan</p><strong>{ringkasan ? rupiah(ringkasan.total_penjualan) : '—'}</strong><small>Sesuai filter yang diterapkan</small></div></article>
            <article className="bmp-panel bmp-report-stat"><span className="bmp-report-stat-icon"><Icon name="struk" size={23} /></span><div><p>Jumlah transaksi</p><strong>{ringkasan ? ringkasan.jumlah_transaksi.toLocaleString('id-ID') : '—'}</strong><small>Transaksi berhasil</small></div></article>
            <article className="bmp-panel bmp-report-stat"><span className="bmp-report-stat-icon"><Icon name="barang" size={23} /></span><div><p>Barang terjual</p><strong>{ringkasan ? ringkasan.jumlah_item.toLocaleString('id-ID') : '—'}</strong><small>Total kuantitas barang</small></div></article>
        </div>

        <section className="bmp-panel bmp-report-filter" aria-labelledby="judul-filter">
            <div className="bmp-report-filter-heading"><h2 id="judul-filter">Filter transaksi</h2><span>Waktu Indonesia Barat (WIB)</span></div>
            <form onSubmit={submit}>
                <div className={'bmp-report-fields' + (admin ? ' has-cashier' : '')}>
                    <label className="bmp-report-field bmp-report-search"><span>Nomor transaksi</span><div className="bmp-search"><Icon name="cari" size={18} /><input type="search" maxLength={100} value={draft.cari} placeholder="Cari nomor transaksi…" onChange={(e) => field('cari', e.target.value)} /></div></label>
                    {admin && <label className="bmp-report-field"><span>Kasir</span><select value={draft.kasir_id} onChange={(e) => field('kasir_id', e.target.value)}><option value="">Semua kasir</option>{kasir.map((k) => <option key={k.id} value={k.id}>{k.username}</option>)}</select></label>}
                    <label className="bmp-report-field"><span>Tanggal awal</span><input type="date" value={draft.tanggal_mulai} max={draft.tanggal_selesai || undefined} onChange={(e) => field('tanggal_mulai', e.target.value)} /></label>
                    <label className="bmp-report-field"><span>Tanggal akhir</span><input type="date" value={draft.tanggal_selesai} min={draft.tanggal_mulai || undefined} onChange={(e) => field('tanggal_selesai', e.target.value)} /></label>
                </div>
                <div className="bmp-report-filter-footer">
                    <div className="bmp-chips" role="group" aria-label="Periode cepat">
                        <button type="button" aria-pressed={!filter.tanggal_mulai && !filter.tanggal_selesai} onClick={() => periode('', '')}>Semua waktu</button>
                        <button type="button" aria-pressed={filter.tanggal_mulai === hariIni && filter.tanggal_selesai === hariIni} onClick={() => periode(hariIni, hariIni)}>Hari ini</button>
                        <button type="button" aria-pressed={filter.tanggal_mulai === awalBulan && filter.tanggal_selesai === hariIni} onClick={() => periode(awalBulan, hariIni)}>Bulan ini</button>
                    </div>
                    <div className="bmp-report-actions"><button type="button" className="bmp-secondary" onClick={() => terapkan(filterKosong)}>Reset</button><button className="bmp-primary" type="submit">Terapkan filter</button></div>
                </div>
                {errorFilter && <p className="bmp-error-text" role="alert">{errorFilter}</p>}
            </form>
        </section>

        <section className="bmp-panel bmp-report-list" aria-labelledby="judul-transaksi" aria-busy={memuat}>
            <div className="bmp-panel-heading"><div><h2 id="judul-transaksi">{admin ? 'Daftar transaksi' : 'Transaksi saya'}</h2><p>{adaFilter ? 'Hasil sesuai pencarian dan filter yang diterapkan.' : 'Semua transaksi, diurutkan dari yang terbaru.'}</p></div><span className="bmp-count">{!memuat && data ? data.meta.total.toLocaleString('id-ID') + ' transaksi' : '—'}</span></div>
            {memuat ? <div className="bmp-empty bmp-report-empty" role="status"><span className="bmp-report-spinner" />Memuat transaksi…</div>
                : error ? <div className="bmp-empty bmp-report-empty" role="alert"><Icon name="ulang" size={28} /><strong>Riwayat belum dapat dimuat</strong><p>{error}</p><button className="bmp-secondary" onClick={() => setVersi((n) => n + 1)}>Coba lagi</button></div>
                : !data?.data.length ? <div className="bmp-empty bmp-report-empty"><span className="bmp-empty-icon"><Icon name={adaFilter ? 'cari' : 'struk'} size={25} /></span><strong>{adaFilter ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}</strong><p>{adaFilter ? 'Coba ubah kata pencarian atau rentang tanggal.' : 'Transaksi akan muncul setelah pembayaran di kasir berhasil.'}</p>{adaFilter ? <button className="bmp-secondary" onClick={() => terapkan(filterKosong)}>Reset filter</button> : !admin && <a className="bmp-secondary" href="#kasir">Buka kasir</a>}</div>
                : <>
                    <div className="bmp-report-table-wrap"><table className="bmp-report-table"><thead><tr><th scope="col">Nomor transaksi</th><th scope="col">Waktu (WIB)</th>{admin && <th scope="col">Kasir</th>}<th scope="col" className="is-number">Item</th><th scope="col" className="is-number">Total</th><th scope="col">Pembayaran</th><th scope="col"><span className="bmp-sr-only">Aksi</span></th></tr></thead>
                        <tbody>{data.data.map((t) => <tr key={t.id}>
                            <td className="bmp-report-invoice"><code>{t.invoice}</code></td>
                            <td><span className="bmp-mobile-label">Waktu</span><time dateTime={t.waktu}>{waktuTransaksi(t.waktu)}</time></td>
                            {admin && <td><span className="bmp-mobile-label">Kasir</span><span>{t.kasir.username}</span></td>}
                            <td className="is-number"><span className="bmp-mobile-label">Item</span><span>{t.jumlah_item.toLocaleString('id-ID')}</span></td>
                            <td className="is-number"><span className="bmp-mobile-label">Total</span><strong>{rupiah(t.total)}</strong></td>
                            <td><span className="bmp-mobile-label">Pembayaran</span><span className="bmp-report-paid">Tunai · Selesai</span></td>
                            <td className="bmp-report-detail"><button className="bmp-secondary" type="button" onClick={() => setDipilih(t.id)} aria-label={'Lihat detail ' + t.invoice}><Icon name="struk" size={15} />Detail</button></td>
                        </tr>)}</tbody>
                    </table></div>
                    <footer className="bmp-report-pagination"><p>Menampilkan {data.meta.from}–{data.meta.to} dari {data.meta.total} transaksi</p><div><button className="bmp-secondary" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>Sebelumnya</button><span aria-live="polite">{page} / {data.meta.last_page}</span><button className="bmp-secondary" disabled={page >= data.meta.last_page} onClick={() => setPage((n) => n + 1)}>Berikutnya</button></div></footer>
                </>}
        </section>
        {dipilih !== null && <DetailTransaksi key={dipilih} id={dipilih} onTutup={() => setDipilih(null)} />}
    </section>;
}
