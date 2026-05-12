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
            excerpt: 'Demokracja to nie tylko emocje, to przede wszystkim dane. Naszym celem jest dostarczenie Ci surowych faktów w sposób spokojny i prestiżowy.',
            votes_yes: 460,
            votes_no: 0,
            verdict: 'MISJA PRZYJĘTA',
            results_json: [
                { name: 'PRAWO I SPRAWIEDLIWOŚĆ', yes: 190, no: 0, abstain: 0 },
                { name: 'KOALICJA OBYWATELSKA', yes: 157, no: 0, abstain: 0 },
                { name: 'POLSKA 2050 - TRZECIA DROGA', yes: 33, no: 0, abstain: 0 },
                { name: 'PSL - TRZECIA DROGA', yes: 32, no: 0, abstain: 0 },
                { name: 'LEWICA', yes: 26, no: 0, abstain: 0 },
                { name: 'KONFEDERACJA', yes: 18, no: 0, abstain: 0 },
                { name: 'KUKIZ\'15', yes: 4, no: 0, abstain: 0 },
                { name: 'WOLNI REPUBLIKANIE', yes: 4, no: 0, abstain: 0 },
                { name: 'KOŁO POSŁÓW RAZEM', yes: 5, no: 0, abstain: 0 },
                { name: 'NIEZRZESZENI', yes: 1, no: 0, abstain: 0 }
            ]
        },
        {
            id: 'border-law',
            category: 'BEZPIECZEŃSTWO',
            image: 'https://images.unsplash.com/photo-1555848960-8c3ed4cf32a0?q=80&w=500&auto=format&fit=crop',
            date: '10 MAJA 2026',
            title: 'Kto ma prawo pociągnąć za spust?',
            excerpt: 'Sejm przyjął ustawę o wsparciu działań żołnierzy na granicy. Nowe przepisy zmieniają zasady użycia broni w sytuacjach zagrożenia życia, co budzi skrajne emocje wśród prawników i obrońców praw człowieka.',
            votes_yes: 231,
            votes_no: 189,
            verdict: 'PRZYJĘTO',
            results_json: [
                {
                    name: 'KOALICJA OBYWATELSKA', yes: 155, no: 1, abstain: 1,
                    rebels: [
                        { id: 'sterczewski', name: 'F. Sterczewski', vote: 'PRZECIW', photo: 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png' },
                        { id: 'zielinska', name: 'U. Zielińska', vote: 'WSTRZYMAŁA SIĘ', photo: 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png' }
                    ]
                },
                {
                    name: 'PRAWO I SPRAWIEDLIWOŚĆ', yes: 12, no: 168, abstain: 10,
                    rebels: [
                        { id: 'macierewicz', name: 'A. Macierewicz', vote: 'ZA', photo: 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png' }
                    ]
                },
                { name: 'POLSKA 2050 - TRZECIA DROGA', yes: 33, no: 0, abstain: 0 },
                { name: 'PSL - TRZECIA DROGA', yes: 32, no: 0, abstain: 0 },
                {
                    name: 'LEWICA', yes: 15, no: 11, abstain: 0,
                    rebels: [
                        { id: 'biejat', name: 'M. Biejat', vote: 'PRZECIW', photo: 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png' }
                    ]
                },
                { name: 'KONFEDERACJA', yes: 0, no: 18, abstain: 0 },
                { name: 'KUKIZ\'15', yes: 4, no: 0, abstain: 0 },
                { name: 'WOLNI REPUBLIKANIE', yes: 4, no: 0, abstain: 0 },
                { name: 'KOŁO POSŁÓW RAZEM', yes: 0, no: 5, abstain: 0 },
                { name: 'NIEZRZESZENI', yes: 1, no: 0, abstain: 0 }
            ]
        },
        {
            id: 'energy-prices',
            category: 'FINANSE',
            image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=500&auto=format&fit=crop',
            date: '08 MAJA 2026',
            title: 'Ile kosztuje Twoja kawa?',
            excerpt: 'Posłowie zdecydowali o przedłużeniu zamrożenia cen energii dla gospodarstw domowych do końca roku. To decyzja, która bezpośrednio dotknie portfela każdego obywatela, stabilizując koszty utrzymania w dobie inflacji.',
            votes_yes: 412,
            votes_no: 15,
            verdict: 'PRZYJĘTO',
            results_json: [
                { name: 'PRAWO I SPRAWIEDLIWOŚĆ', yes: 170, no: 0, abstain: 20 },
                { name: 'KOALICJA OBYWATELSKA', yes: 157, no: 0, abstain: 0 },
                { name: 'POLSKA 2050 - TRZECIA DROGA', yes: 33, no: 0, abstain: 0 },
                { name: 'PSL - TRZECIA DROGA', yes: 32, no: 0, abstain: 0 },
                { name: 'LEWICA', yes: 26, no: 0, abstain: 0 },
                { name: 'KONFEDERACJA', yes: 5, no: 13, abstain: 0 },
                { name: 'KUKIZ\'15', yes: 4, no: 0, abstain: 0 },
                { name: 'NIEZRZESZENI', yes: 1, no: 0, abstain: 0 }
            ]
        },
        {
            id: 'justice-reform',
            category: 'SĄDOWNICTWO',
            image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=500&auto=format&fit=crop',
            date: '05 MAJA 2026',
            title: 'Czy sędzia jest sędzią?',
            excerpt: 'Projekt ustawy o statusie neosędziów został odrzucony w pierwszym czytaniu. Spór o praworządność wkracza w fazę impasu, pozostawiając tysiące wyroków w stanie niepewności prawnej.',
            votes_yes: 190,
            votes_no: 245,
            verdict: 'ODRZUCONO',
            results_json: [
                { name: 'KOALICJA OBYWATELSKA', yes: 157, no: 0, abstain: 0 },
                { name: 'PRAWO I SPRAWIEDLIWOŚĆ', yes: 0, no: 190, abstain: 0 },
                { name: 'POLSKA 2050 - TRZECIA DROGA', yes: 33, no: 0, abstain: 0 },
                { name: 'PSL - TRZECIA DROGA', yes: 32, no: 0, abstain: 0 },
                { name: 'LEWICA', yes: 0, no: 26, abstain: 0 },
                { name: 'KONFEDERACJA', yes: 0, no: 18, abstain: 0 },
                { name: 'KUKIZ\'15', yes: 0, no: 4, abstain: 0 },
                { name: 'WOLNI REPUBLIKANIE', yes: 0, no: 4, abstain: 0 },
                { name: 'NIEZRZESZENI', yes: 0, no: 1, abstain: 0 }
            ]
        },
        {
            id: 'edukacja-investigation',
            category: 'EDUKACJA',
            image: 'https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=500&auto=format&fit=crop',
            date: '12 MAJA 2026',
            title: 'Reforma Szkolnictwa: Modernizacja czy fasada?',
            excerpt: 'Śledztwo w sprawie programu "Cyfrowa Szkoła 2026" oraz narastającego kryzysu kadrowego w polskich placówkach oświatowych.',
            votes_yes: 231,
            votes_no: 220,
            verdict: 'W TOKU',
            results_json: []
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
    else if (hash.startsWith('#artykul/')) {
        const id = hash.split('/')[1];
        const article = state.data.articles.find(a => a.id == id);
        if (article) {
            mainContent.innerHTML = templates.articleDetail(article);
        } else {
            mainContent.innerHTML = `<p style="padding:40px; text-align:center; color:#aaa;">Nie znaleziono artykułu.</p>`;
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
    else if (hash === '#poza-kadrem') {
        mainContent.innerHTML = templates.szerszyKadr();
    }
    else if (hash.startsWith('#poza-kadrem/')) {
        const id = hash.split('/')[1];
        mainContent.innerHTML = templates.investigationDetail(id);
    }
    else mainContent.innerHTML = templates.home();

    window.scrollTo(0, 0);
}

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
