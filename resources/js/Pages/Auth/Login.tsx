import type { SubmitEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';

type LoginData = {
    username: string;
    password: string;
};

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm<LoginData>({
        username: '',
        password: '',
    });

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        post('/login', {
            onFinish: () => reset('password'),
        });
    }

    return (
        <>
            <Head title="Login - Toko Bintang Mulia Packaging" />

            <main className="login-page">
                <section className="login-card" aria-labelledby="login-title">
                    <header className="login-brand">
                        <h1 id="login-title">TOKO</h1>
                        <p>BINTANG MULIA</p>
                        <span>PACKAGING</span>
                    </header>

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <div className="login-fields">
                            <div className="login-field">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    autoFocus
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    aria-invalid={Boolean(errors.username)}
                                    aria-describedby={errors.username ? 'username-error' : undefined}
                                    required
                                />
                                {errors.username && (
                                    <p className="login-error" id="username-error" role="alert">
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            <div className="login-field">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                    required
                                />
                                {errors.password && (
                                    <p className="login-error" id="password-error" role="alert">
                                        {errors.username}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button className="login-button" type="submit" disabled={processing}>
                            {processing ? 'MEMPROSES...' : 'LOGIN'}
                        </button>
                    </form>
                </section>
            </main>

            <style>{`
                .login-page,
                .login-page * {
                    box-sizing: border-box;
                }

                .login-page {
                    min-height: 100vh;
                    min-height: 100dvh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px 16px;
                    background: linear-gradient(135deg, #2e41df 0%, #101e9f 35%, #000762 100%);
                    font-family: Arial, Helvetica, sans-serif;
                }

                .login-card {
                    width: 75%;
                    max-width: 450px;
                    height: 100%;
                    min-height: 390px;
                    display: flex;
                    flex-direction: column;
                    padding: 40px 49px 41px;
                    border-radius: 29px;
                    background: #ffffff;
                    color: #000a69;
                }

                .login-brand {
                    text-align: center;
                    flex-shrink: 0;
                }

                .login-brand h1,
                .login-brand p {
                    margin: 0;
                    font-weight: 800;
                }

                .login-brand h1 {
                    font-size: 20px;
                    line-height: 22px;
                }

                .login-brand p {
                    font-size: 14px;
                    line-height: 16px;
                }

                .login-brand span {
                    display: block;
                    font-size: 12px;
                    line-height: 14px;
                    font-weight: 700;
                }

                .login-form {
                    flex: 1;
                    min-height: 0;
                    display: flex;
                    flex-direction: column;
                    margin-top: 23px;
                }

                .login-field + .login-field {
                    margin-top: 17px;
                }

                .login-field label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 10px;
                    line-height: 13px;
                    font-weight: 400;
                }

                .login-field input {
                    display: block;
                    width: 100%;
                    height: 30px;
                    padding: 5px 9px;
                    border: 1px solid #8e9cff;
                    border-radius: 6px;
                    outline: none;
                    background: #ffffff;
                    color: #091273;
                    font: inherit;
                    font-size: 12px;
                    transition: border-color 150ms ease, box-shadow 150ms ease;
                }

                .login-field input:focus {
                    border-color: #343ab9;
                    box-shadow: 0 0 0 2px rgba(52, 58, 185, 0.13);
                }

                .login-field input[aria-invalid='true'] {
                    border-color: #c83b51;
                }

                .login-error {
                    margin: 5px 0 0;
                    color: #c02742;
                    font-size: 10px;
                    line-height: 1.4;
                }

                .login-button {
                    display: block;
                    width: 204px;
                    max-width: 100%;
                    min-height: 38px;
                    align-self: center;
                    margin-top: auto;
                    padding: 10px;
                    border: none;
                    border-radius: 9px;
                    background: #3035a9;
                    color: white;
                    font: inherit;
                    font-size: 12px;
                    font-weight: 400;
                    cursor: pointer;
                    transition: background-color 150ms ease, transform 150ms ease;
                }

                .login-button:hover:not(:disabled) {
                    background: #22268f;
                }

                .login-button:active:not(:disabled) {
                    transform: translateY(1px);
                }

                .login-button:focus-visible {
                    outline: 3px solid #91a4ff;
                    outline-offset: 3px;
                }

                .login-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                @media (max-width: 380px) {
                    .login-card {
                        padding-right: 30px;
                        padding-left: 30px;
                    }
                }
            `}</style>
        </>
    );
}
