// views/helpers.js — Funkcje pomocnicze współdzielone przez wszystkie widoki.
// Zależy od: niczego.

function formatDatePolish(dateStr) {
    if (!dateStr) return '---';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
                    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}
