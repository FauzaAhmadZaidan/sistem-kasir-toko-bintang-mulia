import { Head } from "@inertiajs/react";
import { useState } from "react";

type Props = {
    namaToko:string;
};

export default function CekFrontend({ namaToko }: Props) {
    const [jumlahKlik, setJumlahKlik] = useState(0);

    return (
        <>
            <Head title="Pemeriksaan Frontend" />

            <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
                <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
                    <p className="text-sm font-medium text-blue-700">
                        Pemeriksaan Frontend
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                        {namaToko}
                    </h1>

                    <p className="mt-4 text-slate-700">
                        Nama toko di atas dikirim oleh Laravel dan ditampilkan melalui React
                    </p>

                    <button
                    type="button"
                    onClick={() => setJumlahKlik((nilai) => nilai + 1)}
                    className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800">

                    Diklik {jumlahKlik} kali
                    </button>
                </section>
            </main>
        </>
    );
}
