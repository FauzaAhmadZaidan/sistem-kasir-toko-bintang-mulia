import Icon, { type IconName } from '../../components/Icon';
import { jumlahItem, rupiah, type SesiKasir } from '../../pos/kasir';
import kemasan from '../../../images/kemasan.webp';
import { DaftarStruk } from './RiwayatTransaksi';

type Props = { username: string; role: 'admin' | 'user'; sesi: SesiKasir };
const menuAdmin: { href: string; judul: string; icon: IconName }[] = [
    { href: '#manajemen-barang', judul: 'Manajemen Barang', icon: 'barang' },
    { href: '#manajemen-user', judul: 'Manajemen User', icon: 'user' },
    { href: '#laporan', judul: 'Laporan', icon: 'laporan' },
];

export default function Dashboard({ username, role, sesi }: Props) {
    const admin = role === 'admin';
    const jumlah = jumlahItem(sesi.keranjang);
    const tanggal = new Date();
    return <section className="bmp-page">
        <div className="bmp-page-heading"><h1>Dashboard</h1>
            <span className="bmp-date"><Icon name="tanggal" size={16} /><time>{tanggal.toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}</time></span>
        </div>
        <section className="bmp-welcome">
            <div className="bmp-welcome-copy">
                <h2>Selamat datang,<br /><strong>{username}.</strong></h2>
                <p>{admin ? 'Kelola barang, pengguna, dan laporan toko.' : jumlah ? 'Keranjangmu masih berisi ' + jumlah + ' item.' : 'Buka kasir untuk memulai transaksi.'}</p>
                <a className="bmp-primary" href={admin ? '#manajemen-barang' : '#kasir'}>
                    {admin ? 'Buka manajemen barang' : jumlah ? 'Lanjutkan transaksi' : 'Buka kasir'}<Icon name="panah" size={17} />
                </a>
            </div>
            <div className="bmp-welcome-photo"><img src={kemasan} alt="" width={940} height={627} /></div>
        </section>
        {admin ? <section className="bmp-dashboard-section">
            <h2>Menu admin</h2>
            <div className="bmp-admin-links">{menuAdmin.map((menu) => <a key={menu.href} href={menu.href}>
                <Icon name={menu.icon} /><strong>{menu.judul}</strong><Icon name="kanan" size={16} />
            </a>)}</div>
        </section> : <>
            <section className="bmp-dashboard-section"><div className="bmp-section-heading"><h2>Ringkasan sesi</h2><span className="bmp-session-label">Simulasi</span></div>
                <dl className="bmp-metrics">
                    <div><dt>Transaksi selesai</dt><dd>{sesi.riwayat.length}</dd></div>
                    <div><dt>Total simulasi</dt><dd>{rupiah(sesi.riwayat.reduce((n, s) => n + s.total, 0))}</dd></div>
                    <div><dt>Item di keranjang</dt><dd>{jumlah}</dd></div>
                </dl>
            </section>
            <section className="bmp-dashboard-section">
                <div className="bmp-section-heading"><h2>Struk terbaru</h2><a className="bmp-link" href="#riwayat-transaksi">Lihat riwayat <Icon name="panah" size={15} /></a></div>
                <div className="bmp-panel"><DaftarStruk struk={sesi.riwayat.slice(0, 3)} /></div>
            </section>
        </>}
    </section>;
}
