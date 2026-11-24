import axios from 'axios';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Icon from '../../components/Icon';
import { rupiah } from '../../pos/kasir';
import '../../../css/admin-barang.css';

type Status = 'aktif' | 'tidak aktif';
type Kategori = { id: number; n_kategori: string };
type Jenis = { id: number; n_jenis_varian: string };
type Varian = { id: number; jenis_varian_id: number; n_varian: string };
type Sku = { id: number; kode_sku: string; n_sku: string; harga: number | null; stok: number | null; status: Status };
type Barang = {
    id: number;
    kategori_id: number;
    kategori: Kategori | null;
    n_barang: string;
    status: Status;
    has_varian: boolean | null;
    gambar_url: string | null;
    jenis_varians: Jenis[];
    varians: Varian[];
    skus: Sku[];
};
type Inventaris = { data: Barang[]; kategori: Kategori[] };

const api = axios.create({ baseURL: '/admin', headers: { Accept: 'application/json' } });
const jumlahStok = (barang: Barang) => barang.skus.reduce((total, sku) => total + Number(sku.stok ?? 0), 0);

function pesanError(error: unknown) {
    if (!axios.isAxiosError(error)) return 'Terjadi kesalahan. Coba lagi.';
    const response = error.response;
    if (!response) return 'Koneksi terputus. Muat ulang daftar untuk memeriksa apakah perubahan sudah tersimpan.';
    if (response.status === 401 || response.status === 419) return 'Sesi berakhir. Muat ulang halaman dan masuk kembali.';
    if (response.status === 403) return 'Akses khusus akun admin.';
    if (response.status >= 500) return 'Server gagal memproses permintaan. Coba lagi.';
    const data = response.data;
    const detail = data?.errors ?? data?.error;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') return Object.values(detail).flat().join(' ');
    return typeof data?.message === 'string' ? data.message : 'Permintaan gagal diproses.';
}

function FotoBarang({ barang }: { barang: Barang }) {
    const [gagal, setGagal] = useState<string | null>(null);
    const foto = barang.gambar_url;
    return (
        <span className="inv-photo">
            {foto && foto !== gagal
                ? <img src={foto} alt={barang.n_barang} loading="lazy" onError={() => setGagal(foto)} />
                : <Icon name="barang" size={36} />}
        </span>
    );
}

function LabelStatus({ status }: { status: Status }) {
    return <span className="inv-status" data-active={status === 'aktif'}>{status === 'aktif' ? 'Aktif' : 'Tidak aktif'}</span>;
}

