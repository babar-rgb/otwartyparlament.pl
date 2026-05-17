// api.js — Jedyna warstwa komunikacji z backendem.
// Wszystkie fetch() przechodzą przez tę funkcję.
// Zależy od: config.js (CONFIG.API)

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${CONFIG.API}/${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status} dla /${endpoint}`);
        return await response.json();
    } catch (e) {
        console.error(`[API] Błąd (${endpoint}):`, e);
        return [];
    }
}
