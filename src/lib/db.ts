import { PostgrestClient } from 'postgrest-client';

const apiAnonKey = import.meta.env.VITE_API_ANON_KEY;

if (!apiAnonKey) {
    console.warn('Missing VITE_API_ANON_KEY');
}

// Initialize PostgREST Client
// We use a robust URL detection logic to ensure connection works in both dev (proxy) and production.
const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_POSTGREST_URL;
    if (envUrl && envUrl.startsWith('/')) {
        // Handle relative paths by prefixing current origin (e.g., /rest/v1 -> http://localhost:5173/rest/v1)
        return `${window.location.origin}${envUrl}`;
    }
    return envUrl || 'http://localhost:3001';
};

export const db = new PostgrestClient(getApiUrl());