function DialogBarang({ judul, anak, tutup, sibuk, lebar }: {
    judul: string; anak: ReactNode; tutup: () => void; sibuk: boolean; lebar: boolean;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const id = useId();
    useEffect(() => {
        const dialog = ref.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);

    return (
        <dialog ref={ref} className={lebar ? 'inv-dialog inv-dialog-wide' : 'inv-dialog'} aria-labelledby={id}
            onCancel={(event) => { event.preventDefault(); if (!sibuk) tutup(); }}
            onClick={(event) => { if (!sibuk && event.target === event.currentTarget) tutup(); }}>
            <div className="inv-dialog-box">
                <header className="inv-dialog-header">
                    <h2 id={id}>{judul}</h2>
                    <button type="button" className="inv-icon" aria-label="Tutup dialog" disabled={sibuk} onClick={tutup}><Icon name="tutup" /></button>
                </header>
                <div className="inv-dialog-body">{anak}</div>
            </div>
        </dialog>
    );
}

function FormBarang({ barang, kategori, sibuk, simpan, batal }: {
    barang?: Barang; kategori: Kategori[]; sibuk: boolean;
    simpan: (nama: string, kategori: string, varian: boolean, status: Status) => void; batal: () => void;
}) {
    const [nama, setNama] = useState(barang?.n_barang ?? '');
    const [kategoriNilai, setKategori] = useState(barang ? String(barang.kategori_id) : '');
    const [varian, setVarian] = useState(Boolean(barang?.has_varian));
    const [status, setStatus] = useState<Status>(barang?.status ?? 'aktif');
    const kategoriId = useId();
    const tipeTerkunci = Boolean(barang && (barang.skus.length || barang.jenis_varians.length));

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (nama.trim() && kategoriNilai.trim()) simpan(nama.trim(), kategoriNilai.trim(), varian, status);
    }

    return (
        <form className="inv-form" onSubmit={submit}>
            <label>Nama barang<input required maxLength={255} value={nama} onChange={event => setNama(event.target.value)} placeholder="Contoh: Plastik Rajawali" /></label>
            <label>Kategori
                {barang ? (
                    <select required value={kategoriNilai} onChange={event => setKategori(event.target.value)}>
                        {kategori.map(item => <option key={item.id} value={item.id}>{item.n_kategori}</option>)}
                    </select>
                ) : (
                    <>
                        <input list={kategoriId} required maxLength={255} value={kategoriNilai} onChange={event => setKategori(event.target.value)} placeholder="Pilih atau ketik kategori baru" />
                        <datalist id={kategoriId}>{kategori.map(item => <option key={item.id} value={item.n_kategori} />)}</datalist>
                    </>
                )}
            </label>
            <label>Tipe barang
                <select value={varian ? 'varian' : 'satuan'} disabled={tipeTerkunci} onChange={event => setVarian(event.target.value === 'varian')}>
                    <option value="satuan">Tanpa varian</option>
                    <option value="varian">Dengan varian</option>
                </select>
                {tipeTerkunci && <small>Tipe terkunci setelah varian atau SKU dibuat.</small>}
            </label>
            {barang && <label>Status barang
                <select value={status} onChange={event => setStatus(event.target.value as Status)}>
                    <option value="aktif">Aktif</option><option value="tidak aktif">Tidak aktif</option>
                </select>
            </label>}
            <div className="inv-actions">
                <button type="button" className="inv-button" disabled={sibuk} onClick={batal}>Batal</button>
                <button type="submit" className="inv-button inv-primary" disabled={sibuk || !nama.trim() || !kategoriNilai.trim()}>
                    {sibuk ? 'Menyimpan…' : 'Simpan barang'}
                </button>
            </div>
        </form>
    );
}

function FormVarian({ barang, sibuk, simpan }: { barang: Barang; sibuk: boolean; simpan: (jenis: string, pilihan: string[]) => void }) {
    const [jenis, setJenis] = useState('');
    const [pilihan, setPilihan] = useState('');
    const jenisId = useId();
    const daftar = [...new Map(pilihan.split(',').map(item => item.trim()).filter(Boolean).map(item => [item.toLowerCase(), item])).values()];
    return (
        <form className="inv-form inv-variant-form" onSubmit={event => {
            event.preventDefault();
            if (jenis.trim() && daftar.length) simpan(jenis.trim(), daftar);
        }}>
            <label>Jenis varian
                {barang.skus.length ? <select required value={jenis} onChange={event => setJenis(event.target.value)}>
                    <option value="">Pilih jenis varian</option>
                    {barang.jenis_varians.map(item => <option key={item.id}>{item.n_jenis_varian}</option>)}
                </select> : <>
                    <input list={jenisId} required maxLength={255} value={jenis} onChange={event => setJenis(event.target.value)} placeholder="Contoh: Ukuran" />
                    <datalist id={jenisId}>{barang.jenis_varians.map(item => <option key={item.id} value={item.n_jenis_varian} />)}</datalist>
                </>}
            </label>
            <label>Pilihan varian<input required value={pilihan} onChange={event => setPilihan(event.target.value)} placeholder="Contoh: Kecil, Sedang, Besar" /><small>Pisahkan pilihan dengan koma.</small></label>
            <button className="inv-button inv-primary" disabled={sibuk || !jenis.trim() || !daftar.length}>Simpan pilihan</button>
        </form>
    );
}

function FormSku({ sku, sibuk, simpan, batal }: {
    sku: Sku; sibuk: boolean; simpan: (perubahan: { id: number; harga?: number; stok?: number; stok_sebelumnya?: number | null; status?: Status }) => void; batal: () => void;
}) {
    const [harga, setHarga] = useState(String(sku.harga ?? ''));
    const [stok, setStok] = useState(String(sku.stok ?? ''));
    const [status, setStatus] = useState(sku.status);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const stokBaru = Number(stok);
        const hargaBaru = Number(harga);
        simpan({
            id: sku.id,
            ...(hargaBaru !== sku.harga && { harga: hargaBaru }),
            ...(stokBaru !== sku.stok && { stok: stokBaru, stok_sebelumnya: sku.stok }),
            ...(status !== sku.status && { status }),
        });
    }

    return (
        <form className="inv-form" onSubmit={submit}>
            <p className="inv-muted">{sku.n_sku} · <code>{sku.kode_sku}</code></p>
            <div className="inv-fields">
                <label>Harga jual (Rp)<input type="number" inputMode="numeric" min={0} max={2147483647} step={1} required value={harga} onChange={event => setHarga(event.target.value)} /></label>
                <label>Stok<input type="number" inputMode="numeric" min={0} max={2147483647} step={1} required value={stok} onChange={event => setStok(event.target.value)} /></label>
            </div>
            <label>Status SKU
                <select value={status} onChange={event => setStatus(event.target.value as Status)}>
                    <option value="tidak aktif">Tidak aktif</option><option value="aktif">Aktif</option>
                </select>
            </label>
            <div className="inv-actions">
                <button type="button" className="inv-button" disabled={sibuk} onClick={batal}>Kembali</button>
                <button type="submit" className="inv-button inv-primary" disabled={sibuk || !harga || !stok}>{sibuk ? 'Menyimpan…' : 'Simpan SKU'}</button>
            </div>
        </form>
    );
}

