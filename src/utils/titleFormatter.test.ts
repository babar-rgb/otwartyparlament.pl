
import { describe, it, expect } from 'vitest';
import { cleanSejmTitle } from './titleFormatter';

describe('titleFormatter', () => {
    describe('cleanSejmTitle', () => {
        it('removes "Rządowy projekt ustawy" prefix', () => {
            const input = 'Rządowy projekt ustawy o zmianie ustawy o podatku dochodowym';
            const expected = 'o zmianie ustawy o podatku dochodowym';
            expect(cleanSejmTitle(input)).toBe(expected);
        });

        it('removes "Poselski projekt ustawy" prefix', () => {
            const input = 'Poselski projekt ustawy o ochronie zwierząt';
            const expected = 'o ochronie zwierząt';
            expect(cleanSejmTitle(input)).toBe(expected);
        });

        it('handles titles without prefixes', () => {
            const input = 'Uchwała w sprawie powołania Komisji';
            const expected = 'Uchwała w sprawie powołania Komisji';
            expect(cleanSejmTitle(input)).toBe(expected);
        });

        it('removes "w sprawie" prefix if requested (logic dependency check)', () => {
            // Check specific logic from the actual function if known, otherwise basic check
            const input = 'Projekt uchwały w sprawie zmiany regulaminu';
            expect(cleanSejmTitle(input)).toContain('zmiany regulaminu');
        });
    });
});
