/**
 * TruthSearch Engine
 * Moduł odpowiedzialny za globalne wyszukiwanie danych w projekcie Truth Layer.
 */
const TruthSearch = {
    /**
     * Główna funkcja wyszukiwania
     * @param {string} query - Fraza wpisana przez użytkownika
     * @returns {Object} Wyniki podzielone na kategorie
     */
    query(query) {
        if (!query || query.length < 2) return { mps: [], votes: [] };
        
        const q = query.toLowerCase().trim();
        const data = window.state?.data || {};

        return {
            mps: this._searchMps(data.mps || [], q),
            votes: this._searchVotes(data.votes || [], q)
        };
    },

    /**
     * Generyczna metoda do szukania w dowolnej liście (dla wyszukiwarek lokalnych)
     * @param {Array} list - Lista obiektów do przeszukania
     * @param {string} query - Fraza
     * @param {Array} fields - Pola, po których szukamy (np. ['name', 'club'])
     */
    searchInList(list, query, fields = ['name']) {
        if (!query || query.length < 1) return list;
        const q = query.toLowerCase().trim();
        return list.filter(item => {
            return fields.some(field => 
                (item[field] ? item[field].toString() : '').toLowerCase().includes(q)
            );
        });
    },

    /**
     * Prywatna metoda szukania posłów (Globalna)
     */
    _searchMps(mps, q) {
        return mps.filter(m => {
            const nameMatch = m.name.toLowerCase().includes(q);
            const clubMatch = (m.club || '').toLowerCase().includes(q);
            return nameMatch || clubMatch;
        }).slice(0, 4); // Zwracamy top 4 wyniki dla balansu UI
    },

    /**
     * Prywatna metoda szukania głosowań
     */
    _searchVotes(votes, q) {
        return votes.filter(v => {
            const titleMatch = v.title.toLowerCase().includes(q);
            const topicMatch = (v.topic || '').toLowerCase().includes(q);
            return titleMatch || topicMatch;
        }).slice(0, 4);
    }
};

// Eksportujemy do globalnego okna
window.TruthSearch = TruthSearch;