function FormFoto({ sibuk, simpan }: { sibuk: boolean; simpan: (file: File) => void }) {
    const [foto, setFoto] = useState<File | null>(null);
    return (
        <form className="inv-photo-form" onSubmit={event => { event.preventDefault(); if (foto) simpan(foto); }}>
            <label>Foto barang<input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={event => setFoto(event.target.files?.[0] ?? null)} /></label>
            <small>JPG, PNG, atau WebP. Maksimal 2 MB.</small>
            <button className="inv-button" disabled={!foto || sibuk}>Simpan foto</button>
        </form>
    );
}

type Layar = { tipe: 'tambah' } | { tipe: 'detail' | 'edit' | 'varian' | 'foto'; id: number } | { tipe: 'sku'; id: number; skuId: number };

export default function ManajemenBarang() {
    const [inventaris, setInventaris] = useState<Inventaris | null>(null);
    const [muat, setMuat] = useState(true);
    const [gagalMuat, setGagalMuat] = useState('');
    const [cari, setCari] = useState('');
    const [filterKategori, setFilterKategori] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [layar, setLayar] = useState<Layar | null>(null);
    const [sibuk, setSibuk] = useState(false);
    const [pesan, setPesan] = useState('');
    const [gagal, setGagal] = useState('');
    const mutation = useRef(false);
    const permintaan = useRef<AbortController | null>(null);

    const muatUlang = useCallback(async () => {
        permintaan.current?.abort();
        const controller = new AbortController();
        permintaan.current = controller;
        setMuat(true);
        setGagalMuat('');
        try {
            const { data } = await api.get<Inventaris>('/barang', { signal: controller.signal });
            if (!controller.signal.aborted) setInventaris(data);
        } catch (error) {
            if (!controller.signal.aborted) setGagalMuat(pesanError(error));
        } finally {
            if (!controller.signal.aborted) setMuat(false);
        }
    }, []);

    useEffect(() => {
        void muatUlang();
        return () => permintaan.current?.abort();
    }, [muatUlang]);

    async function ubah(action: () => Promise<string>) {
        if (mutation.current) return;
        mutation.current = true;
        setSibuk(true);
        setGagal('');
        setPesan('');
        try {
            setPesan(await action());
            await muatUlang();
        } catch (error) {
            setGagal(pesanError(error));
        } finally {
            setSibuk(false);
            mutation.current = false;
        }
    }

    function buka(target: Layar | null) {
        setLayar(target);
        setPesan('');
        setGagal('');
    }

    const barang = inventaris?.data ?? [];
    const kategori = inventaris?.kategori ?? [];
    const query = cari.trim().toLowerCase();
    const hasil = barang.filter(item =>
        (!filterKategori || String(item.kategori_id) === filterKategori) &&
        (!filterStatus || item.status === filterStatus) &&
        [item.n_barang, ...item.skus.flatMap(sku => [sku.kode_sku, sku.n_sku])].some(teks => teks.toLowerCase().includes(query))
    );
    const dipilih = layar && 'id' in layar ? barang.find(item => item.id === layar.id) : undefined;
    const sku = layar?.tipe === 'sku' ? dipilih?.skus.find(item => item.id === layar.skuId) : undefined;
    const detail = (id: number) => ({ tipe: 'detail', id } as const);
    const judul = layar?.tipe === 'tambah' ? 'Tambah barang' : layar?.tipe === 'edit' ? 'Edit barang' :
        layar?.tipe === 'sku' ? 'Edit SKU' : layar?.tipe === 'varian' ? 'Tambah pilihan varian' :
        layar?.tipe === 'foto' ? 'Foto barang' : dipilih?.n_barang ?? 'Detail barang';

    function buatSku(item: Barang) {
        return ubah(async () => {
            const { data } = await api.post<{ data: { jumlah_dibuat: number; jumlah_dilewati: number } }>('/sku/generate', { barang_id: item.id });
            const { jumlah_dibuat: dibuat, jumlah_dilewati: dilewati } = data.data;
            return dibuat ? `${dibuat} SKU dibuat. Isi harga dan stok, lalu aktifkan SKU.` : `Semua ${dilewati} SKU sudah tersedia.`;
        });
    }

    return (
        <section className="bmp-page inv-page">
            <header className="inv-heading">
                <div><h1>Manajemen Barang</h1><p>Kelola produk, varian, harga, dan stok untuk katalog kasir.</p></div>
                <button className="inv-button inv-primary" type="button" onClick={() => buka({ tipe: 'tambah' })}><Icon name="tambah" size={18} />Tambah barang</button>
            </header>

            {inventaris && <dl className="inv-metrics">
                <div><dt>Total barang</dt><dd>{barang.length}</dd></div>
                <div><dt>Barang aktif</dt><dd>{barang.filter(item => item.status === 'aktif').length}</dd></div>
                <div><dt>SKU aktif</dt><dd>{barang.reduce((total, item) => total + item.skus.filter(skuItem => skuItem.status === 'aktif').length, 0)}</dd></div>
            </dl>}

            <div className="inv-toolbar">
                <label className="inv-search"><Icon name="cari" size={18} /><input type="search" aria-label="Cari barang atau SKU" placeholder="Cari nama barang atau kode SKU" value={cari} onChange={event => setCari(event.target.value)} /></label>
                <select aria-label="Filter kategori" value={filterKategori} onChange={event => setFilterKategori(event.target.value)}>
                    <option value="">Semua kategori</option>
                    {kategori.map(item => <option key={item.id} value={item.id}>{item.n_kategori}</option>)}
                </select>
                <select aria-label="Filter status" value={filterStatus} onChange={event => setFilterStatus(event.target.value)}>
                    <option value="">Semua status</option><option value="aktif">Aktif</option><option value="tidak aktif">Tidak aktif</option>
                </select>
                <button className="inv-button inv-refresh" type="button" aria-label="Muat ulang daftar" title="Muat ulang daftar" disabled={muat} onClick={muatUlang}><Icon name="ulang" size={18} /></button>
            </div>

            {gagalMuat && <div className="inv-feedback inv-error" role="alert">{gagalMuat} <button type="button" onClick={muatUlang}>Coba lagi</button></div>}
            {muat && <p className="inv-feedback" role="status">Memuat inventaris…</p>}
            {inventaris && (hasil.length ? (
                <>
                    <p className="inv-result" role="status">{hasil.length} barang</p>
                    <div className="inv-grid">
                        {hasil.map(item => (
                            <button key={item.id} type="button" className="inv-card" aria-label={'Lihat detail ' + item.n_barang} onClick={() => buka(detail(item.id))}>
                                <FotoBarang barang={item} />
                                <span className="inv-card-body">
                                    <span className="inv-muted">{item.kategori?.n_kategori ?? 'Tanpa kategori'}</span>
                                    <strong>{item.n_barang}</strong>
                                    <span className="inv-card-meta"><LabelStatus status={item.status} /><span>{item.skus.length} SKU · {jumlahStok(item)} stok</span></span>
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            ) : <div className="inv-empty"><Icon name={barang.length ? 'cari' : 'barang'} size={30} /><strong>{barang.length ? 'Barang tidak ditemukan' : 'Belum ada barang'}</strong>
                {barang.length ? <button className="inv-button" type="button" onClick={() => { setCari(''); setFilterKategori(''); setFilterStatus(''); }}>Reset filter</button> :
                    <button className="inv-button" type="button" onClick={() => buka({ tipe: 'tambah' })}>Tambah barang pertama</button>}
            </div>)}

            {layar && <DialogBarang judul={judul} lebar={layar.tipe === 'detail'} sibuk={sibuk} tutup={() => buka(null)} anak={
                <>
                    {gagal && <div className="inv-feedback inv-error" role="alert">{gagal}{layar.tipe === 'sku' && <button type="button" disabled={sibuk} onClick={() => { buka(detail(layar.id)); void muatUlang(); }}>Kembali dan muat ulang</button>}</div>}
                    {pesan && <p className="inv-feedback inv-success" role="status">{pesan}</p>}
                    {gagalMuat && <div className="inv-feedback inv-error" role="alert">Daftar belum bisa diperbarui. <button type="button" onClick={muatUlang}>Muat ulang</button></div>}
                    {layar.tipe === 'tambah' && <FormBarang key="tambah" kategori={kategori} sibuk={sibuk} batal={() => buka(null)} simpan={(nama, namaKategori, varian) => ubah(async () => {
                        const { data } = await api.post<{ barang: { id: number } }>('/barang/add', { nama_barang: nama, kategori_barang: namaKategori, has_varian: varian });
                        setLayar(detail(data.barang.id));
                        return varian ? 'Barang disimpan. Tambahkan pilihan varian sebelum membuat SKU.' : 'Barang disimpan. Buat SKU untuk mengatur harga dan stok.';
                    })} />}
                    {layar.tipe === 'edit' && dipilih && <FormBarang key={'edit-' + dipilih.id} barang={dipilih} kategori={kategori} sibuk={sibuk} batal={() => buka(detail(dipilih.id))}
                        simpan={(nama, idKategori, varian, status) => ubah(async () => {
                            await api.post('/barang/edit', {
                                id: dipilih.id, n_barang: nama, kategori_id: Number(idKategori), status,
                                ...(!dipilih.skus.length && !dipilih.jenis_varians.length && { has_varian: varian }),
                            });
                            setLayar(detail(dipilih.id));
                            return 'Perubahan barang disimpan.';
                        })} />}
                    {layar.tipe === 'varian' && dipilih && <FormVarian key={dipilih.id} barang={dipilih} sibuk={sibuk} simpan={(jenis, pilihan) => ubah(async () => {
                        await api.post('/varian/add', { barang_id: dipilih.id, jenis_varian: jenis, varian: pilihan });
                        setLayar(detail(dipilih.id));
                        return 'Pilihan varian disimpan. Buat SKU untuk menambahkan kombinasi baru.';
                    })} />}
                    {layar.tipe === 'foto' && dipilih && <FormFoto sibuk={sibuk} simpan={file => ubah(async () => {
                        const form = new FormData();
                        form.set('id', String(dipilih.id));
                        form.set('gambar', file);
                        await api.post('/barang/foto', form);
                        setLayar(detail(dipilih.id));
                        return 'Foto barang disimpan.';
                    })} />}
                    {layar.tipe === 'sku' && sku && <FormSku key={sku.id} sku={sku} sibuk={sibuk} batal={() => buka(detail(layar.id))} simpan={perubahan => ubah(async () => {
                        await api.post('/sku/edit', perubahan);
                        setLayar(detail(layar.id));
                        return 'Perubahan SKU disimpan.';
                    })} />}
                    {layar.tipe === 'detail' && dipilih && (
                        <>
                            <div className="inv-product">
                                <FotoBarang barang={dipilih} />
                                <div>
                                    <p className="inv-muted">{dipilih.kategori?.n_kategori ?? 'Tanpa kategori'} · {dipilih.has_varian ? 'Dengan varian' : dipilih.has_varian === null ? 'Tipe belum diatur' : 'Tanpa varian'}</p>
                                    <LabelStatus status={dipilih.status} />
                                    <div className="inv-product-actions">
                                        <button className="inv-button" type="button" disabled={sibuk} onClick={() => buka({ tipe: 'edit', id: dipilih.id })}>Edit barang</button>
                                        <button className="inv-button" type="button" disabled={sibuk} onClick={() => buka({ tipe: 'foto', id: dipilih.id })}>{dipilih.gambar_url ? 'Ganti foto' : 'Tambah foto'}</button>
                                    </div>
                                </div>
                            </div>

                            {dipilih.has_varian && <section className="inv-section">
                                <div className="inv-section-head"><h3>Varian</h3>
                                    <button className="inv-button" type="button" disabled={sibuk} onClick={() => buka({ tipe: 'varian', id: dipilih.id })}><Icon name="tambah" size={15} />Tambah pilihan</button>
                                </div>
                                {dipilih.jenis_varians.length ? <dl className="inv-variants">{dipilih.jenis_varians.map(jenis => (
                                    <div key={jenis.id}><dt>{jenis.n_jenis_varian}</dt><dd>{dipilih.varians.filter(varian => varian.jenis_varian_id === jenis.id).map(varian => <span key={varian.id}>{varian.n_varian}</span>)}</dd></div>
                                ))}</dl> : <p className="inv-muted">Tambahkan jenis dan pilihan varian untuk barang ini.</p>}
                            </section>}

                            <section className="inv-section">
                                <div className="inv-section-head">
                                    <h3>Daftar SKU <span className="inv-muted">({dipilih.skus.length})</span></h3>
                                    <button className="inv-button inv-primary" type="button" disabled={sibuk || dipilih.has_varian === null || (dipilih.has_varian && !dipilih.jenis_varians.length)}
                                        onClick={() => buatSku(dipilih)}><Icon name="ulang" size={16} />Buat SKU otomatis</button>
                                </div>
                                {dipilih.skus.length ? <div className="inv-table-wrap" tabIndex={0} aria-label="Daftar SKU">
                                    <table className="inv-table">
                                        <thead><tr><th>Kode / Nama</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead>
                                        <tbody>{dipilih.skus.map(row => <tr key={row.id}>
                                            <td><code>{row.kode_sku}</code><span>{row.n_sku}</span></td>
                                            <td>{row.harga === null ? '—' : rupiah(row.harga)}</td>
                                            <td>{row.stok ?? '—'}</td><td><LabelStatus status={row.status} /></td>
                                            <td><button className="inv-button inv-compact" type="button" disabled={sibuk} aria-label={'Edit SKU ' + row.kode_sku + ' ' + row.n_sku}
                                                onClick={() => buka({ tipe: 'sku', id: dipilih.id, skuId: row.id })}>Edit SKU</button></td>
                                        </tr>)}</tbody>
                                    </table>
                                </div> : <p className="inv-muted">Belum ada SKU untuk barang ini.</p>}
                            </section>
                        </>
                    )}
                    {layar.tipe === 'detail' && !dipilih && !gagalMuat && <p role="status" className="inv-muted">{muat ? 'Memuat detail barang…' : 'Detail barang tidak tersedia.'}</p>}
                    {layar.tipe !== 'detail' && layar.tipe !== 'tambah' && dipilih && layar.tipe !== 'edit' && layar.tipe !== 'sku' &&
                        <button className="inv-button inv-back" type="button" disabled={sibuk} onClick={() => buka(detail(dipilih.id))}>Kembali ke detail</button>}
                </>
            } />}
        </section>
    );
}
