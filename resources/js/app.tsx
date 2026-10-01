import '../css/app.css';

import {
    createInertiaApp,
    type ResolvedComponent,
} from '@inertiajs/react';

import { createRoot } from 'react-dom/client';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob<ResolvedComponent>(
            './Pages/**/*.tsx',
        );
        const loadPage = pages[`./Pages/${name}.tsx`];
        if (!loadPage) {
            throw new Error(`Page not found: ${name}`);
        }
        return loadPage();
    },

    setup({ el, App, props}) {
        createRoot(el).render(<App {...props} />);
    }
})
