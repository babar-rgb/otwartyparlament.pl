
import { describe, it, expect } from 'vitest';
import { getPartyColor, PARTY_CONFIG } from './constants';

describe('Critical Party Colors', () => {
    it('Konfederacja should be Navy (#142544)', () => {
        // Direct config check
        expect(PARTY_CONFIG['Konfederacja'].color).toBe('#142544');

        // Function logic check (prevent "KO" mismatch)
        expect(getPartyColor('Konfederacja')).toBe('#142544');
        expect(getPartyColor('Klub Parlamentarny Konfederacja')).toBe('#142544');
    });

    it('Polska2050 should be Yellow (#eab308)', () => {
        // Direct config check
        expect(PARTY_CONFIG['Polska2050'].color).toBe('#eab308');

        // Function logic check (handle whitespace/casing)
        expect(getPartyColor('Polska2050')).toBe('#eab308');
        expect(getPartyColor('Polska 2050')).toBe('#eab308');
        expect(getPartyColor('Polska2050 - Trzecia Droga')).toBe('#eab308');
    });

    it('KO should be Orange (#f97316)', () => {
        expect(PARTY_CONFIG['KO'].color).toBe('#f97316');
        expect(getPartyColor('KO')).toBe('#f97316');
        expect(getPartyColor('Koalicja Obywatelska')).toBe('#f97316');
    });

    it('Parties should not overlap incorrectly', () => {
        // This is the specific regression user faced: Konfederacja != KO
        expect(getPartyColor('Konfederacja')).not.toBe(PARTY_CONFIG['KO'].color);
    });
});
