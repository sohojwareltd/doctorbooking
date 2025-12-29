import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import ToastHost from './components/ToastHost';

const pages = import.meta.glob('./pages/**/*.jsx', { eager: true });

createInertiaApp({
    resolve: (name) => {
        const page = pages[`./pages/${name}.jsx`];
        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ToastHost initialFlash={props?.initialPage?.props?.flash}>
                <App {...props} />
            </ToastHost>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
