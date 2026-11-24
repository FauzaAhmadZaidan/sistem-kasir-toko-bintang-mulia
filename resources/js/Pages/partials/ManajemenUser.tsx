import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, SVGProps } from 'react';

/**
 * Komponen ini adalah isi menu Manajemen User pada Main.tsx yang telah dibuat.
 * Tidak memakai router.visit() sehingga URL / halaman Inertia tidak berpindah.
 *
 * UBAH URL DI BAWAH jika endpoint backend Anda berbeda.
 * Contoh bawaan: routes/web.php, auth session, prefix /admin/users.
 */
const USERS_ENDPOINT = '/admin/users';

const http = axios.create({
    withCredentials: true,
    withXSRFToken: true,
    headers: { Accept: 'application/json' },
});

type Role = 'admin' | 'user';
type View = 'list' | 'edit' | 'create';
type Field = 'username' | 'password' | 'role' | 'status' | 'form';
type FieldErrors = Partial<Record<Field, string>>;
type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'unavailable';

interface UserRecord {
    id: number;
    username: string;
    role: Role;
    status: boolean;
}

interface UserResponse {
    data: UserRecord[];
}

interface ValidationErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function errorDetail(error: unknown): { message: string; fields: FieldErrors } {
    if (axios.isAxiosError<ValidationErrorResponse>(error)) {
        const status = error.response?.status;
        const details = error.response?.data;
        const fields: FieldErrors = {};
        if (details?.errors) {
            for (const key of ['username', 'password', 'role', 'status', 'form'] as Field[]) {
                if (details.errors[key]?.[0]) fields[key] = details.errors[key][0];
            }
        }
        if (status === 401 || status === 419) {
            return { message: 'Sesi login berakhir. Silakan login kembali.', fields };
        }
        if (status === 403) {
            return { message: 'Anda tidak memiliki izin mengelola pengguna.', fields };
        }
        if (status === 422) {
            return { message: 'Periksa kembali data yang Anda masukkan.', fields };
        }
        return { message: details?.message || 'Gagal terhubung ke server. Silakan coba lagi.', fields };
    }
    return { message: 'Terjadi kesalahan yang tidak terduga.', fields: {} };
}

function normalizeUsers(payload: UserRecord[] | UserResponse): UserRecord[] {
    // Mendukung respons berupa array langsung atau { data: [...] }.
    return Array.isArray(payload) ? payload : payload.data;
}

function Glyph({ name, size = 22, ...props }: { name: 'search' | 'plus' | 'arrow' | 'reload' | 'eye' | 'eye-off' | 'check'; size?: number } & SVGProps<SVGSVGElement>) {
    const base = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.9,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true as const,
        ...props,
    };
    const path = {
        search: <><circle cx="10.8" cy="10.8" r="7" /><path d="m16 16 5 5" /></>,
        plus: <path d="M12 3v18M3 12h18" />,
        arrow: <path d="m14.5 5-7 7 7 7" />,
        reload: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.3 9A7 7 0 0 1 18.5 6L20 12M4 12l1.5 6A7 7 0 0 0 18 15" /></>,
        eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
        'eye-off': <><path d="m3 3 18 18M10.7 5.1A12 12 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3.1 3.6M6.2 6.3C3.5 8.3 2 12 2 12s4 7 10 7c1.6 0 3.2-.5 4.6-1.4M10 10a3 3 0 0 0 4 4" /></>,
        check: <path d="m5 12 4 4L19 6" />,
    }[name];
    return <svg {...base}>{path}</svg>;
}

function Avatar({ active, large = false }: { active?: boolean; large?: boolean }) {
    return (
        <span className={`mu-avatar${large ? ' mu-avatar-large' : ''}`} aria-label={active === undefined ? 'Profil akun' : active ? 'Akun aktif' : 'Akun tidak aktif'}>
            {active !== undefined && <span className={`mu-avatar-dot ${active ? 'mu-dot-active' : 'mu-dot-inactive'}`} />}
        </span>
    );
}

