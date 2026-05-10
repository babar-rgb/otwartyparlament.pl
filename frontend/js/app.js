document.addEventListener('alpine:init', () => {
    Alpine.data('truthLayer', () => ({
        menuOpen: false,
        searchQuery: '',
        
        // Dynamiczne filtrowanie posłów
        get filteredMps() {
            if (this.searchQuery.length < 2) return [];
            const mps = window.state?.data?.mps || [];
            return mps.filter(m => 
                m.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            ).slice(0, 4);
        },

        // Dynamiczne filtrowanie głosowań
        get filteredVotes() {
            if (this.searchQuery.length < 2) return [];
            const votes = window.state?.data?.votes || [];
            return votes.filter(v => 
                v.title.toLowerCase().includes(this.searchQuery.toLowerCase())
            ).slice(0, 4);
        },

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
