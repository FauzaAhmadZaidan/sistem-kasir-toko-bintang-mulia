import { Head, Link } from '@inertiajs/react';

type Props = {
    user: {
        id: number;
        username: string;
        role: 'admin' | 'user';
    };
};

export default function Dashboard({ user }:Props) {
    const judul = user.role === 'admin'
        ? 'Dashboard Admin'
        : 'Dashboard User';

    return (
        <>
            <Head title={judul} />

            <main className='min-h-screen bg-slate-100 p-6'>
                <section className='mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm'>
                    <h1 className='text-2xl font-bold text-slate-900'>
                        {judul}
                    </h1>

                    <p className='mt-4 text-slate-700'>
                        Selamat datang, {user.username}.
                    </p>

                    <p className='mt-2 text-slate-700'>
                        Kamu berhasil login sebagai {user.role}
                    </p>

                    <Link
                        href='/logout'
                        method='post'
                        as='button'
                        className='mt-6 rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800'//AAAA
                    >
                        Keluar
                    </Link>
                </section>
            </main>
        </>
    );
}
