type Role = 'admin' | 'user';

interface DashboardProps {
    name: string;
    role: Role;
}

export default function Dashboard({ name, role }: DashboardProps) {
    return (
        <section className="bmp-page">
            <h1>Dashboard</h1>
            <div className="bmp-panel">
                <h2 style={{ margin: '0 0 10px', color: '#091580', fontSize: 20 }}>
                    Selamat datang, {name}!
                </h2>
                <p>Anda masuk sebagai {role === 'admin' ? 'Admin' : 'Kasir'} Bintang Mulia Packaging.</p>
                <p>Silakan pilih menu pada sidebar untuk mulai bekerja.</p>
            </div>
        </section>
    );
}
