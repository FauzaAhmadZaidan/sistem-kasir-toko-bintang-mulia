import { Head, router, usePage } from '@inertiajs/react';
import { lazy, Suspense, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

// Nama role sesuai isi kolom users.role di Laravel.
type Role = 'admin' | 'user'; // 'user' berarti kasir

type MenuKey =
    | 'dashboard'
    | 'manajemen-barang'
    | 'manajemen-user'
    | 'laporan'
    | 'kasir'
    | 'riwayat-transaksi'
    | 'testing'
    ;

type IconName = 'menu' | 'logout' | 'home' | 'document' | 'users' | 'box' | 'chart' | 'cart' | 'test';

interface AuthUser {
    id: number;
    name: string;
    role: string; // Diperiksa dulu sebelum dianggap sebagai Role.
}

type MainPageProps = {
    auth?: {
        user: AuthUser | null;
    };
} & Record<string, unknown>;

interface NavItem {
    key: MenuKey;
    label: string;
    icon: IconName;
}

// Contoh menu. Ubah sesuai kebutuhan nyata proyek.
const ROLE_MENUS: Record<Role, NavItem[]> = {
    admin: [
        { key: 'dashboard', label: 'Dashboard', icon: 'home' },
        { key: 'manajemen-barang', label: 'Manajemen Barang', icon: 'box' },
        { key: 'manajemen-user', label: 'Manajemen User', icon: 'users' },
        { key: 'laporan', label: 'Laporan', icon: 'chart' },
        { key: 'testing', label: 'testing', icon: 'test'}
    ],
    user: [
        { key: 'dashboard', label: 'Dashboard', icon: 'home' },
        { key: 'kasir', label: 'Kasir / Penjualan', icon: 'cart' },
        { key: 'riwayat-transaksi', label: 'Riwayat Transaksi', icon: 'document' },
    ],
};

// Komponen menu hanya diimpor saat dibuka, bukan berpindah halaman Inertia.
// Jangan gunakan akhiran .tsx pada import path.
const Dashboard = lazy(() => import('./partials/Dashboard'));
const ManajemenBarang = lazy(() => import('./partials/ManajemenBarang'));
const ManajemenUser = lazy(() => import('./partials/ManajemenUser'));
const Laporan = lazy(() => import('./partials/Laporan'));
const Kasir = lazy(() => import('./partials/Kasir'));
const RiwayatTransaksi = lazy(() => import('./partials/RiwayatTransaksi'));

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
    const props = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': true as const,
        focusable: false as const,
    };

    if (name === 'menu') {
        return (
            <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M3 6.5h18M3 12h18M3 17.5h18" />
            </svg>
        );
    }
    if (name === 'logout') {
        return (
            <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 4H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h4" />
                <path d="M13 8l4 4-4 4M8 12h9" />
            </svg>
        );
    }
    if (name === 'home') {
        return (
            <svg {...props} fill="currentColor">
                <path d="M12 2.8 2.4 11a1.1 1.1 0 0 0 1.4 1.7L5 11.7V20a1 1 0 0 0 1 1h4.5v-6h3V21H18a1 1 0 0 0 1-1v-8.3l1.2 1a1.1 1.1 0 1 0 1.4-1.7L12 2.8Z" />
            </svg>
        );
    }
    if (name === 'document') {
        return (
            <svg {...props} fill="currentColor">
                <path d="M5 2h9l5 5v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm8 1.8V8h4.2L13 3.8Z" />
            </svg>
        );
    }
    if (name === 'box') {
        return (
            <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10" />
            </svg>
        );
    }
    if (name === 'users') {
        return (
            <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" />
            </svg>
        );
    }
    if (name === 'chart') {
        return (
            <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 3v18h17M8 16v-5M13 16V6M18 16V9" />
            </svg>
        );
    }
    return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4h2l2.3 11h11.5l2-8H6M9 19h.01M18 19h.01" />
        </svg>
    );
}

