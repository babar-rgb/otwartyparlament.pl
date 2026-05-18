// views/votes.js — Widoki głosowań: lista, szczegół, wynik posła.
// Zależy od: helpers.js (formatDatePolish), window.TruthSearch, window.state.

function renderLedgerItem(v, isPinned = false) {
    const stats = v.results_json || { yes: 0, no: 0, abstain: 0 };
    const yes = stats.yes || 0;
    const no = stats.no || 0;
    const pinnedBadge = isPinned ? `<span style="font-size:8px; font-weight:900; background:#000; color:#fff; padding:2px 5px; margin-left:10px; vertical-align:middle; letter-spacing:1px;">PRZYPIĘTE | OPRACOWANE</span>` : '';
    return `
        <div class="ledger-item clickable-ledger" data-id="${v.id}">
            <div class="ledger-date">${formatDatePolish(v.date)}${pinnedBadge}</div>
            <div class="ledger-content">
                <div class="ledger-topic">${v.topic || 'SEJM'}</div>
                <h3 class="ledger-title">${v.title}</h3>
                <div class="vote-bar-container-minimal">
                    <div class="vote-bar-segment is-for" style="width: ${(yes / 460) * 100}%"></div>
                    <div class="vote-bar-segment is-against" style="width: ${(no / 460) * 100}%"></div>
                </div>
                <div class="ledger-footer">
                    <span class="verdict-badge ${v.verdict === 'PRZYJĘTO' ? 'is-success' : 'is-error'}">${v.verdict || '---'}</span>
                    <span class="vote-numbers">ZA: ${yes} | PRZECIW: ${no}</span>
                </div>
            </div>
        </div>
    `;
}

templates.votes = () => {
    let filtered = window.TruthSearch.searchInList(
        window.state.data.votes, window.state.filters.voteSearch, ['title', 'topic', 'id']
    );

    // Przypinanie wybranego głosowania na szczyt listy (jeśli brak wyszukiwania)
    if (!window.state.filters.voteSearch || window.state.filters.voteSearch.trim() === '') {
        const pinnedIndex = filtered.findIndex(v => v.id === 56001);
        if (pinnedIndex > -1) {
            const pinnedVote = filtered.splice(pinnedIndex, 1)[0];
            filtered.unshift(pinnedVote);
        }
    }
    return `
        <div class="data-view-container">
            <h1 class="view-title">Głosowania</h1>
            <div class="inline-search-wrap">
                <input type="text" id="voteSearchInput" class="minimal-search-input"
                       placeholder="SZUKAJ W GŁOSOWANIACH..."
                       value="${window.state.filters.voteSearch || ''}">
            </div>
            <div class="votes-ledger">
                ${filtered.map((v, i) => renderLedgerItem(v, !window.state.filters.voteSearch && i === 0 && v.id === 56001)).join('')}
                ${filtered.length === 0 ? `<p style="text-align:center;padding:40px;color:#aaa;">Brak wyników.</p>` : ''}
            </div>
        </div>
    `;
};

templates.voteDetail = (v) => {
    const stats = v.results || { yes: 0, no: 0, abstain: 0 };
    const clubRows = (v.breakdown || []).map(c => {
        const total = c.yes + c.no + c.abstain;
        const hw = total > 0;
        return `
            <div class="club-stat-box">
                <div class="club-stat-box-meta">
                    <span class="club-stat-box-name">${c.club}</span>
                    <span class="club-stat-box-numbers">
                        <span style="color:var(--color-yes);">ZA: ${c.yes}</span> |
                        <span style="color:var(--color-no);">PRZ: ${c.no}</span> |
                        <span style="color:var(--color-abstain);">WST: ${c.abstain}</span>
                    </span>
                </div>
                <div class="club-bar">
                    ${hw ? `
                        <div class="club-bar-yes"  style="width:${(c.yes/total)*100}%"></div>
                        <div class="club-bar-no"   style="left:${(c.yes/total)*100}%;width:${(c.no/total)*100}%"></div>
                        <div class="club-bar-abst" style="left:${((c.yes+c.no)/total)*100}%;width:${(c.abstain/total)*100}%"></div>
                    ` : ''}
                </div>
            </div>`;
    }).join('');

    return `
        <div class="data-view-container">
            <div class="back-link" onclick="window.history.back()">← POWRÓT DO LISTY GŁOSOWAŃ</div>

            <div style="margin-bottom:var(--space-2xl);">
                <div class="vote-verdict-badge">${v.verdict || 'PRZYJĘTO'}</div>
                <h1 class="vote-hero-title">${v.title}</h1>
                <div class="vote-meta-line">
                    <div>DATA: <span>${formatDatePolish(v.date)}</span></div>
                    <div>NUMER: <span>${v.id}</span></div>
                    <div>POSIEDZENIE: <span>${Math.floor(v.id / 1000)}</span></div>
                </div>
            </div>

            <div class="vote-grand-stats">
                <div class="g-stat">
                    <strong>${stats.yes}</strong>
                    <span>ZA</span>
                </div>
                <div class="g-stat">
                    <strong>${stats.no}</strong>
                    <span>PRZECIW</span>
                </div>
                <div class="g-stat">
                    <strong>${stats.abstain}</strong>
                    <span>WSTRZYMAŁO SIĘ</span>
                </div>
            </div>

            ${(v.pros && v.pros.length) || (v.cons && v.cons.length) ? `
                <div class="vote-pros-cons-grid">
                    <div class="pros-cons-box is-pros">
                        <div class="pros-cons-title">DLACZEGO ZA? <span>(Zalety)</span></div>
                        <ul class="pros-cons-list">
                            ${(v.pros || []).map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="pros-cons-box is-cons">
                        <div class="pros-cons-title">DLACZEGO PRZECIW? <span>(Wady)</span></div>
                        <ul class="pros-cons-list">
                            ${(v.cons || []).map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            ` : ''}

            <div>
                <h2 class="clubs-breakdown-title">ROZKŁAD GŁOSÓW WG KLUBÓW</h2>
                <div class="clubs-breakdown-grid">${clubRows}</div>
            </div>

            <div class="mp-vote-search-section">
                <h2 class="mp-vote-search-title">SPRAWDŹ GŁOS KONKRETNEGO POSŁA</h2>
                <input type="text" id="mpVoteSearchInput" class="mp-vote-search-input"
                       placeholder="WPISZ NAZWISKO POSŁA...">
                <div id="mpVoteSearchResults" class="mp-vote-results-grid"></div>
            </div>
        </div>
    `;
};

templates.renderMpVoteResult = (m) => {
    const map = { "YES": "ZA", "NO": "PRZECIW", "ABSTAIN": "WSTRZYMAŁ SIĘ", "ABSENT": "NIEOBECNY" };
    const choice = map[m.choice] || m.choice;
    return `
        <div class="mp-result-card clickable-mp" data-id="${m.id}">
            <div class="mp-result-photo">
                <img src="${m.photo}" onerror="this.src='https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg'">
            </div>
            <div class="mp-result-info">
                <div class="mp-result-club">${m.club}</div>
                <div class="mp-result-name">${m.name}</div>
            </div>
            <div class="mp-result-choice ${choice === 'ZA' ? 'is-za' : 'is-other'}">${choice}</div>
        </div>
    `;
};
