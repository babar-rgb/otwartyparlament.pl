function formatDatePolish(dateStr) {
    if (!dateStr) return '---';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

// --- RENDER HELPERS ---

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
    return `
        <div class="mp-card-minimal clickable-mp" data-id="${mp.id}">
            <div class="mp-portrait-wrap">
                <img src="${mp.photo_url || ''}" alt="${mp.name}" class="mp-portrait" onerror="this.src='https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg'">
            </div>
            <h3 class="mp-name">${mp.name}</h3>
        </div>
    `;
}

// --- TEMPLATES ---

const templates = {
    home: () => `
        <section class="hero-section">
            <h1>Politycy liczą na to, że nie sprawdzisz.</h1>
        </section>

        <div class="feed">
            ${state.data.articles.length > 0 ? state.data.articles.map(a => templates.card(a)).join('') : `
                <div style="padding: 40px; text-align: center; font-family: 'Playfair Display', serif; font-size: 20px; color: #aaa;">
                    Brak aktualnych analiz. Czekamy na dane.
                </div>
            `}
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
    votes: () => {
        const query = (state.filters.voteSearch || '').toLowerCase().trim();
        const filtered = query
            ? state.data.votes.filter(v => v.title.toLowerCase().includes(query))
            : state.data.votes;

        return `
            <div class="data-view-container">
                <h1 class="view-title">Głosowania</h1>
                <div class="inline-search-wrap">
                    <input type="text" id="voteSearchInput" class="minimal-search-input" placeholder="SZUKAJ W GŁOSOWANIACH..." value="${state.filters.voteSearch || ''}">
                </div>
                <div class="votes-ledger">
                    ${filtered.map(v => renderLedgerItem(v)).join('')}
                    ${filtered.length === 0 ? `<p style="text-align:center; padding:40px; color:#aaa;">Brak wyników.</p>` : ''}
                </div>
            </div>
        `;
    },
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
    mpDetail: (mp) => {
        return `
            <div class="data-view-container">
                <div class="back-link" style="margin-bottom: 60px; font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #888; cursor: pointer; text-transform: uppercase;" onclick="window.history.back()">← POWRÓT</div>
                
                <div class="mp-detail-header" style="display: flex; gap: 60px; align-items: center; margin-bottom: 60px;">
                    <div class="mp-hero-portrait" style="width: 240px; height: 240px; flex-shrink: 0;">
                        <img src="${mp.photo_url || ''}" alt="${mp.name}" onerror="this.src='https://www.sejm.gov.pl/Sejm10.nsf/photos/000.jpg'">
                    </div>
                    
                    <div class="mp-detail-info">
                        <div class="mp-main-meta" style="margin-bottom: 15px; font-size: 14px; font-weight: 800; color: #888; letter-spacing: 2px;">${mp.club || 'BRAK KLUBU'}</div>
                        <h1 class="mp-main-name" style="font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 900; margin-bottom: 10px; line-height: 1;">${mp.name}</h1>
                        <div class="mp-main-subtitle" style="font-size: 10px; font-weight: 800; color: #999; letter-spacing: 2px; text-transform: uppercase;">POSEŁ NA SEJM RP</div>
                    </div>
                </div>
                
                <div class="mp-stats-hero" style="display: flex; justify-content: space-around; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 60px 0; margin-bottom: 80px; text-align: center;">
                    <div class="mp-big-stat">
                        <strong style="font-size: 36px; font-weight: 900; display: block; margin-bottom: 5px;">${mp.attendance || '---'}</strong>
                        <span style="font-size: 9px; font-weight: 800; color: #999; letter-spacing: 2px; text-transform: uppercase;">FREKWENCJA</span>
                    </div>
                    <div class="mp-big-stat">
                        <strong style="font-size: 36px; font-weight: 900; display: block; margin-bottom: 5px;">---</strong>
                        <span style="font-size: 9px; font-weight: 800; color: #999; letter-spacing: 2px; text-transform: uppercase;">GŁOSY ODMIENNE</span>
                    </div>
                    <div class="mp-big-stat">
                        <strong style="font-size: 36px; font-weight: 900; display: block; margin-bottom: 5px;">---</strong>
                        <span style="font-size: 9px; font-weight: 800; color: #999; letter-spacing: 2px; text-transform: uppercase;">RANKING MAJĄTKU</span>
                    </div>
                </div>
                
                <div class="mp-voting-history">
                    <div class="section-title-brutal" style="font-size: 11px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px;">OSTATNIE GŁOSOWANIA</div>
                    <div class="voting-record-list">
                        ${(mp.votingHistory || []).map(v => `
                            <div class="mp-vote-item clickable-ledger" data-id="${v.id}" style="display: grid; grid-template-columns: 120px 1fr 100px; gap: 40px; align-items: center; padding: 20px 0; border-bottom: 1px solid #eee; cursor: pointer;">
                                <div class="mp-vote-date" style="font-size: 11px; font-weight: 800; color: #aaa;">${formatDatePolish(v.date)}</div>
                                <div class="mp-vote-title" style="font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #000;">${v.title}</div>
                                <div class="mp-vote-choice" style="font-size: 9px; font-weight: 900; letter-spacing: 2px; padding: 8px 0; text-align: center; border: 2px solid #000; ${v.choice === 'ZA' ? 'background: #000; color: #fff;' : 'background: #fff; color: #000;'}">${v.choice}</div>
                            </div>
                        `).join('')}
                        ${(!mp.votingHistory || mp.votingHistory.length === 0) ? `<p style="padding:40px; text-align:center; color:#aaa;">Brak danych o głosowaniach.</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    },
    voteDetail: (v) => {
        const stats = v.results || { yes: 0, no: 0, abstain: 0 };
        return `
            <div class="data-view-container" style="padding-top: 100px;">
                <div class="back-link" style="margin-bottom: 40px; font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #888; cursor: pointer; text-transform: uppercase;" onclick="window.history.back()">← POWRÓT DO LISTY GŁOSOWAŃ</div>
                
                <div class="vote-header-wrap" style="margin-bottom: 80px;">
                    <div class="verdict-badge-big" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; font-size: 12px; font-weight: 900; letter-spacing: 3px; margin-bottom: 40px; text-transform: uppercase;">${v.verdict || 'PRZYJĘTO'}</div>
                    <h1 class="vote-hero-title" style="font-family: 'Playfair Display', serif; font-size: 64px; font-weight: 900; line-height: 1; margin-bottom: 40px; max-width: 1000px; color: #000;">${v.title}</h1>
                    
                    <div class="vote-meta-line" style="display: flex; gap: 40px; border-top: 1px solid #eee; padding-top: 30px; font-size: 10px; font-weight: 800; color: #aaa; letter-spacing: 1px; text-transform: uppercase;">
                        <div>DATA: <span style="color: #000;">${formatDatePolish(v.date)}</span></div>
                        <div>NUMER: <span style="color: #000;">${v.id}</span></div>
                        <div>POSIEDZENIE: <span style="color: #000;">${Math.floor(v.id/1000)}</span></div>
                    </div>
                </div>

                <div class="vote-grand-stats" style="display: flex; gap: 100px; margin-bottom: 100px; border-bottom: 1px solid #eee; padding-bottom: 60px;">
                    <div class="g-stat">
                        <strong style="font-size: 72px; font-weight: 900; display: block; line-height: 1;">${stats.yes}</strong>
                        <span style="font-size: 10px; font-weight: 800; color: #999; letter-spacing: 2px;">ZA</span>
                    </div>
                    <div class="g-stat">
                        <strong style="font-size: 72px; font-weight: 900; display: block; line-height: 1;">${stats.no}</strong>
                        <span style="font-size: 10px; font-weight: 800; color: #999; letter-spacing: 2px;">PRZECIW</span>
                    </div>
                    <div class="g-stat">
                        <strong style="font-size: 72px; font-weight: 900; display: block; line-height: 1;">${stats.abstain}</strong>
                        <span style="font-size: 10px; font-weight: 800; color: #999; letter-spacing: 2px;">WSTRZYMAŁO SIĘ</span>
                    </div>
                </div>

                <div class="club-breakdown-section">
                    <h2 style="font-size: 12px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 50px;">ROZKŁAD GŁOSÓW WG KLUBÓW</h2>
                    <div class="clubs-grid" style="display: grid; grid-template-columns: 1fr 1fr; column-gap: 100px; row-gap: 60px;">
                        ${(v.breakdown || []).map(c => {
                            const total = c.yes + c.no + c.abstain;
                            const hasVotes = total > 0;
                            return `
                                <div class="club-stat-box">
                                    <div class="club-row-meta" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                                        <span style="font-size: 20px; font-weight: 900; letter-spacing: 0px;">${c.club}</span>
                                        <span style="font-size: 10px; font-weight: 800; color: #888;">
                                            <span style="color: #2e7d32;">ZA: ${c.yes}</span> | 
                                            <span style="color: #c62828;">PRZ: ${c.no}</span> | 
                                            <span style="color: #666;">WST: ${c.abstain}</span>
                                        </span>
                                    </div>
                                    <div class="club-bar-wrap" style="height: 8px; background: #f5f5f5; position: relative; overflow: hidden; border-radius: 2px;">
                                        ${hasVotes ? `
                                            <div style="position: absolute; left: 0; top: 0; height: 100%; background: #2e7d32; width: ${(c.yes/total)*100}%"></div>
                                            <div style="position: absolute; left: ${(c.yes/total)*100}%; top: 0; height: 100%; background: #c62828; width: ${(c.no/total)*100}%"></div>
                                            <div style="position: absolute; left: ${((c.yes+c.no)/total)*100}%; top: 0; height: 100%; background: #999; width: ${(c.abstain/total)*100}%"></div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
};
