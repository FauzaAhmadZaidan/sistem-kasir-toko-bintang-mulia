import { Head, useForm } from '@inertiajs/react';
import type { ChangeEvent } from 'react';


type LoginFrom = {
    username: string;
    password: string;
};

export default function Login(){
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm<LoginFrom>({
        username: '',
        password: '',
    });

    function submit(event: ChangeEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    }

    return (
        <>
            <Head title="Login" />

            <main className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
                <section className='w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm'>
                    <h1 className='text-2xl font-bold text-slate-900'>
                        Toko Bintang Mulia
                    </h1>

                    <p className='mt-2 text-slate-700'>
                        Masuk menggunakan akun yang sudah terdaftar.
                    </p>

                    <form onSubmit={submit} className='mt-6 space-y-5'>
                        <div>
                            <label
                                htmlFor='username'
                                className='block text-sm font-medium text-slate-700'//AAA
                            >
                                Username
                            </label>

                            <input
                                id='username'
                                name='username'
                                type='text'
                                autoComplete='username'
                                autoFocus
                                required
                                value={data.username}
                                onChange={(event) =>
                                    setData('username', event.target.value)}
                                aria-invalid={Boolean(errors.username)}
                                aria-describedby={
                                    errors.username
                                        ? 'username-error'
                                        : undefined
                                }
                                className='mt-2 block w-full rounded-lg border border-slate-300
                                px-3 py-2 focus:border-indigo-600 focus:outline-none
                                focus:ring-2 focus:ring-indigo-400'//AAA
                            />

                            {errors.username && (
                                <p
                                    id='username-error'
                                    role='alert'
                                    className='mt-2 text-sm text-red-600'
                                >
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor='password'
                                className='block text-sm font-medium text-slate-700'//AAA
                            >
                                Password
                            </label>

                            <input
                                id='password'
                                name='password'
                                type='password'
                                autoComplete='current-password'
                                required
                                value={data.password}
                                onChange={(event) =>
                                    setData('password', event.target.value)}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={
                                    errors.password
                                        ? 'password-error'
                                        : undefined
                                }
                                className='mt-2 w-full rounded-lg border border-slate-300
                                px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200'
                            />

                            {errors.password && (
                                <p
                                    id='password-error'
                                    role='alert'
                                    className='mt-2 text-sm text-red-600'
                                >
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type='submit'
                            disabled={processing}
                            className='w-full rounded-lg bg-blue-700 px-4 py-3 font-medium
                            text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            {processing ? 'Memuat...' : 'Masuk'}
                        </button>
                    </form>
                </section>
            </main>
        </>
    )
}
