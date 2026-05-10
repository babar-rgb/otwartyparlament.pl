const API_BASE_URL = 'http://localhost:8002/api';

const state = {
    data: { articles: [], mps: [], votes: [], processes: [], wealth: [], trending: [] },
    isLoaded: false,
    filters: { mpSearch: '', voteSearch: '', selectedClub: null }
};

// --- CORE LOGIC ---

async function init() {
    console.log(">>> Truth Layer: Inicjalizacja profesjonalnego API...");
    try {
        const fetchAPI = async (endpoint) => {
            try {
                const response = await fetch(`${API_BASE_URL}/${endpoint}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (e) {
                console.error(`Błąd API (${endpoint}):`, e);
                return [];
            }
        };

        // Pobieramy dane równolegle z nowych "szafeczek"
        const [mps, votes] = await Promise.all([
            fetchAPI('mps'),
            fetchAPI('votes')
        ]);

        state.data.mps = mps;
        state.data.votes = votes;
        
        // Dodajemy jeden artykuł o misji (ten, który miał zostać)
        state.data.articles = [{
            id: 'manifesto',
            category: 'MISJA',
            image: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?q=80&w=500&auto=format&fit=crop',
            date: 'MAJ 2026',
            title: 'Warstwa Prawdy: Informuj bez rujnowania dnia.',
            excerpt: 'Demokracja to nie tylko emocje, to przede wszystkim dane. Naszym celem jest dostarczenie Ci surowych faktów w sposób spokojny i prestiżowy.'
        }];

        state.isLoaded = true;
        setupEventListeners();
        handleRoute();
        console.log(">>> Truth Layer: Gotowy.");
    } catch (err) {
        console.error(">>> Truth Layer: Krytyczny błąd inicjalizacji:", err);
    }
}

function handleRoute() {
    if (!state.isLoaded) return;
    const hash = window.location.hash || '#home';
    const mainContent = document.querySelector('.content-area');
    if (!mainContent) return;

    // Reset UI przy każdej zmianie trasy
    const megaMenu = document.getElementById('megaMenu');
    if (megaMenu) megaMenu.classList.remove('open');
    document.body.classList.remove('menu-open');

    if (hash === '#glosowania') mainContent.innerHTML = templates.votes();
    else if (hash.startsWith('#glosowanie/')) {
        const id = hash.split('/')[1];
        mainContent.innerHTML = `<p style="padding:40px; text-align:center; color:#aaa;">Ładowanie szczegółów głosowania...</p>`;
        
        fetch(`${API_BASE_URL}/votes/${id}`)
            .then(r => r.json())
            .then(fullVote => {
                mainContent.innerHTML = templates.voteDetail(fullVote);
            })
            .catch(err => {
                console.error("Błąd pobierania głosowania:", err);
                mainContent.innerHTML = `<p>Nie udało się załadować danych głosowania.</p>`;
            });
    }
    else if (hash === '#ustawy') mainContent.innerHTML = templates.processes();
    else if (hash.startsWith('#poslowie')) {
        const parts = hash.split('/');
        state.filters.selectedClub = parts[1] ? decodeURIComponent(parts[1]) : null;
        mainContent.innerHTML = templates.mps();
    }
    else if (hash.startsWith('#posel/')) {
        const id = hash.split('/')[1];
        mainContent.innerHTML = `<p style="padding:40px; text-align:center; color:#aaa;">Ładowanie profilu...</p>`;
        
        // Pobieramy PEŁNE dane posła (z historią głosowań) bezpośrednio z API
        fetch(`${API_BASE_URL}/mps/${id}`)
            .then(r => r.json())
            .then(fullMp => {
                mainContent.innerHTML = templates.mpDetail(fullMp);
            })
            .catch(err => {
                console.error("Błąd pobierania posła:", err);
                mainContent.innerHTML = `<p>Nie udało się załadować danych posła.</p>`;
            });
    }
    else mainContent.innerHTML = templates.home();

    window.scrollTo(0, 0);
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
        if (clubItem) window.location.hash = `#poslowie/${encodeURIComponent(clubItem.dataset.club)}`;

        const backBtn = e.target.closest('#backToClubs');
        if (backBtn) window.location.hash = '#poslowie';

        const ledgerItem = e.target.closest('.clickable-ledger');
        if (ledgerItem) window.location.hash = `#glosowanie/${ledgerItem.dataset.id}`;

        const mpItem = e.target.closest('.clickable-mp');
        if (mpItem) window.location.hash = `#posel/${mpItem.dataset.id}`;

        const logoItem = e.target.closest('.logo-main');
        if (logoItem) window.location.hash = '';
    });

    document.addEventListener('input', (e) => {
        if (e.target.id === 'localMpSearch') {
            state.filters.mpSearch = e.target.value;
            document.querySelector('.content-area').innerHTML = templates.mps();
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
