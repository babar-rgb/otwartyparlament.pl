const API_BASE_URL = 'http://localhost:8002/api';

window.state = {
    data: { articles: [], mps: [], votes: [], processes: [], wealth: [], trending: [] },
    isLoaded: false,
    filters: { mpSearch: '', voteSearch: '', selectedClub: null }
};
const state = window.state; // Dla zachowania kompatybilności z resztą main.js

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

    // Reset UI przy każdej zmianie trasy - delegowane do Alpine
    if (window.Alpine) {
        const data = Alpine.closestRoot(document.body)?._x_dataStack[0];
        if (data) data.closeMenu();
    }

    if (hash === '#glosowania') mainContent.innerHTML = templates.votes();
    else if (hash.startsWith('#glosowanie/')) {
        const id = hash.split('/')[1];
        mainContent.innerHTML = `<p style="padding:40px; text-align:center; color:#aaa;">Ładowanie szczegółów głosowania...</p>`;

        fetch(`${API_BASE_URL}/votes/${id}`)
            .then(r => r.json())
            .then(fullVote => {
                state.currentVoteVotes = fullVote.individualVotes; // Przechowujemy głosy dla wyszukiwarki
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

        if (e.target.id === 'mpVoteSearchInput') {
            const query = e.target.value.toLowerCase().trim();
            const resultsContainer = document.getElementById('mpVoteSearchResults');
            if (!resultsContainer) return;

            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                return;
            }

            const filtered = (state.currentVoteVotes || []).filter(m =>
                m.name.toLowerCase().includes(query) || (m.club || '').toLowerCase().includes(query)
            ).slice(0, 4); // Pokazujemy max 4 wyniki, żeby nie psuć layoutu

            resultsContainer.innerHTML = filtered.map(m => templates.renderMpVoteResult(m)).join('');
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
