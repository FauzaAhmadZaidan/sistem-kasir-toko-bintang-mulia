import { useEffect, useId, useRef, type ReactNode } from 'react';
import Icon from '../../components/Icon';

type Props = {
    judul: string;
    keterangan?: string;
    onTutup: () => void;
    children: ReactNode;
    footer: ReactNode;
};

export default function DialogKasir({ judul, keterangan, onTutup, children, footer }: Props) {
    const ref = useRef<HTMLDialogElement>(null);
    const judulId = useId();
    useEffect(() => {
        const dialog = ref.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);

    return (
        <dialog ref={ref} className="bmp-dialog" aria-labelledby={judulId}
            onCancel={(e) => { e.preventDefault(); onTutup(); }}
            onClick={(e) => { if (e.target === e.currentTarget) onTutup(); }}>
            <div className="bmp-dialog-layout">
                <header className="bmp-dialog-heading">
                    <div>{keterangan && <p className="bmp-eyebrow">{keterangan}</p>}<h2 id={judulId}>{judul}</h2></div>
                    <button type="button" className="bmp-icon-button" aria-label={'Tutup ' + judul} onClick={onTutup}><Icon name="tutup" /></button>
                </header>
                <div className="bmp-dialog-content">{children}</div>
                <footer className="bmp-dialog-footer">{footer}</footer>
            </div>
        </dialog>
    );
}
