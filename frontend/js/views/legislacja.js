// views/legislacja.js — Widok "Prezydent vs Rząd".
// Zależy od: main.js (state.data.legislation)

templates.legislacja = () => {
    const data = window.state.data.legislation;
    if (!data) {
        return `
            <div class="legislacja-loading">
                <p class="loading-msg">ŁADOWANIE REJESTRU LEGISLACYJNEGO...</p>
            </div>
        `;
    }

    const govList = data.government || [];
    const presList = data.president || [];

    const govCards = govList.map(item => `
        <div class="legislacja-card">
            <div class="legislacja-card-meta">
                <span>DRUK NR ${item.id}</span>
                <span>${item.date}</span>
            </div>
            <h3>${item.title}</h3>
            <div class="legislacja-card-actions">
                <span class="legislacja-tag is-gov">${item.type}</span>
                <a href="${item.url}" target="_blank" class="legislacja-doc-link">DOKUMENT ↗</a>
            </div>
        </div>
    `).join('');

    const presCards = presList.map(item => `
        <div class="legislacja-card">
            <div class="legislacja-card-meta">
                <span>DRUK NR ${item.id}</span>
                <span>${item.date}</span>
            </div>
            <h3>${item.title}</h3>
            <div class="legislacja-card-actions">
                <span class="legislacja-tag is-pres">${item.type}</span>
                <a href="${item.url}" target="_blank" class="legislacja-doc-link">DOKUMENT ↗</a>
            </div>
        </div>
    `).join('');

    return `
        <div class="legislacja-container">
            <!-- Nagłówek -->
            <div class="legislacja-header">
                <span class="legislacja-header-tag">MONITORING AKTYWNOŚCI LEGISLACYJNEJ</span>
                <h1>Prezydent vs Rząd</h1>
                <p>
                    Zestawienie inicjatyw legislacyjnych i wet. Rząd Donalda Tuska kontra Prezydent RP Karol Nawrocki bezpośrednio z oficjalnego rejestru Sejmu RP.
                </p>
                <div class="legislacja-meta-info">
                    Aktualizacja bazy: <strong>${data.meta.updated_at}</strong> | Razem w bazie: <strong>${data.meta.total_government}</strong> rządowych, <strong>${data.meta.total_president}</strong> prezydenckich
                </div>
            </div>

            <!-- Siatka dwukolumnowa -->
            <div class="legislacja-grid">
                <!-- RZĄD -->
                <div class="legislacja-col-gov">
                    <div class="legislacja-column-header">
                        <h2>Rada Ministrów</h2>
                        <span class="legislacja-column-tag">Rząd Donalda Tuska</span>
                    </div>
                    <div class="legislacja-list">
                        ${govCards}
                    </div>
                </div>

                <!-- PREZYDENT -->
                <div class="legislacja-col-pres">
                    <div class="legislacja-column-header">
                        <h2>Prezydent RP</h2>
                        <span class="legislacja-column-tag">Karol Nawrocki</span>
                    </div>
                    <div class="legislacja-list">
                        ${presCards}
                    </div>
                </div>
            </div>
        </div>
    `;
};
