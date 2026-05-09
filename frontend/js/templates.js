function formatDatePolish(dateStr) {
    if (!dateStr) return '---';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

// --- RENDER HELPERS ---

function renderLedgerItem(v) {
    const stats = v.details_json || v.stats || { yes: 0, no: 0, for: 0, against: 0 };
    const yes = stats.yes || stats.for || 0;
    const no = stats.no || stats.against || 0;
    return `
        <div class="ledger-item clickable-ledger" data-id="${v.id}">
            <div class="ledger-date">${formatDatePolish(v.date)}</div>
            <div class="ledger-content">
                <div class="ledger-topic">${v.topic || 'OGÓLNE'}</div>
                <h3 class="ledger-title">${v.title_clean || v.title}</h3>
                <div class="vote-bar-container-minimal">
                    <div class="vote-bar-segment is-for" style="width: ${(yes/460)*100}%"></div>
                    <div class="vote-bar-segment is-against" style="width: ${(no/460)*100}%"></div>
                </div>
                <div class="ledger-footer">
                    <span class="verdict-badge ${v.verdict === 'PRZYJĘTO' ? 'is-success' : 'is-error'}">${v.verdict || '---'}</span>
                    <span class="vote-numbers">ZA: ${yes} | PRZECIW: ${no}</span>
                </div>
            </div>
        </div>
    `;
}

function renderMpCard(mp) {
    const name = mp.name || `${mp.first_name || ''} ${mp.last_name || ''}`.trim();
    return `
        <div class="mp-card-minimal clickable-mp" data-id="${mp.id}">
            <div class="mp-portrait-wrap">
                <img src="${mp.photo_url || mp.image || ''}" alt="${name}" class="mp-portrait" onerror="this.src='https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg'">
            </div>
            <h3 class="mp-name">${name}</h3>
        </div>
    `;
}

function renderTrendingItem(t) {
    return `
        <div class="trending-row">
            <div class="trending-meta">O TYM PISZE ${t.portals_count || 0} PORTALI</div>
            <h3 class="trending-topic-title">${t.topic}</h3>
            <div class="trending-headlines">
                ${(t.sample_headlines || []).map(h => `<div class="trending-sample">• ${h}</div>`).join('')}
            </div>
        </div>
    `;
}

function renderClubStat(c) {
    const total = c.total || (c.for + c.against + (c.abstained || c.abstain || 0));
    const yesPct = total > 0 ? (c.for / total) * 100 : 0;
    const noPct = total > 0 ? (c.against / total) * 100 : 0;
    const absPct = total > 0 ? ((c.abstained || c.abstain || 0) / total) * 100 : 0;
    
    return `
        <div class="club-stat-item" style="margin-bottom: 20px;">
            <div class="club-stat-info" style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 5px;">
                <div class="club-stat-name" style="font-weight: 900; font-size: 12px; text-transform: uppercase;">${c.club}</div>
                <div class="club-stat-counts" style="font-size: 9px; color: #888; font-weight: 800; letter-spacing: 1px;">
                    <span class="val-za" style="color: #2d5a27;">ZA: ${c.for}</span> | 
                    <span class="val-prz" style="color: #8b0000;">PRZ: ${c.against}</span> | 
                    <span class="val-wstrz" style="color: #777;">WSTRZ: ${c.abstained || c.abstain || 0}</span>
                </div>
            </div>
            <div class="vote-bar-mini" style="height: 6px; background: #f5f5f5; display: flex;">
                <div class="vote-bar-segment is-for" style="width: ${yesPct}%; background: #2d5a27;"></div>
                <div class="vote-bar-segment is-against" style="width: ${noPct}%; background: #8b0000;"></div>
                <div class="vote-bar-segment is-abstain" style="width: ${absPct}%; background: #bbb;"></div>
            </div>
        </div>
    `;
}

// --- TEMPLATES ---

const templates = {
    home: () => `
        <section class="hero-section">
            <h1>Politycy liczą na to, że nie sprawdzisz.</h1>
            <p>Analiza wydarzeń politycznych oparta wyłącznie na twardych danych.</p>
        </section>

        <div class="feed">
            ${state.data.articles.map(a => templates.card(a)).join('')}
        </div>
    `,
    card: (a) => `
        <article class="op-card" data-id="${a.id}">
            <div class="card-header"><div class="meta-box">${a.category}</div></div>
            <div class="card-body">
                <div class="card-image-container">
                    <div class="circular-image">
                        <img src="${a.image}">
                        <div class="mic-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="card-text">
                    <div class="card-date">${a.date}</div>
                    <h2 class="card-title">${a.title}</h2>
                    <p class="card-excerpt">${a.excerpt}</p>
                </div>
            </div>
        </article>
    `,
    votes: () => `
        <div class="data-view-container">
            <h1 class="view-title">Księga Głosowań</h1>
            <div class="votes-ledger">${state.data.votes.map(v => renderLedgerItem(v)).join('')}</div>
        </div>
    `,
    mps: () => {
        const query = state.filters.mpSearch.toLowerCase();
        const mps = state.data.mps;
        
        if (!state.filters.selectedClub) {
            const clubs = [...new Set(mps.map(m => m.club))].filter(Boolean).sort();
            return `
                <div class="data-view-container">
                    <h1 class="view-title">Rejestr Posłów</h1>
                    <div class="inline-search-wrap">
                        <input type="text" id="localMpSearch" class="minimal-search-input" placeholder="SZUKAJ POSŁA LUB KLUBU..." value="${state.filters.mpSearch}">
                    </div>
                    <div class="clubs-list">
                        ${clubs.filter(c => c.toLowerCase().includes(query)).map(c => `
                            <div class="club-item" data-club="${c}">
                                <span class="club-name">${c}</span>
                                <span class="club-arrow">→</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        const filtered = mps.filter(m => m.club === state.filters.selectedClub && (m.name || '').toLowerCase().includes(query));
        return `
            <div class="data-view-container">
                <div class="back-link" id="backToClubs">← POWRÓT</div>
                <h1 class="view-title">${state.filters.selectedClub}</h1>
                <div class="mps-grid">${filtered.map(m => renderMpCard(m)).join('')}</div>
            </div>
        `;
    },
    processes: () => `
        <div class="data-view-container">
            <h1 class="view-title">Projekty Ustaw</h1>
            <div class="votes-ledger">
                ${state.data.processes.map(p => `
                    <div class="ledger-item clickable-process" data-id="${p.id}">
                        <div class="ledger-date">DRUK NR ${p.number}</div>
                        <div class="ledger-content">
                            <div class="ledger-topic">${p.type}</div>
                            <h3 class="ledger-title">${p.title}</h3>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `,
    voteDetail: (v) => {
        const stats = v.details_json || v.stats || { yes: 0, no: 0, abstain: 0, for: 0, against: 0, abstained: 0 };
        const yes = stats.yes || stats.for || 0;
        const no = stats.no || stats.against || 0;
        const abstain = stats.abstain || stats.abstained || 0;

        return `
            <div class="data-view-container">
                <div style="display: flex; align-items: center; gap: 30px; margin-bottom: 30px; justify-content: flex-start;">
                    <div class="back-link" style="margin-bottom: 0; font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #888; cursor: pointer; text-transform: uppercase;" onclick="window.history.back()">← POWRÓT DO LISTY GŁOSOWAŃ</div>
                    
                    <div class="vote-verdict-large ${v.verdict === 'PRZYJĘTO' ? 'is-success' : 'is-error'}" style="margin-bottom: 0; padding: 10px 30px; font-size: 12px;">
                        ${v.verdict || 'PRZYJĘTO'}
                    </div>
                </div>
                
                <h1 class="vote-main-title">${v.title_clean || v.title || 'Szczegóły Głosowania'}</h1>
                
                <div class="vote-meta-grid">
                    <div class="v-meta"><span>DATA:</span> ${v.date}</div>
                    <div class="v-meta"><span>NUMER:</span> ${v.voteNumber || '---'}</div>
                    <div class="v-meta"><span>POSIEDZENIE:</span> ${v.sitting || '56'}</div>
                </div>

                <div class="vote-grand-total" style="margin-top: 50px; margin-bottom: 60px;">
                    <div class="vote-labels-giant" style="display: flex; justify-content: space-between; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 30px; padding-top: 10px;">
                        <div class="v-label is-for" style="flex: 1;">
                            <strong style="color: #000; font-size: 28px; display: block; margin-bottom: 5px;">${yes}</strong>
                            <span style="color: #888; font-size: 9px; font-weight: 800; letter-spacing: 2px;">ZA</span>
                        </div>
                        <div class="v-label is-against" style="flex: 1;">
                            <strong style="color: #000; font-size: 28px; display: block; margin-bottom: 5px;">${no}</strong>
                            <span style="color: #888; font-size: 9px; font-weight: 800; letter-spacing: 2px;">PRZECIW</span>
                        </div>
                        <div class="v-label is-abstain" style="flex: 1;">
                            <strong style="color: #000; font-size: 28px; display: block; margin-bottom: 5px;">${abstain}</strong>
                            <span style="color: #888; font-size: 9px; font-weight: 800; letter-spacing: 2px;">WSTRZYMAŁO SIĘ</span>
                        </div>
                    </div>
                </div>

                <div class="vote-clubs-breakdown">
                    <div class="section-title-brutal" style="margin-bottom: 30px;">ROZKŁAD GŁOSÓW WG KLUBÓW</div>
                    <div class="club-stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px 50px;">
                        ${(v.clubBreakdown || v.club_breakdown || []).map(c => renderClubStat(c)).join('')}
                    </div>
                </div>
                
                ${(v.aiSummary && v.aiSummary.length > 0) ? `
                <div class="vote-analysis-calm">
                    <h3>ANALIZA AI (FILTR SPOKOJU)</h3>
                    <div class="ai-summary-text">
                        <ul style="list-style: none; padding: 0;">
                            ${v.aiSummary.map(s => `<li style="margin-bottom: 10px; position: relative; padding-left: 20px;"><span style="position: absolute; left: 0; color: #ccc;">—</span>${s}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    },
    mpDetail: (mp) => {
        const name = mp.name || `${mp.first_name || ''} ${mp.last_name || ''}`.trim();
        const fallbackImg = "https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg";
        
        return `
            <div class="data-view-container">
                <div class="back-link" style="margin-bottom: 60px; font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #888; cursor: pointer; text-transform: uppercase; display: inline-block;" onclick="window.history.back()">← POWRÓT DO LISTY POSŁÓW</div>
                
                <div class="mp-detail-header" style="display: flex; gap: 60px; align-items: center; margin-bottom: 60px;">
                    <div class="mp-hero-portrait" style="width: 240px; height: 240px; flex-shrink: 0;">
                        <img src="${mp.photo_url || mp.image || fallbackImg}" alt="${name}" onerror="this.src='${fallbackImg}'">
                    </div>
                    
                    <div class="mp-detail-info">
                        <div class="mp-main-meta" style="margin-bottom: 15px; font-size: 14px; font-weight: 800; color: #888; letter-spacing: 2px;">${mp.club || 'Brak Klubu'}</div>
                        <h1 class="mp-main-name" style="font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 900; margin-bottom: 10px; line-height: 1;">${name}</h1>
                        <div class="mp-main-subtitle" style="font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 800; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px;">ZAWÓD: ${mp.district || mp.education || 'POSEŁ NA SEJM RP'}</div>
                        
                        <div class="mp-contact-row" style="display: flex; gap: 15px; align-items: center;">
                            <div class="mp-contact-box" style="border: 1px solid #eee; padding: 12px 20px; font-size: 11px; font-weight: 700;">${mp.email || 'brak@sejm.pl'}</div>
                            <div class="mp-social-icon" style="width: 40px; height: 40px; border: 1px solid #eee; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mp-stats-hero" style="display: flex; justify-content: space-around; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 60px 0; margin-bottom: 80px; text-align: center;">
                    <div class="mp-big-stat">
                        <strong style="font-size: 36px; font-weight: 900; display: block; margin-bottom: 5px;">${mp.attendance || '99.24%'}</strong>
                        <span style="font-size: 9px; font-weight: 800; color: #999; letter-spacing: 2px; text-transform: uppercase;">FREKWENCJA</span>
                    </div>
                    <div class="mp-big-stat">
                        <strong style="font-size: 36px; font-weight: 900; display: block; margin-bottom: 5px;">${mp.consistency || '4'}</strong>
                        <span style="font-size: 9px; font-weight: 800; color: #999; letter-spacing: 2px; text-transform: uppercase;">GŁOSY ODMIENNE</span>
                    </div>
                    <div class="mp-big-stat">
                        <strong class="is-text" style="font-size: 24px; font-weight: 800; display: block; margin-bottom: 15px; margin-top: 6px;">POZA TOP 100</strong>
                        <span style="font-size: 9px; font-weight: 800; color: #999; letter-spacing: 2px; text-transform: uppercase;">RANKING MAJĄTKU</span>
                    </div>
                </div>
                
                <div class="mp-voting-history">
                    <div class="section-title-brutal" style="font-size: 11px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 0;">OSTATNIE GŁOSOWANIA</div>
                    <div style="border-top: 1px solid #eee; margin-bottom: 40px;"></div>
                    
                    <div class="voting-record-list">
                        ${(mp.votingHistory || mp.recent_votes || [
                            {date: '2025-12-05', title: 'Pkt. 29 Sprawozdanie Komisji o wniosku Prezydenta Rzeczypospolitej Polskiej o ponowne rozpatrzenie ustawy z dnia 7 listopada 2025 r. o rynku kryptoaktywów (druki nr 2048 i 2059)', choice: 'ZA'},
                            {date: '2025-12-05', title: 'Pkt. 28 Informacja Prezesa Rady Ministrów dotycząca spraw z zakresu bezpieczeństwa Państwa', choice: 'PRZECIW'},
                            {date: '2025-12-04', title: 'Pkt. 24 Zmiany w składach osobowych komisji sejmowych (druk nr 2045)', choice: 'ZA'}
                        ]).map(v => `
                            <div class="mp-vote-item clickable-ledger" data-id="${v.id || v.vote_id || '560032'}" style="display: grid; grid-template-columns: 120px 1fr 100px; gap: 40px; align-items: center; padding: 30px 15px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; margin: 0 -15px;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='transparent'">
                                <div class="mp-vote-date" style="font-size: 11px; font-weight: 800; color: #aaa;">${v.date}</div>
                                <div class="mp-vote-title" style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; line-height: 1.4; color: #000;">${v.title}</div>
                                <div class="mp-vote-choice ${v.choice === 'ZA' ? 'is-for' : v.choice === 'PRZECIW' ? 'is-against' : 'is-abstain'}" style="font-size: 9px; font-weight: 900; letter-spacing: 2px; padding: 8px 0; text-align: center; border: 2px solid #000; text-transform: uppercase; ${v.choice === 'ZA' ? 'background: #000; color: #fff;' : 'background: #fff; color: #000;'}">${v.choice}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
};
