import Icon from '../../components/Icon';

export default function ManajemenBarang() {
    return <section className="bmp-page">
        <div className="bmp-page-heading"><h1>Manajemen Barang</h1></div>
        <div className="bmp-panel bmp-history-empty">
            <span className="bmp-empty-icon"><Icon name="barang" /></span>
            <div><strong>Form pengelolaan barang belum tersedia.</strong><p>Di katalog kasir, hanya barang aktif dengan SKU aktif dan harga yang sudah diisi yang akan tampil.</p></div>
        </div>
    </section>;
}
