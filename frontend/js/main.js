// main.js — Inicjalizacja i obsługa zdarzeń.
// Konfiguracja API: config.js | Fetch: api.js | Routing: router.js

window.state = {
    data: { articles: [], mps: [], votes: [], processes: [], wealth: [], trending: [] },
    isLoaded: false,
    filters: { mpSearch: '', voteSearch: '', selectedClub: null }
};
const state = window.state;

// --- CORE LOGIC ---

async function init() {
    console.log(">>> otwartyparlament.pl: Inicjalizacja...");
    try {
        // Natychmiastowe ładowanie UI (zgodnie z origin/b&w)
        state.isLoaded = true;
        setupEventListeners();
        handleRoute();
        console.log(">>> otwartyparlament.pl: Gotowy (natychmiast).");

        // Pobieramy dane w tle (fetchAPI pochodzi z api.js)
        const [mps, votes] = await Promise.all([
            fetchAPI('mps'),
            fetchAPI('votes')
        ]);

        state.data.mps = mps;
        state.data.votes = votes;

        // Artykuły pobierane z bazy
        const [articles] = await Promise.all([fetchAPI('articles')]);
        state.data.articles = articles;

        // Odśwież po pobraniu danych z API
        handleRoute();
        console.log(">>> otwartyparlament.pl: Dane z API załadowane.");
    } catch (err) {
        console.error(">>> otwartyparlament.pl: Krytyczny błąd inicjalizacji:", err);
    }
}

// handleRoute() przeniesiony do router.js

function setupEventListeners() {
    window.addEventListener('hashchange', handleRoute);

    document.addEventListener('click', (e) => {
        const articleItem = e.target.closest('.clickable-article');
        if (articleItem) window.location.hash = `#artykul/${articleItem.dataset.id}`;

        const clubItem = e.target.closest('.club-item');
        if (clubItem) window.location.hash = `#poslowie/${encodeURIComponent(clubItem.dataset.club)}`;

        const backBtn = e.target.closest('#backToClubs');
        if (backBtn) window.location.hash = '#poslowie';

        const ledgerItem = e.target.closest('.clickable-ledger');
        if (ledgerItem) window.location.hash = `#glosowanie/${ledgerItem.dataset.id}`;

        const mpItem = e.target.closest('.clickable-mp');
        if (mpItem) window.location.hash = `#posel/${mpItem.dataset.id}`;
    });

    document.addEventListener('input', (e) => {
        // 1. Wyszukiwarka posłów na liście ogólnej
        if (e.target.id === 'localMpSearch') {
            state.filters.mpSearch = e.target.value;
            // Korzystamy z centralnego silnika do filtrowania lokalnego
            const allMps = window.state?.data?.mps || [];
            state.filteredMps = window.TruthSearch.searchInList(allMps, e.target.value, ['name', 'club']);
            document.querySelector('.content-area').innerHTML = templates.mps();
        }

        // 2. Wyszukiwarka konkretnego posła w widoku głosowania
        if (e.target.id === 'mpVoteSearchInput' || e.target.id === 'voteSearchInput') {
            const query = e.target.value;

            if (e.target.id === 'voteSearchInput') {
                state.filters.voteSearch = query;
                document.querySelector('.content-area').innerHTML = templates.votes();
            } else {
                // Wyszukiwanie wewnątrz konkretnego głosowania
                const resultsContainer = document.getElementById('mpVoteSearchResults');
                if (!resultsContainer) return;
                const results = window.TruthSearch.searchInList(state.currentVoteVotes || [], query, ['name', 'club']).slice(0, 4);
                resultsContainer.innerHTML = results.map(m => templates.renderMpVoteResult(m)).join('');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
