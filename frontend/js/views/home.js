// views/home.js — Widok strony głównej: hero + feed kart artykułów.
// Zależy od: helpers.js (formatDatePolish), window.state.

templates.home = () => `
    <section class="hero-section" style="position: relative; margin-bottom: 80px;">
        <h1 style="max-width: 850px; margin: 0;">Politycy liczą na to, że nie sprawdzisz.</h1>
        <div class="poza-kadrem-stamp" onclick="location.hash='#poza-kadrem'" style="position: absolute; top: 0; right: 0;">
            <span>POZA</span>
            <span>KADREM</span>
        </div>
    </section>

    <div class="feed">
        ${window.state.data.articles.length > 0
            ? window.state.data.articles.map(a => templates.card(a)).join('')
            : `<div style="padding: 40px; text-align: center; font-family: 'Playfair Display', serif; font-size: 20px; color: #aaa;">
                Brak aktualnych analiz. Czekamy na dane.
               </div>`
        }
    </div>
`;

templates.card = (a) => `
    <article class="op-card-refined clickable-article" data-id="${a.id}">
        <div class="card-header">
            <div class="meta-box">${a.category} · ${a.date}</div>
            <div class="card-arrow-minimal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
        </div>

        <div class="card-body-refined">
            <div class="card-image-side">
                <div class="circular-image-small">
                    <img src="${a.image}">
                    <div class="mic-icon-small">
                        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                </div>
            </div>
            <div class="card-text-side">
                <h2 class="card-title-refined">${a.title}</h2>
                <p class="card-context-refined">${a.excerpt}</p>
            </div>
        </div>

        <div class="card-footer-refined">
            <div class="card-stats-minimal">
                <span class="stat-tag">[ZA: ${a.votes_yes || 0}]</span>
                <span class="stat-tag">[PRZECIW: ${a.votes_no || 0}]</span>
                <span class="verdict-arrow">→ ${a.verdict || 'PRZYJĘTO'}</span>
            </div>
        </div>
    </article>
`;
