// router.js — Jedyna odpowiedzialność: obsługa zmiany hash i renderowanie widoku.
// Zależy od: state (window.state), templates (window.views w przyszłości), api.js

function handleRoute() {
    if (!window.state.isLoaded) return;

    const hash = window.location.hash || '#home';
    const mainContent = document.querySelector('.content-area');
    if (!mainContent) return;

    // Zamknij menu Alpine.js przy każdej zmianie trasy
    if (window.Alpine) {
        const data = Alpine.closestRoot(document.body)?._x_dataStack[0];
        if (data) data.closeMenu();
    }

    // --- Routing ---

    if (hash === '#glosowania') {
        mainContent.innerHTML = templates.votes();

    } else if (hash.startsWith('#glosowanie/')) {
        const id = hash.split('/')[1];
        mainContent.innerHTML = `<p class="loading-msg">Ładowanie szczegółów głosowania...</p>`;
        fetchAPI(`votes/${id}`)
            .then(fullVote => {
                window.state.currentVoteVotes = fullVote.individualVotes;
                mainContent.innerHTML = templates.voteDetail(fullVote);
            })
            .catch(() => {
                mainContent.innerHTML = `<p class="error-msg">Nie udało się załadować danych głosowania.</p>`;
            });

    } else if (hash.startsWith('#artykul/')) {
        const id = hash.split('/')[1];
        const article = window.state.data.articles.find(a => a.id == id);
        mainContent.innerHTML = article
            ? templates.articleDetail(article)
            : `<p class="error-msg">Nie znaleziono artykułu.</p>`;

    } else if (hash === '#ustawy') {
        mainContent.innerHTML = templates.processes();

    } else if (hash.startsWith('#poslowie')) {
        const parts = hash.split('/');
        window.state.filters.selectedClub = parts[1] ? decodeURIComponent(parts[1]) : null;
        mainContent.innerHTML = templates.mps();

    } else if (hash.startsWith('#posel/')) {
        const id = hash.split('/')[1];
        mainContent.innerHTML = `<p class="loading-msg">Ładowanie profilu...</p>`;
        fetchAPI(`mps/${id}`)
            .then(fullMp => {
                mainContent.innerHTML = templates.mpDetail(fullMp);
            })
            .catch(() => {
                mainContent.innerHTML = `<p class="error-msg">Nie udało się załadować danych posła.</p>`;
            });

    } else if (hash === '#poza-kadrem') {
        mainContent.innerHTML = templates.szerszyKadr();
        window.loadPozaKadremList(); // pobiera raporty z API i wypełnia grid

    } else if (hash.startsWith('#poza-kadrem/')) {
        const id = hash.split('/')[1];
        mainContent.innerHTML = `<p class="loading-msg">Ładowanie raportu...</p>`;
        templates.investigationDetail(id).then(html => {
            mainContent.innerHTML = html;
        });

    } else {
        mainContent.innerHTML = templates.home();
    }

    window.scrollTo(0, 0);
}
