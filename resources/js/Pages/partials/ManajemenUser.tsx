import Icon from '../../components/Icon';

export default function ManajemenUser() {
    return <section className="bmp-page">
        <div className="bmp-page-heading"><h1>Manajemen User</h1></div>
        <div className="bmp-panel bmp-history-empty">
            <span className="bmp-empty-icon"><Icon name="user" /></span>
            <div><strong>Form pengelolaan pengguna belum tersedia.</strong><p>Akun admin dan kasir memiliki menu kerja masing-masing.</p></div>
        </div>
    </section>;
}