function PageContent({ selectedMenu, user }: { selectedMenu: MenuKey; user: AuthUser }) {
    let component: ReactNode;
    switch (selectedMenu) {
        case 'dashboard':
            component = <Dashboard name={user.name} role={user.role as Role} />;
            break;
        case 'manajemen-barang':
            component = <ManajemenBarang />;
            break;
        case 'manajemen-user':
            component = <ManajemenUser />;
            break;
        case 'laporan':
            component = <Laporan />;
            break;
        case 'kasir':
            component = <Kasir />;
            break;
        case 'riwayat-transaksi':
            component = <RiwayatTransaksi />;
            break;
    }
    return <Suspense fallback={<p className="bmp-loading">Memuat konten...</p>}>{component}</Suspense>;
}

export default function Main() {
    const { props } = usePage<MainPageProps>();
    const user = props.auth?.user ?? null;
    const role: Role | null = user?.role === 'admin' || user?.role === 'user' ? user.role : null;
    const menuItems = role ? ROLE_MENUS[role] : [];

    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Halaman pertama bagi semua role adalah Dashboard.
    const [selectedMenu, setSelectedMenu] = useState<MenuKey>('dashboard');

    const selectMenu = (menu: MenuKey) => {
        if (!menuItems.some((item) => item.key === menu)) return;
        setSelectedMenu(menu);
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches) {
            setSidebarOpen(false);
        }
    };

    const logout = () => router.post('/logout');
    const canShow = user !== null && role !== null && menuItems.some((item) => item.key === selectedMenu);

    return (
        <>
            <Head title="Bintang Mulia Packaging" />
            <div className="bmp-app" style={{ '--bmp-sidebar-width': '206px' } as CSSProperties}>
                <header className="bmp-header">
                    <button
                        type="button"
                        className="bmp-icon-button bmp-menu-toggle"
                        aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
                        aria-controls="bmp-sidebar"
                        aria-expanded={sidebarOpen}
                        onClick={() => setSidebarOpen((current) => !current)}
                    >
                        <Icon name="menu" size={20} />
                    </button>
                    <div className="bmp-brand">
                        <span>BINTANG MULIA</span>
                        <small>PACKAGING</small>
                    </div>
                    <button
                        type="button"
                        className="bmp-icon-button bmp-logout"
                        onClick={logout}
                        aria-label="Logout"
                        title="Logout"
                    >
                        <Icon name="logout" size={23} />
                    </button>
                </header>

                <div className="bmp-body">
                    {sidebarOpen && (
                        <button
                            type="button"
                            className="bmp-mobile-backdrop"
                            aria-label="Tutup menu navigasi"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                    <aside
                        id="bmp-sidebar"
                        className={`bmp-sidebar${sidebarOpen ? ' bmp-sidebar-open' : ''}`}
                        aria-label="Menu utama"
                        aria-hidden={!sidebarOpen}
                    >
                        <nav className="bmp-navigation" aria-label="Navigasi halaman">
                            {menuItems.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    className={`bmp-nav-link${selectedMenu === item.key ? ' bmp-nav-link-active' : ''}`}
                                    aria-current={selectedMenu === item.key ? 'page' : undefined}
                                    tabIndex={sidebarOpen ? 0 : -1}
                                    onClick={() => selectMenu(item.key)}
                                >
                                    <Icon name={item.icon} size={16} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <main className="bmp-content" id="bmp-content">
                        {user && role && canShow ? (
                            <PageContent selectedMenu={selectedMenu} user={user} />
                        ) : (
                            <section className="bmp-page" role="alert">
                                <h1>Akses tidak tersedia</h1>
                                <div className="bmp-panel">
                                    <p>Data pengguna atau hak akses tidak tersedia. Silakan login kembali.</p>
                                </div>
                            </section>
                        )}
                    </main>
                </div>
            </div>
            <style>{styles}</style>
        </>
    );
}

const styles = `
    .bmp-app,
    .bmp-app * { box-sizing: border-box; }

    .bmp-app {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        min-width: 280px;
        min-height: 100dvh;
        background: #f2f4ff;
        color: #14205e;
        font-family: Arial, Helvetica, sans-serif;
        overflow: hidden;
    }

    .bmp-header {
        height: 70px;
        min-height: 70px;
        width: 100%;
        display: flex;
        align-items: flex-start;
        position: relative;
        z-index: 20;
        padding: 18px 19px;
        color: white;
        background: linear-gradient(180deg, #515de0 0%, #0c188d 39%, #000b7a 100%);
        border-bottom: 2px solid #1198ea;
    }

    .bmp-icon-button {
        border: 0;
        background: transparent;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        cursor: pointer;
        border-radius: 4px;
    }

    .bmp-icon-button:focus-visible,
    .bmp-nav-link:focus-visible {
        outline: 2px solid #83cbff;
        outline-offset: 3px;
    }

    .bmp-menu-toggle { width: 19px; height: 28px; margin-top: 2px; }
    .bmp-brand { margin-left: 16px; display: flex; flex-direction: column; line-height: 1.13; }
    .bmp-brand span { font-size: 14px; font-weight: 800; letter-spacing: -0.1px; }
    .bmp-brand small { margin-top: 2px; font-size: 12px; font-weight: 800; }
    .bmp-logout { margin-left: auto; margin-right: 6px; width: 28px; height: 28px; margin-top: 0; }

    .bmp-body { position: relative; display: flex; flex: 1; min-height: 0; overflow: hidden; }
    .bmp-sidebar {
        position: relative;
        z-index: 10;
        width: 0;
        flex: 0 0 0px;
        height: 100%;
        overflow: hidden;
        background: linear-gradient(156deg, #061075 0%, #101a88 39%, #26399d 100%);
        transition: width .2s ease, flex-basis .2s ease;
    }
    .bmp-sidebar-open { width: var(--bmp-sidebar-width); flex-basis: var(--bmp-sidebar-width); }
    .bmp-navigation {
        width: var(--bmp-sidebar-width);
        padding: 59px 13px 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .bmp-nav-link {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 23px;
        gap: 3px;
        padding: 2px 0;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: #fff;
        font-family: inherit;
        font-size: 12px;
        font-weight: 400;
        text-align: left;
        white-space: nowrap;
        cursor: pointer;
    }
    .bmp-nav-link svg { flex-shrink: 0; }
    .bmp-nav-link:hover { color: #e2eaff; }
    .bmp-nav-link-active { font-weight: 700; }

    .bmp-content {
        flex: 1;
        min-width: 0;
        height: 100%;
        overflow-y: auto;
        background: #f2f4ff;
    }
    .bmp-loading { margin: 28px; color: #36438d; font-size: 13px; }
    .bmp-page { padding: 26px; }
    .bmp-page h1 { margin: 0 0 18px; font-size: 22px; color: #091580; }
    .bmp-panel {
        padding: 20px;
        border-radius: 10px;
        background: #fff;
        border: 1px solid #e0e5fa;
        box-shadow: 0 2px 10px rgba(12, 24, 110, .035);
    }
    .bmp-panel p { margin: 0; font-size: 14px; line-height: 1.6; color: #546083; }
    .bmp-mobile-backdrop { display: none; }

    @media (max-width: 640px) {
        .bmp-header { padding-left: 16px; padding-right: 16px; }
        .bmp-sidebar {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            height: 100%;
            box-shadow: none;
        }
        .bmp-sidebar-open { box-shadow: 2px 0 14px rgba(0, 0, 60, .18); }
        .bmp-mobile-backdrop {
            display: block;
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            border: 0;
            background: rgba(5, 14, 60, .28);
            z-index: 9;
            cursor: pointer;
        }
        .bmp-page { padding: 18px; }
    }

    @media (prefers-reduced-motion: reduce) {
        .bmp-sidebar { transition: none; }
    }
`;
