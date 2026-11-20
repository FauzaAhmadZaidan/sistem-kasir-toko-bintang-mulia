import { useState } from 'react';
import Icon from '../../components/Icon';
import { jumlahItem, rupiah, type StrukSimulasi } from '../../pos/kasir';
import { DialogStruk } from '../Cashier/PembayaranKasir';

export function DaftarStruk({ struk }: { struk: StrukSimulasi[] }) {
    const [dipilih, setDipilih] = useState<StrukSimulasi | null>(null);
    if (!struk.length) return <div className="bmp-history-empty">
        <span className="bmp-empty-icon"><Icon name="struk" size={22} /></span>
        <div><strong>Belum ada struk simulasi</strong><p>Struk muncul setelah pembayaran simulasi selesai.</p></div>
    </div>;

    return <>
        <ul className="bmp-history">{struk.map((s) => <li key={s.nomor}>
            <button type="button" onClick={() => setDipilih(s)} aria-label={'Lihat struk ' + s.nomor}>
                <span className="bmp-history-icon"><Icon name="struk" size={18} /></span>
                <span className="bmp-history-id"><b>{s.nomor}</b><small>
                    <time dateTime={s.waktu}>{new Date(s.waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</time> · {jumlahItem(s.items)} item
                </small></span>
                <strong>{rupiah(s.total)}</strong><Icon name="kanan" size={15} />
            </button>
        </li>)}</ul>
        {dipilih && <DialogStruk struk={dipilih} onTutup={() => setDipilih(null)} />}
    </>;
}

export default function RiwayatTransaksi({ struk }: { struk: StrukSimulasi[] }) {
    return <section className="bmp-page">
        <div className="bmp-page-heading"><h1>Riwayat Transaksi</h1></div>
        <section className="bmp-panel">
            <div className="bmp-panel-heading"><div><h2>Struk simulasi</h2><p>Riwayat sesi ini akan kosong saat halaman dimuat ulang.</p></div><span className="bmp-count">{struk.length} struk</span></div>
            <DaftarStruk struk={struk} />
        </section>
    </section>;
}
