const paths = {
    menu: 'M3 6h18M3 12h18M3 18h18',
    dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    kasir: 'M4 9h16l1 11H3L4 9ZM8 9V7a4 4 0 0 1 8 0v2',
    struk: 'M5 3l2 1.5L9.5 3 12 4.5 14.5 3 17 4.5 19 3v18l-2-1.5-2.5 1.5-2.5-1.5L9.5 21 7 19.5 5 21V3Zm4 5h6m-6 4h6m-6 4h3',
    barang: 'm3 7 9-4.5L21 7v10l-9 4.5L3 17V7Zm0 0 9 4.5L21 7m-9 4.5v10m-4.5-17 9 4.5',
    user: 'M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM5 21v-2a7 7 0 0 1 14 0v2',
    laporan: 'M4 3v17h17M8 15v-4m5 4V6m5 9V9',
    keluar: 'M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5m5-12 4 4-4 4m-6-4h10',
    tanggal: 'M4 6h16v15H4zM8 3v5m8-5v5M4 11h16',
    panah: 'M4 12h15m-6-6 6 6-6 6',
    kanan: 'm9 5 7 7-7 7',
    cari: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-2 4 6 6',
    tambah: 'M12 5v14M5 12h14',
    kurang: 'M5 12h14',
    tutup: 'm6 6 12 12M18 6 6 18',
    ulang: 'M20 6v5h-5M4 18v-5h5m10.5-2a7.5 7.5 0 0 0-13-4.5m-2 7A7.5 7.5 0 0 0 17.5 18',
    cetak: 'M7 8V3h10v5m-10 9H4V9h16v8h-3M7 14h10v7H7z',
    hapus: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14m-8 4v6m4-6v6',
    jam: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
} as const;

export type IconName = keyof typeof paths;

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true" focusable="false">
            <path d={paths[name]} />
        </svg>
    );
}
