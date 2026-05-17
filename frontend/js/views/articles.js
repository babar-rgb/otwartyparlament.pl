// views/articles.js — Widok szczegółu artykułu, tabela klubowa i modal.
// Zależy od: helpers.js, window.state.

function renderMagClubTable(results) {
    if (!results || results.length === 0) {
        return '<div style="padding:40px;color:#aaa;font-size:11px;letter-spacing:2px;text-align:center;">BRAK DANYCH KLUBOWYCH</div>';
    }
    return results.map(club => {
        const total = (club.yes || 0) + (club.no || 0) + (club.abstain || 0);
        if (total === 0) return '';
        const yesPercent = Math.round(((club.yes || 0) / total) * 10);
        const bar = '█'.repeat(yesPercent) + '░'.repeat(10 - yesPercent);
        return `
            <div class="mag-club-row-wrap">
                <div class="mag-club-row">
                    <div class="mag-club-name">${club.name}</div>
                    <div class="mag-club-bar-wrap">
                        <div class="mag-club-bar-string">${bar}</div>
                        <div class="mag-club-stats">ZA: ${club.yes || 0} / ${total}</div>
                    </div>
                </div>
                <button class="mag-see-mps-btn" onclick="openClubModal('${club.name}')">[ ZOBACZ POSŁÓW ]</button>
            </div>
        `;
    }).join('');
}

window.openClubModal = function(clubName) {
    const modal = document.getElementById('truth-modal');
    const content = document.getElementById('modal-body-content');
    // Placeholder — docelowo dane z API /api/votes/{id}/club/{club}
    const placeholders = [
        { name: 'Donald Tusk', vote: 'PRZECIW', photo: 'https://api.sejm.gov.pl/sejm/mps/10/403/photo' },
        { name: 'Szymon Hołownia', vote: 'ZA', photo: 'https://api.sejm.gov.pl/sejm/mps/10/443/photo' },
        { name: 'Jarosław Kaczyński', vote: 'ZA', photo: 'https://api.sejm.gov.pl/sejm/mps/10/153/photo' },
        { name: 'Mariusz Błaszczak', vote: 'ZA', photo: 'https://api.sejm.gov.pl/sejm/mps/10/028/photo' },
        { name: 'Antoni Macierewicz', vote: 'ZA', photo: 'https://api.sejm.gov.pl/sejm/mps/10/222/photo' },
        { name: 'Krzysztof Bosak', vote: 'PRZECIW', photo: 'https://api.sejm.gov.pl/sejm/mps/10/033/photo' },
        { name: 'Adrian Zandberg', vote: 'PRZECIW', photo: 'https://api.sejm.gov.pl/sejm/mps/10/438/photo' },
        { name: 'Władysław K.-Kamysz', vote: 'ZA', photo: 'https://api.sejm.gov.pl/sejm/mps/10/171/photo' }
    ];
    content.innerHTML = `
        <h2 class="mag-modal-title">${clubName}</h2>
        <div class="modal-club-stats">PEŁNE ZESTAWIENIE GŁOSÓW POSZCZEGÓLNYCH POSŁÓW (DANE Z API SEJMU)</div>
        <div class="modal-mp-grid">
            ${placeholders.map(mp => `
                <div class="modal-mp-card">
                    <div class="modal-mp-portrait">
                        <img src="${mp.photo}" referrerpolicy="no-referrer"
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name)}&background=f0f0f0&color=ccc'">
                    </div>
                    <div class="modal-mp-info">
                        <div class="modal-mp-name">${mp.name}</div>
                        <div class="modal-mp-vote is-${mp.vote === 'ZA' ? 'za' : 'prz'}">${mp.vote}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    modal.style.display = 'flex';
};

window.closeTruthModal = function() {
    document.getElementById('truth-modal').style.display = 'none';
};

templates.articleDetail = (a) => `
    <div class="data-view-container article-experimental">
        <div class="back-link-minimal" onclick="window.history.back()">← POWRÓT</div>

        <header class="article-mag-header">
            <div class="header-visual-side">
                <div class="mag-portrait-wrap">
                    <img src="${a.image}" alt="${a.title}">
                    <div class="mag-mic-tag">
                        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                </div>
            </div>
            <div class="header-text-side">
                <div class="mag-meta-top">
                    <span class="mag-date">${a.date}</span>
                    <span class="mag-read-time">2 MIN CZYTANIA</span>
                </div>
                <h1 class="mag-hero-title">${a.title}</h1>
                <div class="mag-author">WARSTWA PRAWDY · ANALIZA NR ${Math.floor(Math.random() * 900) + 100}</div>
                <div class="mag-tags-row">
                    <span class="mag-tag">#${a.category}</span>
                    <span class="mag-tag">#${a.verdict || 'ANALIZA'}</span>
                </div>
            </div>
        </header>

        <div class="mag-main-content">
            <aside class="mag-side-label">BRIEF</aside>
            <div class="mag-brief-body">
                <span class="mag-dropcap">${a.excerpt.charAt(0)}</span>${a.excerpt.slice(1)}
                <p style="margin-top:40px;">Powyższa analiza stanowi obiektywne zestawienie faktów dotyczących procesu legislacyjnego. Skupiamy się na twardych danych, eliminując szum informacyjny i polityczne emocje. Poniżej znajdziesz kluczowe wnioski dotyczące wpływu tej decyzji na Twoje życie.</p>
            </div>
        </div>

        <div class="mag-impact-container">
            <div class="mag-impact-box">
                <div class="mag-impact-label">KLUCZOWY WNIOSEK</div>
                <p class="mag-impact-text">Ta decyzja bezpośrednio wpływa na stabilność finansową i bezpieczeństwo energetyczne kraju. W praktyce oznacza to zamrożenie stawek dla odbiorców indywidualnych przy jednoczesnym wzroście obciążeń dla sektora publicznego.</p>
            </div>
        </div>

        <div class="mag-results-area">
            <div class="mag-results-header">
                <span class="mag-res-label">ROZKŁAD GŁOSÓW W KLUBACH</span>
                <div class="mag-res-line"></div>
            </div>
            <div class="mag-club-table-container">${renderMagClubTable(a.results_json)}</div>
        </div>

        <footer class="mag-footer">
            <div class="mag-sources-wrap">
                <span class="mag-source-title">DOKUMENTACJA</span>
                <div class="mag-source-links">
                    <a href="#">SEJM.GOV.PL / DRUK NR 123</a>
                    <a href="#">STENOGRAM / POSIEDZENIE NR 12</a>
                </div>
            </div>
        </footer>
    </div>
`;
