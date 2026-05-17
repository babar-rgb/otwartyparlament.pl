// views/votes.js — Widoki głosowań: lista, szczegół, wynik posła.
// Zależy od: helpers.js (formatDatePolish), window.TruthSearch, window.state.

function renderLedgerItem(v) {
    const stats = v.results_json || { yes: 0, no: 0, abstain: 0 };
    const yes = stats.yes || 0;
    const no = stats.no || 0;
    return `
        <div class="ledger-item clickable-ledger" data-id="${v.id}">
            <div class="ledger-date">${formatDatePolish(v.date)}</div>
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
    const filtered = window.TruthSearch.searchInList(
        window.state.data.votes, window.state.filters.voteSearch, ['title', 'topic']
    );
    return `
        <div class="data-view-container">
            <h1 class="view-title">Głosowania</h1>
            <div class="inline-search-wrap">
                <input type="text" id="voteSearchInput" class="minimal-search-input"
                       placeholder="SZUKAJ W GŁOSOWANIACH..."
                       value="${window.state.filters.voteSearch || ''}">
            </div>
            <div class="votes-ledger">
                ${filtered.map(v => renderLedgerItem(v)).join('')}
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
                <div class="club-row-meta" style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;">
                    <span style="font-size:20px;font-weight:900;">${c.club}</span>
                    <span style="font-size:10px;font-weight:800;color:#888;">
                        <span style="color:#2e7d32;">ZA: ${c.yes}</span> |
                        <span style="color:#c62828;">PRZ: ${c.no}</span> |
                        <span style="color:#666;">WST: ${c.abstain}</span>
                    </span>
                </div>
                <div style="height:8px;background:#f5f5f5;position:relative;overflow:hidden;border-radius:2px;">
                    ${hw ? `<div style="position:absolute;left:0;top:0;height:100%;background:#2e7d32;width:${(c.yes/total)*100}%"></div>
                            <div style="position:absolute;left:${(c.yes/total)*100}%;top:0;height:100%;background:#c62828;width:${(c.no/total)*100}%"></div>
                            <div style="position:absolute;left:${((c.yes+c.no)/total)*100}%;top:0;height:100%;background:#999;width:${(c.abstain/total)*100}%"></div>` : ''}
                </div>
            </div>`;
    }).join('');

    return `
        <div class="data-view-container">
            <div class="back-link" onclick="window.history.back()">← POWRÓT DO LISTY GŁOSOWAŃ</div>
            <div style="margin-bottom:80px;">
                <div style="display:inline-block;background:#000;color:#fff;padding:12px 25px;font-size:12px;font-weight:900;letter-spacing:3px;margin-bottom:40px;text-transform:uppercase;">${v.verdict || 'PRZYJĘTO'}</div>
                <h1 style="font-family:'Playfair Display',serif;font-size:64px;font-weight:900;line-height:1;margin-bottom:40px;max-width:1000px;">${v.title}</h1>
                <div style="display:flex;gap:40px;border-top:1px solid #eee;padding-top:30px;font-size:10px;font-weight:800;color:#aaa;letter-spacing:1px;text-transform:uppercase;">
                    <div>DATA: <span style="color:#000;">${formatDatePolish(v.date)}</span></div>
                    <div>NUMER: <span style="color:#000;">${v.id}</span></div>
                    <div>POSIEDZENIE: <span style="color:#000;">${Math.floor(v.id / 1000)}</span></div>
                </div>
            </div>
            <div style="display:flex;gap:100px;margin-bottom:100px;border-bottom:1px solid #eee;padding-bottom:60px;">
                <div><strong style="font-size:72px;font-weight:900;display:block;line-height:1;">${stats.yes}</strong><span style="font-size:10px;font-weight:800;color:#999;letter-spacing:2px;">ZA</span></div>
                <div><strong style="font-size:72px;font-weight:900;display:block;line-height:1;">${stats.no}</strong><span style="font-size:10px;font-weight:800;color:#999;letter-spacing:2px;">PRZECIW</span></div>
                <div><strong style="font-size:72px;font-weight:900;display:block;line-height:1;">${stats.abstain}</strong><span style="font-size:10px;font-weight:800;color:#999;letter-spacing:2px;">WSTRZYMAŁO SIĘ</span></div>
            </div>
            <div>
                <h2 style="font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:20px;margin-bottom:50px;">ROZKŁAD GŁOSÓW WG KLUBÓW</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;column-gap:100px;row-gap:60px;">${clubRows}</div>
            </div>
            <div style="margin-top:100px;border-top:2px solid #000;padding-top:60px;">
                <h2 style="font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;margin-bottom:30px;">SPRAWDŹ GŁOS KONKRETNEGO POSŁA</h2>
                <input type="text" id="mpVoteSearchInput" class="minimal-search-input"
                       placeholder="WPISZ NAZWISKO POSŁA..."
                       style="width:100%;border:none;border-bottom:1px solid #eee;padding:20px 0;font-family:'Playfair Display',serif;font-size:24px;outline:none;">
                <div id="mpVoteSearchResults" style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;"></div>
            </div>
        </div>
    `;
};

templates.renderMpVoteResult = (m) => {
    const map = { "YES": "ZA", "NO": "PRZECIW", "ABSTAIN": "WSTRZYMAŁ SIĘ", "ABSENT": "NIEOBECNY" };
    const choice = map[m.choice] || m.choice;
    return `
        <div class="mp-result-card clickable-mp" data-id="${m.id}" style="display:flex;gap:20px;align-items:center;padding:20px;background:#fafafa;border:1px solid #eee;cursor:pointer;">
            <div style="width:60px;height:60px;border-radius:50%;overflow:hidden;background:#eee;">
                <img src="${m.photo}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg'">
            </div>
            <div style="flex:1;">
                <div style="font-size:9px;font-weight:800;color:#888;text-transform:uppercase;">${m.club}</div>
                <div style="font-size:16px;font-weight:900;">${m.name}</div>
            </div>
            <div style="padding:10px 20px;border:2px solid #000;font-size:11px;font-weight:900;${choice === 'ZA' ? 'background:#000;color:#fff;' : 'background:#fff;color:#000;'}">${choice}</div>
        </div>
    `;
};
