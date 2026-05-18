// views/poza_kadrem.js — Widoki raportów analitycznych "Poza Kadrem".
// Dane pobierane z: GET /api/poza-kadrem i GET /api/poza-kadrem/{id}
// Zależy od: api.js (fetchAPI), helpers.js.

templates.szerszyKadr = () => `
    <div class="data-view-container">
        <div class="back-link-minimal" onclick="location.hash='#home'">← POWRÓT</div>
        <div class="pk-header">
            <h1 class="view-title" style="margin:0;">POZA KADREM</h1>
            <span class="pk-series-label">SERIA RAPORTÓW ANALITYCZNYCH</span>
        </div>
        <div id="pk-reports-grid" class="pk-grid">
            <div class="loading-msg">Ładowanie raportów...</div>
        </div>
    </div>
`;

// Wywołane po wyrenderowaniu szerszyKadr() — pobiera raporty z API
window.loadPozaKadremList = async function() {
    const grid = document.getElementById('pk-reports-grid');
    if (!grid) return;

    const raporty = await fetchAPI('poza-kadrem');
    if (!raporty || raporty.length === 0) {
        grid.innerHTML = '<div class="error-msg">Brak raportów w archiwum.</div>';
        return;
    }

    grid.innerHTML = raporty.map((r, idx) => `
        <div class="investigation-entry" onclick="location.hash='#poza-kadrem/${r.id}'" style="cursor:pointer;">
            <div class="pk-report-number">RAPORT ${String(idx + 1).padStart(2, '0')} / 2026</div>
            <h2 class="pk-report-title">${r.tytul}</h2>
            <p class="pk-report-excerpt">${r.struktura_json?.drugi_plan?.opis || r.podtytul}</p>
        </div>
    `).join('');
};

templates.investigationDetail = async (id) => {
    // Renderuj szkielet z loadingiem, potem wypełnij danymi z API
    const container = document.querySelector('.content-area');

    const r = await fetchAPI(`poza-kadrem/${id}`);
    if (!r || !r.struktura_json) {
        return `<div class="data-view-container"><p class="error-msg">Nie znaleziono raportu: ${id}</p></div>`;
    }

    const toc   = r.struktura_json.spis_tresci || [];
    const sekcje = r.struktura_json.sekcje || [];
    const dp    = r.struktura_json.drugi_plan || {};

    const tocItems = toc.map((step, idx) => `
        <div class="sk-mini-step ${idx === 0 ? 'active' : ''} ${idx === 2 ? 'danger' : ''}"
             title="${step.label}"
             onclick="document.getElementById('${step.id}').scrollIntoView({behavior:'smooth'})">
            ${String(idx + 1).padStart(2, '0')}
        </div>
    `).join('');

    const tocNav = toc.map((item, idx) => `
        <div class="toc-item" style="margin-left:${idx * 40}px;">
            <span>${String(idx + 1).padStart(2, '0')}</span>
            <a href="javascript:void(0)" onclick="document.getElementById('${item.id}').scrollIntoView({behavior:'smooth'})">${item.label}</a>
        </div>
    `).join('');

    const sections = sekcje.map((s, idx) => `
        <section id="${s.id}" style="margin-bottom:var(--space-3xl);">
            <h2 class="section-heading">${s.tytul}</h2>
            <p class="article-p">${s.tekst}</p>
            ${idx === 0 && dp.obrazek ? `
                <div class="pk-second-plan">
                    <div class="pk-second-plan-label">[ ${dp.tytul} ]</div>
                    <div class="pk-second-plan-body">
                        <p class="pk-second-plan-text">${dp.opis}</p>
                        <div class="pk-second-plan-image reveal-trigger"
                             style="background-image:url('${dp.obrazek}');">
                            <div class="reveal-overlay"></div>
                        </div>
                    </div>
                </div>
            ` : ''}
        </section>
    `).join('');

    return `
        <div class="data-view-container pk-detail-layout">
            <aside class="pk-aside">
                <div class="back-link-minimal" onclick="location.hash='#poza-kadrem'" style="margin-bottom:var(--space-lg);">← POWRÓT</div>
                <div class="sk-process-map-mini">
                    <div class="sk-mini-line"></div>
                    ${tocItems}
                </div>
            </aside>
            <main>
                <header style="margin-bottom:var(--space-2xl);">
                    <div class="pk-report-subtitle">${r.podtytul}</div>
                    <h1 class="pk-report-hero-title">${r.tytul}</h1>
                    <nav class="cascading-toc">${tocNav}</nav>
                </header>
                <article class="investigation-body">${sections}</article>
                <footer class="pk-footer">
                    <div class="pk-footer-label">DOKUMENTACJA ŹRÓDŁOWA (PDF)</div>
                    <button class="mag-see-mps-btn">POBIERZ ARCHIWUM</button>
                </footer>
            </main>
        </div>
    `;
};