function Segmented<T extends string | boolean>({
    value,
    onChange,
    options,
    label,
}: {
    value: T;
    onChange: (value: T) => void;
    options: Array<{ value: T; text: string }>;
    label: string;
}) {
    return (
        <div className="mu-segmented" role="group" aria-label={label}>
            {options.map((option) => (
                <button
                    key={String(option.value)}
                    type="button"
                    aria-pressed={value === option.value}
                    className={`mu-segment${value === option.value ? ' mu-segment-selected' : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    {option.text}
                </button>
            ))}
        </div>
    );
}

export default function ManajemenUser() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [view, setView] = useState<View>('list');
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const [editing, setEditing] = useState<UserRecord | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('user');
    const [status, setStatus] = useState(true);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [availability, setAvailability] = useState<Availability>('idle');
    const availabilityRequest = useRef(0);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setGlobalError('');
        try {
            const response = await http.get<UserRecord[] | UserResponse>(`${USERS_ENDPOINT}/get-users`);
            setUsers(normalizeUsers(response.data));
        } catch (error) {
            setGlobalError(errorDetail(error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { void loadUsers(); }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => user.username.toLowerCase().includes(query.trim().toLowerCase()));
    }, [users, query]);

    function resetFeedback() {
        setGlobalError('');
        setFieldErrors({});
        setNotice('');
        availabilityRequest.current += 1;
        setAvailability('idle');
        setPasswordVisible(false);
    }

    function showList() {
        resetFeedback();
        setView('list');
        setEditing(null);
        setPassword('');
    }

    function openCreate() {
        resetFeedback();
        setUsername('');
        setPassword('');
        setRole('user'); // Default paling rendah hak aksesnya.
        setStatus(true);
        setEditing(null);
        setView('create');
    }

    function openEdit(user: UserRecord) {
        resetFeedback();
        setEditing(user);
        setUsername(user.username);
        setRole(user.role);
        setStatus(user.status);
        setPassword(''); // Password lama tidak pernah dikirim ke client.
        setView('edit');
    }

    function changeUsername(value: string) {
        setUsername(value);
        setFieldErrors((previous) => ({ ...previous, username: undefined }));
        availabilityRequest.current += 1;
        setAvailability('idle');
    }

    async function checkUsername() {
        if (view !== 'create' || !username.trim()) return;
        const candidate = username.trim();
        const currentRequest = ++availabilityRequest.current;
        setAvailability('checking');
        try {
            const response = await http.get<{ available: boolean }>(`${USERS_ENDPOINT}/check-username`, {
                params: { username: candidate },
            });
            if (currentRequest !== availabilityRequest.current) return;
            if (response.data.available) {
                setAvailability('available');
                setFieldErrors((previous) => ({ ...previous, username: undefined }));
            } else {
                setAvailability('taken');
                setFieldErrors((previous) => ({ ...previous, username: 'Username sudah digunakan. Pilih username lain.' }));
            }
        } catch {
            if (currentRequest === availabilityRequest.current) {
                // Pemeriksaan awal boleh gagal; unique tetap divalidasi saat POST oleh Laravel.
                setAvailability('unavailable');
            }
        }
    }

    function updatePassword(value: string) {
        setPassword(value);
        setFieldErrors((previous) => ({ ...previous, password: undefined }));
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSaving) return;
        setGlobalError('');
        setFieldErrors({});

        if (view === 'create') {
            const errors: FieldErrors = {};
            if (!username.trim()) errors.username = 'Username wajib diisi.';
            if (availability === 'taken') errors.username = 'Username sudah terdaftar.';
            if (password.length < 8) errors.password = 'Password minimal 8 karakter.';
            if (Object.keys(errors).length) { setFieldErrors(errors); return; }

            setIsSaving(true);
            try {
                await http.post(`${USERS_ENDPOINT}/create`, {
                    username: username.trim(),
                    password,
                    role,
                    status,
                });
                setView('list');
                setPassword('');
                setNotice('Akun berhasil dibuat.');
                await loadUsers();
            } catch (error) {
                const details = errorDetail(error);
                setGlobalError(details.message);
                setFieldErrors(details.fields);
                if (details.fields.username) setAvailability('taken');
            } finally {
                setIsSaving(false);
            }
            return;
        }

        if (view === 'edit' && editing) {
            // Sengaja hanya mengirim parameter yang berubah (sesuai `sometimes` di Laravel).
            // ID dikirim pada URL /admin/users/{id}, bukan harus di body.
            const changes: { role?: Role; status?: boolean; password?: string } = {};
            if (role !== editing.role) changes.role = role;
            if (status !== editing.status) changes.status = status;
            if (password.length > 0) {
                if (password.length < 8) {
                    setFieldErrors({ password: 'Password baru minimal 8 karakter.' });
                    return;
                }
                changes.password = password;
            }
            if (!Object.keys(changes).length) {
                setGlobalError('Belum ada data yang diubah.');
                return;
            }

            setIsSaving(true);
            try {
                await http.patch(`${USERS_ENDPOINT}/edit/${editing.id}`, changes);
                setView('list');
                setEditing(null);
                setPassword('');
                setNotice('Perubahan akun berhasil disimpan.');
                await loadUsers();
            } catch (error) {
                const details = errorDetail(error);
                setGlobalError(details.message);
                setFieldErrors(details.fields);
            } finally {
                setIsSaving(false);
            }
        }
    }

    return (
        <section className={`mu-container mu-view-${view}`} aria-label="Manajemen akun pengguna">
            {view === 'list' ? (
                <div className="mu-list-screen">
                    <div className="mu-search-wrapper">
                        <Glyph name="search" size={23} />
                        <input
                            type="search"
                            value={query}
                            placeholder="Cari username pengguna"
                            aria-label="Cari username pengguna"
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </div>
                    {notice && <p className="mu-success" role="status"><Glyph name="check" size={16} />{notice}</p>}
                    {globalError && <div className="mu-error-panel" role="alert">{globalError} <button type="button" onClick={() => void loadUsers()}>Coba lagi</button></div>}

                    {isLoading ? (
                        <p className="mu-empty" role="status">Memuat daftar pengguna...</p>
                    ) : filteredUsers.length ? (
                        <div className="mu-user-list">
                            {filteredUsers.map((user) => (
                                <button className="mu-user-item" key={user.id} type="button" onClick={() => openEdit(user)}>
                                    <Avatar active={user.status} />
                                    <span className="mu-user-name">{user.username}</span>
                                    <span className="mu-role-pill">{user.role === 'admin' ? 'Admin' : 'User'}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="mu-empty">{query ? 'Tidak ada username yang cocok dengan pencarian.' : 'Belum ada akun pengguna.'}</p>
                    )}

                    <button className="mu-floating-add" type="button" title="Buat akun baru" aria-label="Buat akun baru" onClick={openCreate}>
                        <Glyph name="plus" size={33} />
                    </button>
                </div>
            ) : (
                <div className="mu-form-screen">
                    <button type="button" className="mu-back" onClick={showList} aria-label="Kembali ke daftar pengguna">
                        <Glyph name="arrow" size={19} /> Kembali
                    </button>
                    <form className="mu-form-card" onSubmit={save} noValidate>
                        {view === 'edit' ? (
                            <div className="mu-edit-heading">
                                <Avatar large />
                                <h2>{username}</h2>
                                <p>Ubah role, status, atau password akun.</p>
                            </div>
                        ) : (
                            <h2 className="mu-create-heading">Buat Akun</h2>
                        )}

                        {globalError && <p className="mu-form-error" role="alert">{globalError}</p>}

                        {view === 'create' && (
                            <div className="mu-form-field">
                                <label htmlFor="mu-username">Username</label>
                                <input
                                    id="mu-username"
                                    type="text"
                                    value={username}
                                    placeholder="Masukkan username"
                                    autoComplete="off"
                                    maxLength={255}
                                    aria-invalid={Boolean(fieldErrors.username)}
                                    onChange={(event) => changeUsername(event.target.value)}
                                    onBlur={() => void checkUsername()}
                                    required
                                />
                                {fieldErrors.username && <small className="mu-field-error" role="alert">{fieldErrors.username}</small>}
                                {!fieldErrors.username && availability === 'checking' && <small className="mu-help">Memeriksa username...</small>}
                                {!fieldErrors.username && availability === 'available' && <small className="mu-field-ok">Username tersedia.</small>}
                                {availability === 'unavailable' && <small className="mu-help">Pemeriksaan langsung tidak tersedia; username akan divalidasi saat disimpan.</small>}
                            </div>
                        )}

                        <div className="mu-form-field">
                            <label htmlFor="mu-password">{view === 'edit' ? 'Ubah Password' : 'Password'}</label>
                            <div className="mu-password-wrapper">
                                <input
                                    id="mu-password"
                                    type={passwordVisible ? 'text' : 'password'}
                                    value={password}
                                    placeholder={view === 'edit' ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(fieldErrors.password)}
                                    onChange={(event) => updatePassword(event.target.value)}
                                    minLength={8}
                                    required={view === 'create'}
                                />
                                <button type="button" className="mu-reveal" onClick={() => setPasswordVisible((value) => !value)} aria-label={passwordVisible ? 'Sembunyikan password' : 'Tampilkan password'}>
                                    <Glyph name={passwordVisible ? 'eye-off' : 'eye'} size={19} />
                                </button>
                            </div>
                            {fieldErrors.password && <small className="mu-field-error" role="alert">{fieldErrors.password}</small>}
                            {view === 'edit' && !fieldErrors.password && <small className="mu-help">Opsional. Biarkan kosong jika tidak ingin mengganti password.</small>}
                        </div>

                        <div className="mu-form-field">
                            <label>Role</label>
                            <Segmented<Role>
                                value={role}
                                onChange={setRole}
                                label="Pilih role pengguna"
                                options={[{ value: 'user', text: 'User' }, { value: 'admin', text: 'Admin' }]}
                            />
                            {fieldErrors.role && <small className="mu-field-error" role="alert">{fieldErrors.role}</small>}
                        </div>

                        <div className="mu-form-field">
                            <label>Status</label>
                            <Segmented<boolean>
                                value={status}
                                onChange={setStatus}
                                label="Pilih status akun"
                                options={[{ value: false, text: 'Tidak Aktif' }, { value: true, text: 'Aktif' }]}
                            />
                            {fieldErrors.status && <small className="mu-field-error" role="alert">{fieldErrors.status}</small>}
                        </div>

                        <button className="mu-save" type="submit" disabled={isSaving}>
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </form>
                </div>
            )}
            <style>{css}</style>
        </section>
    );
}

const css = `
.mu-container, .mu-container * { box-sizing: border-box; }
.mu-container { min-height: 100%; color: #111327; font-family: Arial, Helvetica, sans-serif; }
.mu-container button, .mu-container input { font: inherit; }
.mu-container button { cursor: pointer; }
.mu-container button:focus-visible, .mu-container input:focus-visible { outline: 3px solid #5da1ff; outline-offset: 2px; }
.mu-list-screen { min-height: calc(100vh - 70px); padding: 23px 27px 94px; position: relative; }
.mu-search-wrapper { height: 46px; width: 100%; display: flex; align-items: center; gap: 17px; border: 1.3px solid #5868ff; border-radius: 18px; background: #fff; color: #4a57ff; padding: 0 23px; margin-bottom: 21px; }
.mu-search-wrapper svg { flex-shrink: 0; }
.mu-search-wrapper input { width: 100%; min-width: 0; border: 0; outline: none; background: transparent; color: #101659; font-size: 16px; }
.mu-search-wrapper input:focus-visible { outline: none; }
.mu-search-wrapper input::placeholder { color: #9ba4c6; opacity: 1; }
.mu-user-list { display: flex; flex-direction: column; gap: 12px; }
.mu-user-item { width: 100%; min-height: 94px; border: 1.4px solid #4362ff; border-radius: 21px; background: #c7d7ff; display: grid; grid-template-columns: 138px minmax(0, 1fr) 142px; align-items: center; gap: 14px; padding: 12px 18px; text-align: left; color: #060b18; transition: background .16s ease, transform .16s ease; }
.mu-user-item:hover { background: #b8cdff; transform: translateY(-1px); }
.mu-avatar { position: relative; width: 65px; height: 65px; border: 4px solid #0c64d9; border-radius: 50%; display: inline-flex; flex: none; background: #050505; }
.mu-avatar-dot { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; border-radius: 50%; }
.mu-dot-active { background: #24ed05; }
.mu-dot-inactive { background: #f5222c; }
.mu-user-name { overflow-wrap: anywhere; font-size: 22px; font-weight: 500; }
.mu-role-pill { justify-self: end; min-width: 136px; height: 50px; padding: 0 17px; border-radius: 22px; display: flex; justify-content: center; align-items: center; background: #4149f3; color: white; font-size: 24px; }
.mu-floating-add { position: fixed; z-index: 5; bottom: 27px; right: 31px; width: 70px; height: 70px; border: 0; border-radius: 50%; background: #24279e; color: #a4bbff; display: flex; justify-content: center; align-items: center; box-shadow: 0 8px 22px rgba(21, 28, 108, .16); }
.mu-floating-add:hover { background: #111b86; }
.mu-empty { margin: 36px auto; text-align: center; font-size: 15px; color: #59658c; }
.mu-success { display: flex; gap: 8px; align-items: center; margin: 0 0 17px; padding: 10px 13px; color: #0a713e; background: #e9fbef; border: 1px solid #92d6a6; border-radius: 10px; font-size: 14px; }
.mu-error-panel { display: flex; gap: 12px; align-items: center; justify-content: space-between; margin: 0 0 17px; padding: 12px; border: 1px solid #f3b1b1; border-radius: 10px; background: #fff4f4; color: #a02525; font-size: 14px; }
.mu-error-panel button { border: 1px solid currentColor; border-radius: 6px; background: transparent; color: inherit; padding: 4px 9px; }
.mu-form-screen { padding: 35px 24px 60px; min-height: calc(100vh - 70px); display: flex; flex-direction: column; align-items: center; position: relative; }
.mu-back { align-self: flex-start; display: flex; align-items: center; gap: 5px; padding: 9px 13px; background: transparent; color: #111d87; border: 1px solid #bdc4f4; border-radius: 10px; font-size: 14px; }
.mu-back:hover { background: #e2e7ff; }
.mu-form-card { width: min(100%, 430px); margin: auto; padding: 23px 29px 26px; display: flex; flex-direction: column; border: 1px solid #1b2ab7; border-radius: 22px; background: #fff; box-shadow: 0 4px 12px rgba(20, 27, 113, .03); }
.mu-create-heading { text-align: center; color: #051372; font-size: 26px; line-height: 1.25; margin: 0 0 23px; font-weight: 800; }
.mu-edit-heading { display: flex; flex-direction: column; align-items: center; margin: 0 0 18px; }
.mu-avatar-large { width: 99px; height: 99px; border-width: 5px; }
.mu-edit-heading h2 { color: #041579; margin: 14px 0 2px; font-size: 24px; overflow-wrap: anywhere; max-width: 100%; text-align: center; }
.mu-edit-heading p { color: #67719c; font-size: 12px; line-height: 1.4; margin: 0; text-align: center; }
.mu-form-field { display: flex; flex-direction: column; width: 100%; margin-bottom: 14px; }
.mu-form-field label { padding-left: 18px; font-size: 19px; color: #000; margin-bottom: 1px; }
.mu-form-field input { width: 100%; height: 52px; border-radius: 20px; border: 1.2px solid #1323aa; padding: 0 18px; background: #f0f0f0; color: #10143b; font-size: 17px; }
.mu-form-field input::placeholder { color: #b4b4b7; }
.mu-password-wrapper { position: relative; }
.mu-password-wrapper input { padding-right: 51px; }
.mu-reveal { position: absolute; top: 0; right: 7px; height: 52px; width: 37px; border: 0; background: transparent; color: #646ca0; display: flex; align-items: center; justify-content: center; }
.mu-segmented { display: flex; border: 1.2px solid #111ca1; border-radius: 19px; overflow: hidden; min-height: 51px; }
.mu-segment { flex: 1; min-width: 0; border: 0; background: #fff; color: #001080; font-size: 18px; padding: 9px 4px; white-space: nowrap; }
.mu-segment-selected { color: #fff; background: #06127f; }
.mu-segment:not(.mu-segment-selected):hover { background: #eff2ff; }
.mu-field-error { padding: 5px 4px 0; color: #ba2228; font-size: 12px; line-height: 1.35; }
.mu-field-ok { padding: 5px 4px 0; color: #128144; font-size: 12px; }
.mu-help { padding: 5px 4px 0; color: #68739b; font-size: 11px; line-height: 1.35; }
.mu-form-error { border: 1px solid #e9aaaa; background: #fff2f2; color: #aa1e1e; border-radius: 9px; padding: 9px 12px; font-size: 13px; line-height: 1.4; margin: 0 0 13px; }
.mu-save { align-self: center; min-width: 135px; height: 43px; margin-top: 7px; border: 0; border-radius: 24px; background: #041184; color: #fff; font-size: 18px; padding: 0 22px; }
.mu-save:hover { background: #1b279e; }
.mu-save:disabled { opacity: .6; cursor: not-allowed; }
@media (max-width: 700px) {
  .mu-list-screen { padding: 17px 13px 85px; }
  .mu-user-list { gap: 10px; }
  .mu-user-item { padding: 11px 12px; min-height: 77px; grid-template-columns: 61px minmax(0, 1fr) auto; gap: 10px; border-radius: 16px; }
  .mu-avatar { width: 52px; height: 52px; border-width: 3px; }
  .mu-avatar-dot { width: 16px; height: 16px; top: -4px; right: -4px; }
  .mu-user-name { font-size: 16px; }
  .mu-role-pill { min-width: 77px; height: 36px; border-radius: 15px; font-size: 16px; padding: 0 11px; }
  .mu-search-wrapper { padding: 0 14px; height: 45px; gap: 12px; }
  .mu-search-wrapper input { font-size: 14px; }
  .mu-floating-add { bottom: 17px; right: 17px; height: 57px; width: 57px; }
  .mu-form-screen { padding: 15px 12px 37px; }
  .mu-form-card { padding: 21px 19px; }
  .mu-form-field label { font-size: 16px; }
  .mu-segment { font-size: 15px; }
  .mu-avatar-large { width: 85px; height: 85px; }
}
@media (prefers-reduced-motion: reduce) { .mu-user-item { transition: none; } }
`;
