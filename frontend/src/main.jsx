import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import { createRoot } from 'react-dom/client';
import ToastHost from './components/ToastHost';
import './css/app.css';

const pages = import.meta.glob('./pages/**/*.jsx', { eager: true });

function getCookie(name) {
    const target = `${name}=`;
    const parts = document.cookie ? document.cookie.split('; ') : [];
    for (const part of parts) {
        if (part.startsWith(target)) {
            return decodeURIComponent(part.slice(target.length));
        }
    }
    return '';
}

function installCsrfFetchInterceptor() {
    if (typeof window === 'undefined' || window.__csrfFetchPatched) return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
        const request = new Request(input, init);
        const url = new URL(request.url, window.location.origin);
        const isSameOrigin = url.origin === window.location.origin;
        const method = String(request.method || 'GET').toUpperCase();
        const needsCsrf = isSameOrigin && !['GET', 'HEAD', 'OPTIONS'].includes(method);

        const withCsrfHeaders = (sourceInit = {}) => {
            const headers = new Headers(sourceInit.headers || request.headers || {});
            const cookieToken = getCookie('XSRF-TOKEN');
            const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            // X-CSRF-TOKEN expects plain token from meta tag.
            if (metaToken && !headers.has('X-CSRF-TOKEN')) {
                headers.set('X-CSRF-TOKEN', metaToken);
            }
            // X-XSRF-TOKEN can carry the encrypted cookie value.
            if (cookieToken && !headers.has('X-XSRF-TOKEN')) {
                headers.set('X-XSRF-TOKEN', cookieToken);
            }
            if (!headers.has('X-Requested-With')) {
                headers.set('X-Requested-With', 'XMLHttpRequest');
            }

            return {
                ...sourceInit,
                headers,
                credentials: sourceInit.credentials || init.credentials || 'same-origin',
            };
        };

        const firstInit = needsCsrf ? withCsrfHeaders(init) : init;
        let response = await originalFetch(input, firstInit);

        if (!needsCsrf || response.status !== 419) {
            return response;
        }

        try {
            await originalFetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
        } catch {
            return response;
        }

        response = await originalFetch(input, withCsrfHeaders(init));
        return response;
    };

    window.__csrfFetchPatched = true;
}

installCsrfFetchInterceptor();

function installCsrfAxiosInterceptor() {
    if (typeof window === 'undefined' || window.__csrfAxiosPatched) return;

    axios.defaults.withCredentials = true;
    axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
    axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    axios.interceptors.request.use((config) => {
        const method = String(config?.method || 'get').toUpperCase();
        const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);
        if (!needsCsrf) return config;

        const cookieToken = getCookie('XSRF-TOKEN');
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        config.headers = config.headers || {};
        if (metaToken && !config.headers['X-CSRF-TOKEN']) {
            config.headers['X-CSRF-TOKEN'] = metaToken;
        }
        if (cookieToken && !config.headers['X-XSRF-TOKEN']) {
            config.headers['X-XSRF-TOKEN'] = cookieToken;
        }

        return config;
    });

    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const status = error?.response?.status;
            const config = error?.config;

            if (status !== 419 || !config || config.__csrfRetried) {
                return Promise.reject(error);
            }

            config.__csrfRetried = true;

            try {
                await axios.get('/sanctum/csrf-cookie', {
                    withCredentials: true,
                    headers: { Accept: 'application/json' },
                });

                return axios(config);
            } catch {
                return Promise.reject(error);
            }
        },
    );

    window.__csrfAxiosPatched = true;
}

function primeCsrfCookie() {
    if (typeof window === 'undefined') return;
    const hasXsrfCookie = document.cookie
        .split('; ')
        .some((row) => row.startsWith('XSRF-TOKEN='));

    if (hasXsrfCookie) return;

    void fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    });
}

installCsrfAxiosInterceptor();
primeCsrfCookie();

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
