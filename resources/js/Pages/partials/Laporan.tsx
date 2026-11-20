import Icon from '../../components/Icon';

export default function Laporan() {
    return <section className="bmp-page">
        <div className="bmp-page-heading"><h1>Laporan</h1></div>
        <div className="bmp-panel bmp-history-empty">
            <span className="bmp-empty-icon"><Icon name="laporan" /></span>
            <div><strong>Laporan penjualan belum tersedia.</strong><p>Simulasi pembayaran kasir tidak masuk ke laporan penjualan.</p></div>
        </div>
    </section>;
}
