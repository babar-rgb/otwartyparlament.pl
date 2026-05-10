document.addEventListener('alpine:init', () => {
    Alpine.data('truthLayer', () => ({
        menuOpen: false,
        searchQuery: '',
        
        // Korzystamy z nowego silnika TruthSearch
        get results() {
            return window.TruthSearch ? window.TruthSearch.query(this.searchQuery) : { mps: [], votes: [] };
        },

        get filteredMps() { return this.results.mps; },
        get filteredVotes() { return this.results.votes; },

        // Metody pomocnicze
        toggleMenu() {
            this.menuOpen = !this.menuOpen;
            if (this.menuOpen) {
                document.body.classList.add('menu-open');
            } else {
                document.body.classList.remove('menu-open');
                this.searchQuery = ''; // Czyścimy szukanie przy zamykaniu
            }
        },

        closeMenu() {
            this.menuOpen = false;
            document.body.classList.remove('menu-open');
            this.searchQuery = '';
        }
    }));
});
