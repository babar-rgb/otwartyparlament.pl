// views/poza_kadrem.js — Widoki raportów analitycznych "Poza Kadrem".
// Zależy od: helpers.js. Dane raportów tymczasowo hardkodowane (TODO: backend/models/report.py).

const REPORTS = {
    'kobalt': {
        title: 'ANALIZA ŁAŃCUCHA DOSTAW KOBALTU',
        subtitle: 'POZA KADREM / RAPORT 01',
        image: 'brain/0ad6d0e8-294a-4318-bca4-9f5af2ac0597/kobalt_mine_brutalism_1778603263113.png',
        toc: [
            { id: 'sec-1', label: 'GENEZA I TRANSFORMACJA ENERGETYCZNA' },
            { id: 'sec-2', label: 'MECHANIZMY REGULACYJNE UE' },
            { id: 'sec-3', label: 'RZECZYWISTOŚĆ WYDOBYWCZA (DR KONGA)' },
            { id: 'sec-4', label: 'UZALEŻNIENIE GEOPOLITYCZNE I WNIOSKI' }
        ],
        sections: [
            { id: 'sec-1', title: '01 / GENEZA', text: 'Porozumienie Paryskie wyznaczyło kierunek. Dekarbonizacja transportu stała się priorytetem. Głównym narzędziem tej zmiany ogłoszono pojazd elektryczny (BEV).' },
            { id: 'sec-2', title: '02 / REGULACJA', text: 'Pakiet "Fit for 55" przyspieszył popyt. Dyrektywy unijne, choć rygorystyczne w kwestii emisji, pozostają elastyczne w obszarze łańcuchów dostaw.' },
            { id: 'sec-3', title: '03 / FAKTY', text: '70% kobaltu pochodzi z Konga. Analiza 1420 dokumentów wykazuje mieszanie surowca nieformalnego z legalnym urobkiem na etapie rafinacji.' },
            { id: 'sec-4', title: '04 / WNIOSKI', text: 'Uzależnienie od Rosji zamieniamy na uzależnienie od Chin. Ekologia stała się polem gry geopolitycznej.' }
        ],
        secondPlan: {
            label: 'DRUGI PLAN',
            text: 'Zestawienie oficjalnych kampanii UE promujących czysty transport z rzeczywistością kopalń rzemieślniczych.',
            image: 'brain/0ad6d0e8-294a-4318-bca4-9f5af2ac0597/kobalt_mine_brutalism_1778603263113.png'
        }
    },
    'edukacja': {
        title: 'REFORMA SZKOLNICTWA: MODERNIZACJA CZY FASADA?',
        subtitle: 'POZA KADREM / RAPORT 02',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=1200&auto=format&fit=crop',
        toc: [
            { id: 'sec-1', label: 'GENEZA: CYFROWA SZKOŁA 2026' },
            { id: 'sec-2', label: 'MECHANIZMY: ZMIANY PROGRAMOWE' },
            { id: 'sec-3', label: 'FAKTY: KRYZYS KADROWY I PSYCHOLOGICZNY' },
            { id: 'sec-4', label: 'WNIOSKI: KOSZT ZMIANY POKOLENIOWEJ' }
        ],
        sections: [
            { id: 'sec-1', title: '01 / GENEZA', text: 'Rządowy program "Cyfrowa Szkoła 2026" zakładał pełną digitalizację placówek. Tablety dla każdego ucznia i szybki internet miały być odpowiedzią na wyzwania przyszłości.' },
            { id: 'sec-2', title: '02 / REGULACJA', text: 'Nowelizacja ustawy o systemie oświaty wprowadziła drastyczne cięcia w podstawie programowej, argumentując to "odchudzeniem" bagażu wiedzy.' },
            { id: 'sec-3', title: '03 / FAKTY', text: 'Dane z 16 kuratoriów: w Polsce brakuje obecnie 20 000 nauczycieli. Czas oczekiwania na psychologa szkolnego wzrósł o 300% w ciągu dwóch lat.' },
            { id: 'sec-4', title: '04 / WNIOSKI', text: 'Inwestycje w sprzęt (hardware) dominują nad inwestycją w kapitał ludzki (software). Reforma stwarza iluzję nowoczesności, podczas gdy systemowa tkanka ulega degradacji.' }
        ],
        secondPlan: {
            label: 'DRUGI PLAN',
            text: 'Oficjalny przekaz o "najnowocześniejszej szkole w regionie" zderza się z faktem, że w wielu placówkach fizyki uczą emerytowani poloniści.',
            image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=500&auto=format&fit=crop'
        }
    }
};

templates.szerszyKadr = () => `
    <div class="data-view-container">
        <div class="back-link-minimal" onclick="location.hash='#home'">← POWRÓT</div>
        <div class="pk-header">
            <h1 class="view-title" style="margin:0;">POZA KADREM</h1>
            <span class="pk-series-label">SERIA RAPORTÓW ANALITYCZNYCH</span>
        </div>
        <div class="pk-grid">
            <div class="investigation-entry" onclick="location.hash='#poza-kadrem/kobalt'" style="cursor:pointer;">
                <div class="pk-report-number">RAPORT 01 / 2026</div>
                <h2 class="pk-report-title">ANALIZA ŁAŃCUCHA DOSTAW KOBALTU</h2>
                <p class="pk-report-excerpt">Dokumentacja dotycząca procesów wydobywczych w DR Konga oraz ich korelacji z unijnymi dyrektywami transportowymi.</p>
            </div>
            <div class="investigation-entry" onclick="location.hash='#poza-kadrem/edukacja'" style="cursor:pointer;">
                <div class="pk-report-number">RAPORT 02 / 2026</div>
                <h2 class="pk-report-title">REFORMA SZKOLNICTWA: MODERNIZACJA CZY FASADA?</h2>
                <p class="pk-report-excerpt">Analiza wpływu programu "Cyfrowa Szkoła 2026" na realną kondycję polskiej oświaty i braki kadrowe.</p>
            </div>
        </div>
    </div>
`;

templates.investigationDetail = (id) => {
    const report = REPORTS[id] || REPORTS['kobalt'];

    const tocItems = report.toc.map((step, idx) => `
        <div class="sk-mini-step ${idx === 0 ? 'active' : ''} ${idx === 2 ? 'danger' : ''}"
             title="${step.label}"
             onclick="document.getElementById('${step.id}').scrollIntoView({behavior:'smooth'})">
            ${String(idx + 1).padStart(2, '0')}
        </div>
    `).join('');

    const tocNav = report.toc.map((item, idx) => `
        <div class="toc-item" style="margin-left:${idx * 40}px;">
            <span>${String(idx + 1).padStart(2, '0')}</span>
            <a href="javascript:void(0)" onclick="document.getElementById('${item.id}').scrollIntoView({behavior:'smooth'})">${item.label}</a>
        </div>
    `).join('');

    const sections = report.sections.map((section, idx) => `
        <section id="${section.id}" style="margin-bottom:var(--space-3xl);">
            <h2 class="section-heading">${section.title}</h2>
            <p class="article-p">${section.text}</p>
            ${idx === 0 ? `
                <div class="pk-second-plan">
                    <div class="pk-second-plan-label">[ ${report.secondPlan.label} ]</div>
                    <div class="pk-second-plan-body">
                        <p class="pk-second-plan-text">${report.secondPlan.text}</p>
                        <div class="pk-second-plan-image reveal-trigger"
                             style="background-image:url('${report.secondPlan.image}');">
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
                    <div class="pk-report-subtitle">${report.subtitle}</div>
                    <h1 class="pk-report-hero-title">${report.title}</h1>
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
