
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

/**
 * Formats a date string (ISO) or Date object to Polish format DD-MM-YYYY
 */
export const formatPolishDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    try {
        const d = typeof date === 'string' ? (date.includes('T') ? parseISO(date) : new Date(date)) : date;
        if (isNaN(d.getTime())) return String(date);
        return format(d, 'dd-MM-yyyy', { locale: pl });
    } catch (e) {
        return String(date);
    }
};

/**
 * Formats a date string (ISO) or Date object to Polish format DD.MM.YYYY
 */
export const formatPolishDateDots = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    try {
        const d = typeof date === 'string' ? (date.includes('T') ? parseISO(date) : new Date(date)) : date;
        if (isNaN(d.getTime())) return String(date);
        return format(d, 'dd.MM.yyyy', { locale: pl });
    } catch (e) {
        return String(date);
    }
};

/**
 * Formats a date string (ISO) or Date object to a more descriptive Polish format (e.g. 03 grudnia 2025)
 */
export const formatPolishDateLong = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    try {
        const d = typeof date === 'string' ? (date.includes('T') ? parseISO(date) : new Date(date)) : date;
        if (isNaN(d.getTime())) return String(date);
        return format(d, 'dd MMMM yyyy', { locale: pl });
    } catch (e) {
        return String(date);
    }
};
