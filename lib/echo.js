import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const resolveInternalProxyBasePath = () =>
    String(process.env.NEXT_PUBLIC_INTERNAL_PROXY_BASE_PATH || "/internal-api")
        .trim()
        .replace(/\/+$/, "");

const createEcho = (token) => {
    // Sigurnosna provjera za Next.js (SSR)
    if (typeof window === 'undefined') {
        return null;
    }

    window.Pusher = Pusher;

    return new Echo({
        broadcaster: 'reverb',
        
        // Uzimamo ključ iz tvog .env fajla
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
        
        // Host je 'admin.lmx.ba'
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
        
        // Portovi su 443 jer koristiš SSL
        wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ?? 80,
        wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ?? 443,
        
        // Forsiramo TLS (https/wss) jer ti je scheme 'wss'
        forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME === 'wss'),
        
        enabledTransports: ['ws', 'wss'],
        
        // Svi browser auth zahtjevi idu kroz interni BFF sloj.
        authEndpoint: `${resolveInternalProxyBasePath()}/broadcasting/auth`,
        
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });
};

export default createEcho;
