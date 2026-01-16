import { useMutation } from '@tanstack/react-query';
import { matchPoliticalTwin } from '../api';

export function usePoliticalTwin() {
    return useMutation({
        mutationFn: (query: string) => matchPoliticalTwin(query),
    });
}
