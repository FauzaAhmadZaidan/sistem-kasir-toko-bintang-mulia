import { Head, router, usePage } from '@inertiajs/react';
import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import Icon, { type IconName } from '../components/Icon';
import { useSesiKasir, type SesiKasir } from '../pos/kasir';
import '../../css/workspace.css';

type Role = 'admin' | 'user';
type AuthUser = { id: number; username: string; role: Role };
type MainProps = { auth?: { user: AuthUser | null } } & Record<string, unknown>;
type MenuKey = 'dashboard' | 'manajemen-barang' | 'manajemen-user' | 'laporan' | 'kasir' | 'riwayat-transaksi';
type NavItem = { key: MenuKey; label: string; icon: IconName };

const ROLE_MENUS: Record<Role, NavItem[]> = {
    admin: [
        { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { key: 'manajemen-barang', label: 'Manajemen Barang', icon: 'barang' },
        { key: 'manajemen-user', label: 'Manajemen User', icon: 'user' },
        { key: 'laporan', label: 'Laporan', icon: 'laporan' },
    ],
    user: [
        { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { key: 'kasir', label: 'Kasir / Penjualan', icon: 'kasir' },
        { key: 'riwayat-transaksi', label: 'Riwayat Transaksi', icon: 'struk' },
    ],
};

const Dashboard = lazy(() => import('./partials/Dashboard'));
const ManajemenBarang = lazy(() => import('./partials/ManajemenBarang'));
const ManajemenUser = lazy(() => import('./partials/ManajemenUser'));
const Laporan = lazy(() => import('./partials/Laporan'));
const Kasir = lazy(() => import('./partials/Kasir'));
const RiwayatTransaksi = lazy(() => import('./partials/RiwayatTransaksi'));

const desktop = '(min-width: 901px)';
function menuDariUrl(items: NavItem[]) {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    return (items.find((item) => item.key === hash) ?? items[0]);
}

const WorkspaceContext = createContext<{ menu: MenuKey; user: AuthUser; sesi: SesiKasir } | null>(null);

function Workspace({ user, children }: PropsWithChildren<{ user: AuthUser }>) {
    const items = ROLE_MENUS[user.role];
    const [selected, setSelected] = useState(() => menuDariUrl(items));
    const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia(desktop).matches);
    const [isDesktop, setIsDesktop] = useState(sidebarOpen);
    const sesi = useSesiKasir();
    const content = useRef<HTMLElement>(null);
    const toggle = useRef<HTMLButtonElement>(null);
    const roleLabel = user.role === 'admin' ? 'Admin' : 'Kasir';

    useEffect(() => {
        const media = window.matchMedia(desktop);
        const resize = () => {
            setIsDesktop(media.matches);
            setSidebarOpen(media.matches);
        };
        const navigate = () => {
            setSelected(menuDariUrl(items));
            if (!media.matches) setSidebarOpen(false);
            content.current?.focus({ preventScroll: true });
            content.current?.scrollTo(0, 0);
        };
        media.addEventListener('change', resize);
        window.addEventListener('hashchange', navigate);
        return () => {
            media.removeEventListener('change', resize);
            window.removeEventListener('hashchange', navigate);
        };
    }, [items]);

    function closeMenu() {
        setSidebarOpen(false);
        toggle.current?.focus();
    }

    return (
        <div className="bmp-app" onKeyDown={(e) => {
            if (e.key === 'Escape' && sidebarOpen && !isDesktop) closeMenu();
        }}>
            <Head title={selected.label + ' · Bintang Mulia Packaging'} />
            <header className="bmp-header">
                <button ref={toggle} className="bmp-icon-button" type="button" aria-controls="bmp-sidebar"
                    aria-expanded={sidebarOpen} aria-label={sidebarOpen ? 'Tutup menu' : 'Buka menu'}
                    onClick={() => setSidebarOpen(!sidebarOpen)}><Icon name="menu" /></button>
                <a className="bmp-brand" href="#dashboard" aria-label="Bintang Mulia Packaging, dashboard">
                    <span className="bmp-brand-mark"><Icon name="barang" size={23} /></span>
                    <span>Bintang Mulia<small>Packaging</small></span>
                </a>
                <button className="bmp-logout" type="button" onClick={() => router.post('/logout')}>
                    <Icon name="keluar" size={18} /> Keluar
                </button>
            </header>
            <div className="bmp-body">
                {!isDesktop && sidebarOpen && <button className="bmp-scrim" type="button" tabIndex={-1} aria-label="Tutup navigasi" onClick={closeMenu} />}
                <aside id="bmp-sidebar" className="bmp-sidebar" hidden={!sidebarOpen}>
                    <nav aria-label="Menu utama">
                        <p className="bmp-nav-title">Ruang {roleLabel.toLowerCase()}</p>
                        {items.map((item) => (
                            <a key={item.key} href={'#' + item.key} className="bmp-nav-link"
                                aria-current={selected.key === item.key ? 'page' : undefined}
                                onClick={() => { if (!isDesktop) setSidebarOpen(false); }}>
                                <Icon name={item.icon} size={18} /><span>{item.label}</span>
                            </a>
                        ))}
                    </nav>
                    <div className="bmp-profile">
                        <span className="bmp-initial" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
                        <div><strong>{user.username}</strong><small>{roleLabel}</small></div>
                    </div>
                </aside>
                <main ref={content} className="bmp-content" tabIndex={-1} inert={!isDesktop && sidebarOpen}>
                    <WorkspaceContext.Provider value={{ menu: selected.key, user, sesi }}>
                        {children}
                    </WorkspaceContext.Provider>
                </main>
            </div>
        </div>
    );
}

function WorkspaceLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<MainProps>().props;
    const user = auth?.user;
    if (!user || (user.role !== 'admin' && user.role !== 'user')) {
        return <main className="bmp-page" role="alert"><h1>Akses tidak tersedia</h1><a href="/login">Kembali ke login</a></main>;
    }
    return <Workspace key={user.id} user={user}>{children}</Workspace>;
}

export default function Main() {
    const workspace = useContext(WorkspaceContext);
    if (!workspace) return null;
    const { menu, user, sesi } = workspace;
    return <Suspense fallback={<p role="status" className="bmp-page">Memuat halaman…</p>}>
        {menu === 'dashboard' && <Dashboard username={user.username} role={user.role} sesi={sesi} />}
        {menu === 'kasir' && <Kasir sesi={sesi} />}
        {menu === 'riwayat-transaksi' && <RiwayatTransaksi struk={sesi.riwayat} />}
        {menu === 'manajemen-barang' && <ManajemenBarang />}
        {menu === 'manajemen-user' && <ManajemenUser />}
        {menu === 'laporan' && <Laporan />}
    </Suspense>;
}

// Inertia dapat memasang ulang page saat tombol Kembali ditekan. Layout menyimpan draf kasir.
Main.layout = WorkspaceLayout;
