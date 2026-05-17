// views/mps.js — Widoki posłów: lista klubów, siatka posłów, profil posła.
// Zależy od: helpers.js (formatDatePolish), window.TruthSearch, window.state.

// renderMpCard — globalna, używana też w wyszukiwarce (index.html Alpine)
function renderMpCard(mp) {
    return `
        <div class="mp-card-minimal clickable-mp" data-id="${mp.id}">
            <div class="mp-portrait-wrap">
                <img src="${mp.photo_url || ''}" alt="${mp.name}" class="mp-portrait"
                     onerror="this.src='https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg'">
            </div>
            <h3 class="mp-name">${mp.name}</h3>
        </div>
    `;
}

templates.mps = () => {
    const mps = window.state.data.mps;

    if (!window.state.filters.selectedClub) {
        const clubs = [...new Set(mps.map(m => m.club))].filter(Boolean).sort();
        return `
            <div class="data-view-container">
                <h1 class="view-title">Rejestr Posłów</h1>
                <div class="inline-search-wrap">
                    <input type="text" id="localMpSearch" class="minimal-search-input"
                           placeholder="SZUKAJ POSŁA LUB KLUBU..."
                           value="${window.state.filters.mpSearch}">
                </div>
                <div class="clubs-list">
                    ${window.TruthSearch.searchInList(clubs, window.state.filters.mpSearch).map(c => `
                        <div class="club-item" data-club="${c}">
                            <span class="club-name">${c}</span>
                            <span class="club-arrow">→</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const clubMps = mps.filter(m => m.club === window.state.filters.selectedClub);
    const filtered = window.TruthSearch.searchInList(clubMps, window.state.filters.mpSearch, ['name']);
    return `
        <div class="data-view-container">
            <div class="back-link" id="backToClubs">← POWRÓT</div>
            <h1 class="view-title">${window.state.filters.selectedClub}</h1>
            <div class="mps-grid">${filtered.map(m => renderMpCard(m)).join('')}</div>
        </div>
    `;
};

templates.mpDetail = (mp) => {
    const votingRows = (mp.votingHistory || []).map(v => `
        <div class="mp-vote-row clickable-ledger" data-id="${v.id}">
            <div class="mp-vote-row-date">${formatDatePolish(v.date)}</div>
            <div class="mp-vote-row-title">${v.title}</div>
            <div class="mp-vote-row-choice ${v.choice === 'ZA' ? 'is-za' : 'is-other'}">${v.choice}</div>
        </div>
    `).join('');

    return `
        <div class="data-view-container">
            <div class="back-link" onclick="window.history.back()">← POWRÓT</div>

            <div class="mp-detail-header">
                <div class="mp-hero-portrait">
                    <img src="${mp.photo_url || ''}" alt="${mp.name}"
                         onerror="this.src='https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg'">
                </div>
                <div>
                    <div class="mp-detail-club">${mp.club || 'BRAK KLUBU'}</div>
                    <h1 class="mp-detail-name">${mp.name}</h1>
                    <div class="mp-detail-subtitle">POSEŁ NA SEJM RP</div>
                </div>
            </div>

            <div class="mp-stats-hero">
                <div class="mp-big-stat">
                    <strong>${mp.attendance || '---'}</strong>
                    <span>FREKWENCJA</span>
                </div>
                <div class="mp-big-stat">
                    <strong>---</strong>
                    <span>GŁOSY ODMIENNE</span>
                </div>
                <div class="mp-big-stat">
                    <strong>---</strong>
                    <span>RANKING MAJĄTKU</span>
                </div>
            </div>

            <div>
                <div class="mp-voting-history-title">OSTATNIE GŁOSOWANIA</div>
                <div class="voting-record-list">
                    ${votingRows || `<p class="error-msg">Brak danych o głosowaniach.</p>`}
                </div>
            </div>
        </div>
    `;
};
