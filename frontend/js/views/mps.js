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

    // Widok listy klubów (bez wybranego klubu)
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

    // Widok posłów konkretnego klubu
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
        <div class="mp-vote-item clickable-ledger" data-id="${v.id}"
             style="display:grid;grid-template-columns:120px 1fr 100px;gap:40px;align-items:center;padding:20px 0;border-bottom:1px solid #eee;cursor:pointer;">
            <div style="font-size:11px;font-weight:800;color:#aaa;">${formatDatePolish(v.date)}</div>
            <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;">${v.title}</div>
            <div style="font-size:9px;font-weight:900;letter-spacing:2px;padding:8px 0;text-align:center;border:2px solid #000;${v.choice === 'ZA' ? 'background:#000;color:#fff;' : 'background:#fff;color:#000;'}">${v.choice}</div>
        </div>
    `).join('');

    return `
        <div class="data-view-container">
            <div class="back-link" onclick="window.history.back()">← POWRÓT</div>

            <div style="display:flex;gap:60px;align-items:center;margin-bottom:60px;">
                <div style="width:240px;height:240px;flex-shrink:0;">
                    <img src="${mp.photo_url || ''}" alt="${mp.name}"
                         style="width:100%;height:100%;object-fit:cover;"
                         onerror="this.src='https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg'">
                </div>
                <div>
                    <div style="margin-bottom:15px;font-size:14px;font-weight:800;color:#888;letter-spacing:2px;">${mp.club || 'BRAK KLUBU'}</div>
                    <h1 style="font-family:'Playfair Display',serif;font-size:56px;font-weight:900;margin-bottom:10px;line-height:1;">${mp.name}</h1>
                    <div style="font-size:10px;font-weight:800;color:#999;letter-spacing:2px;text-transform:uppercase;">POSEŁ NA SEJM RP</div>
                </div>
            </div>

            <div style="display:flex;justify-content:space-around;border-top:1px solid #eee;border-bottom:1px solid #eee;padding:60px 0;margin-bottom:80px;text-align:center;">
                <div>
                    <strong style="font-size:36px;font-weight:900;display:block;margin-bottom:5px;">${mp.attendance || '---'}</strong>
                    <span style="font-size:9px;font-weight:800;color:#999;letter-spacing:2px;text-transform:uppercase;">FREKWENCJA</span>
                </div>
                <div>
                    <strong style="font-size:36px;font-weight:900;display:block;margin-bottom:5px;">---</strong>
                    <span style="font-size:9px;font-weight:800;color:#999;letter-spacing:2px;text-transform:uppercase;">GŁOSY ODMIENNE</span>
                </div>
                <div>
                    <strong style="font-size:36px;font-weight:900;display:block;margin-bottom:5px;">---</strong>
                    <span style="font-size:9px;font-weight:800;color:#999;letter-spacing:2px;text-transform:uppercase;">RANKING MAJĄTKU</span>
                </div>
            </div>

            <div>
                <div style="font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:30px;">OSTATNIE GŁOSOWANIA</div>
                <div class="voting-record-list">
                    ${votingRows || `<p style="padding:40px;text-align:center;color:#aaa;">Brak danych o głosowaniach.</p>`}
                </div>
            </div>
        </div>
    `;
};
