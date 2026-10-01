import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import react from '@vitejs/plugin-react';
import PosApp from './PosApp';

const element = document.getElementById('pos-root');

if (!element) {
    throw new Error('Elemen #pos-root tidak ditemukan pada halaman.');
}

const root = createRoot(element)
root.render(<StrictMode><PosApp /></StrictMode>);
