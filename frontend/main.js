const API_BASE_URL = 'http://localhost:8002/api';

const state = {
    data: { articles: [], mps: [], votes: [], processes: [], wealth: [], trending: [] },
    isLoaded: false,
    filters: { mpSearch: '', voteSearch: '', selectedClub: null }
};

// --- CORE LOGIC ---

async function init() {
    console.log("Init starting...");
    try {
        const fetchWithTimeout = (url, timeout = 2000) => {
            return Promise.race([
                fetch(url).then(r => r.ok ? r.json() : []),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
            ]).catch(() => []);
        };

        const [mps, votes, procs, trending] = await Promise.all([
            fetchWithTimeout(`${API_BASE_URL}/mps?active=true&light=True`),
            fetchWithTimeout(`${API_BASE_URL}/votes?limit=50`),
            fetchWithTimeout(`${API_BASE_URL}/legislative_processes?limit=50`),
            fetchWithTimeout(`${API_BASE_URL}/trending`)
        ]);

        state.data.mps = mps;
        state.data.votes = votes.items || votes;
        state.data.processes = procs.items || procs;
        state.data.trending = trending;

        const staticData = await fetch(`data.json?t=${Date.now()}`).then(r => r.json()).catch(err => { console.error("Data JSON error:", err); return {}; });
        state.data.articles = staticData.articles || [];
        if (state.data.mps.length === 0) state.data.mps = staticData.mps || [];
        if (state.data.votes.length === 0) state.data.votes = staticData.votes || [];
        if (state.data.processes.length === 0) state.data.processes = staticData.processes || [];

        state.isLoaded = true;
        setupEventListeners();
        handleRoute();
        console.log("Init complete.");
    } catch (err) {
        console.error("Init failed:", err);
    }
}

function handleRoute() {
    if (!state.isLoaded) return;
    const hash = window.location.hash || '#home';
    console.log("Routing to:", hash);
    
    const mainContent = document.querySelector('.content-area');
    if (!mainContent) return;

    const megaMenu = document.getElementById('megaMenu');
    const menuBtn = document.getElementById('menuToggle');
    if (megaMenu) megaMenu.classList.remove('open');
    if (menuBtn) menuBtn.classList.remove('active');
    document.body.classList.remove('menu-open');
    document.body.classList.remove('is-article-view');

    if (hash === '#glosowania') mainContent.innerHTML = templates.votes();
    else if (hash.startsWith('#vote/')) {
        const id = hash.split('/')[1];
        const vote = state.data.votes.find(v => String(v.id) === String(id));
        if (vote) {
            mainContent.innerHTML = templates.voteDetail(vote);
        } else {
            mainContent.innerHTML = `<div class="data-view-container"><p>Nie znaleziono głosowania.</p></div>`;
        }
    }
    else if (hash === '#ustawy') mainContent.innerHTML = templates.processes();
    else if (hash.startsWith('#poslowie')) {
        const parts = hash.split('/');
        state.filters.selectedClub = parts[1] ? decodeURIComponent(parts[1]) : null;
        mainContent.innerHTML = templates.mps();
    }
    else if (hash.startsWith('#posel/')) {
        const id = hash.split('/')[1];
        const mp = state.data.mps.find(m => String(m.id) === String(id));
        if (mp) {
            mainContent.innerHTML = templates.mpDetail(mp);
        } else {
            mainContent.innerHTML = `<div class="data-view-container"><p>Nie znaleziono posła.</p></div>`;
        }
    }
    else mainContent.innerHTML = templates.home();
    
    window.scrollTo(0,0);
}

function setupEventListeners() {
    window.addEventListener('hashchange', handleRoute);
    
    document.addEventListener('click', (e) => {
        const menuBtn = e.target.closest('#menuToggle');
        if (menuBtn) {
            menuBtn.classList.toggle('active');
            document.getElementById('megaMenu').classList.toggle('open');
            document.body.classList.toggle('menu-open');
        }

        const clubItem = e.target.closest('.club-item');
        if (clubItem) {
            window.location.hash = `#poslowie/${encodeURIComponent(clubItem.dataset.club)}`;
        }

        const backBtn = e.target.closest('#backToClubs');
        if (backBtn) {
            window.location.hash = '#poslowie';
        }

        const ledgerItem = e.target.closest('.clickable-ledger');
        if (ledgerItem) {
            window.location.hash = `#vote/${ledgerItem.dataset.id}`;
        }

        const mpItem = e.target.closest('.clickable-mp');
        if (mpItem) {
            window.location.hash = `#posel/${mpItem.dataset.id}`;
        }

        const logoItem = e.target.closest('.logo-main');
        if (logoItem) {
            window.location.hash = '';
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target.id === 'localMpSearch') {
            state.filters.mpSearch = e.target.value;
            document.querySelector('.content-area').innerHTML = templates.mps();
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
