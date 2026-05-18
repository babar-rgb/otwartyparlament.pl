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
window.loadPozaKadremList = async function () {
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

    const toc = r.struktura_json.spis_tresci || [];
    const sekcje = r.struktura_json.sekcje || [];
    const dp = r.struktura_json.drugi_plan || {};

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

    const sections = sekcje.map((s, idx) => {
        let content = '';

        if (s.typ === 'hero-number') {
            content = `
                <div class="sandbox-layer layer-hero-number">
                    <div class="hero-number-anim">${s.liczba}</div>
                    <p class="hero-text-anim">${s.tekst}</p>
                </div>
            `;
        } else if (s.typ === 'map-points') {
            content = `
                <div class="sandbox-layer layer-map-points">
                    <h3 class="sandbox-q">${s.pytanie}</h3>
                    <div class="map-placeholder">
                        <div class="map-point point-1"></div>
                        <div class="map-point point-2"></div>
                        <div class="map-point point-3"></div>
                    </div>
                    <p class="article-p">${s.tekst}</p>
                </div>
            `;
        } else if (s.typ === 'timeline-votes') {
            content = `
                <div class="sandbox-layer layer-timeline-votes">
                    <h3 class="sandbox-q">${s.pytanie}</h3>
                    <div class="timeline-placeholder">
                        <div class="timeline-node" title="Poseł 1 - Zobacz oświadczenie"></div>
                        <div class="timeline-line"></div>
                        <div class="timeline-node" title="Poseł 2 - Zobacz głosowania"></div>
                        <div class="timeline-line"></div>
                        <div class="timeline-node" title="Poseł 3"></div>
                    </div>
                    <p class="article-p">${s.tekst}</p>
                </div>
            `;
        } else if (s.typ === 'flow-diagram') {
            content = `
                <div class="sandbox-layer layer-flow-diagram">
                    <div class="flow-placeholder">
                        <div class="flow-element">LUKA W PRZEPISACH</div>
                        <div class="flow-plus">+</div>
                        <div class="flow-element">BRAK REJESTRU</div>
                        <div class="flow-plus">+</div>
                        <div class="flow-element">WOLNE SĄDY</div>
                        <div class="flow-arrow">↓</div>
                        <div class="flow-result">ZYSK</div>
                    </div>
                    <p class="article-p">${s.tekst}</p>
                </div>
            `;
        } else if (s.typ === 'sources-list') {
            content = `
                <div class="sandbox-layer layer-sources-list">
                    <details class="sources-details">
                        <summary>[+] ${s.count} ŹRÓDEŁ. ROZWIŃ.</summary>
                        <div class="sources-content">
                            ${s.tekst}<br/><br/>
                            <ul style="padding-left:20px;">
                                <li>API Sejmu - Głosowanie nr 144</li>
                                <li>Oświadczenia majątkowe członków komisji samorządu terytorialnego (2012-2016)</li>
                                <li>Rejestr ksiąg wieczystych (dane zanonimizowane)</li>
                            </ul>
                        </div>
                    </details>
                </div>
            `;
        } else {
            content = `
                <h2 class="section-heading">${s.tytul || s.id}</h2>
                <div class="article-html-content">${s.tekst}</div>
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
            `;
        }

        return `
            <section id="${s.id}" style="margin-bottom:var(--space-3xl);">
                ${content}
            </section>
        `;
    }).join('');

    return `
        <div class="data-view-container pk-detail-layout pk-detail-${r.id}">
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
