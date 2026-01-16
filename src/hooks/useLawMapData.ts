import { useQuery } from '@tanstack/react-query';
import { fetchProcess } from '../api';
import { Node, Edge } from 'reactflow';

export interface ProcessData {
    id: string;
    title: string;
    description: string;
    simple_summary?: { tldr?: string } | string;
    who_affected?: string;
    topic_tag?: string;
    category?: string;
    ux_category?: string;
    status?: string;
    document_date?: string;
    term?: number;
}

export function useLawMapData(processId: string | undefined) {
    return useQuery({
        queryKey: ['lawMapData', processId],
        queryFn: async () => {
            if (!processId) return null;
            const process = await fetchProcess(processId);

            // Parse who_affected
            let affectedGroups: string[] = ['Obywatele'];
            const whoAffected = (process as any).who_affected;
            if (Array.isArray(whoAffected)) {
                affectedGroups = whoAffected;
            } else if (typeof whoAffected === 'string') {
                affectedGroups = whoAffected.split(',').map((g: string) => g.trim()).filter(Boolean);
            }

            const topic = (process.category || process.ux_category || process.topic_tag || 'Ustawa');
            const shortTitle = process.title.length > 60
                ? process.title.substring(0, 60) + '...'
                : process.title;

            // Build nodes
            const graphNodes: Node[] = [
                {
                    id: 'law',
                    type: 'lawNode',
                    position: { x: 400, y: 300 },
                    data: { label: shortTitle, subtitle: topic },
                },
                {
                    id: 'tldr',
                    type: 'infoNode',
                    position: { x: 50, y: 200 },
                    data: {
                        label: 'TL;DR',
                        content: (typeof process.simple_summary === 'object' && process.simple_summary !== null && 'tldr' in process.simple_summary)
                            ? (process.simple_summary.tldr || 'Generowanie podsumowania...')
                            : (typeof process.simple_summary === 'string' ? process.simple_summary : 'Generowanie podsumowania...'),
                        icon: 'zap',
                        color: 'purple'
                    },
                },
                {
                    id: 'description',
                    type: 'infoNode',
                    position: { x: 50, y: 380 },
                    data: {
                        label: 'O co chodzi?',
                        content: process.description
                            ? (process.description.length > 150
                                ? process.description.substring(0, 150) + '...'
                                : process.description)
                            : 'Brak opisu ustawy.',
                        fullContent: process.description || 'Brak opisu.',
                        icon: 'file',
                        color: 'blue'
                    },
                },
                {
                    id: 'people',
                    type: 'peopleNode',
                    position: { x: 750, y: 220 },
                    data: {
                        label: 'Kogo dotyczy?',
                        groups: affectedGroups.slice(0, 4),
                        fullGroups: affectedGroups
                    },
                },
                {
                    id: 'topic',
                    type: 'infoNode',
                    position: { x: 750, y: 380 },
                    data: { label: 'Kategoria', content: topic, icon: 'link', color: 'green' },
                },
                {
                    id: 'status',
                    type: 'statusNode',
                    position: { x: 350, y: 520 },
                    data: {
                        label: 'Etap Legislacyjny',
                        stage: process.status || 'W trakcie',
                        date: process.document_date
                    },
                },
            ];

            // Build edges
            const graphEdges: Edge[] = [
                { id: 'e-law-tldr', source: 'law', target: 'tldr', animated: true, style: { stroke: '#a855f7' } },
                { id: 'e-law-desc', source: 'law', target: 'description', animated: true, style: { stroke: '#3b82f6' } },
                { id: 'e-law-people', source: 'law', target: 'people', animated: true, style: { stroke: '#10b981' } },
                { id: 'e-law-topic', source: 'law', target: 'topic', animated: true, style: { stroke: '#22c55e' } },
                { id: 'e-law-status', source: 'law', target: 'status', animated: true, style: { stroke: '#f59e0b' } },
            ];

            return { process, nodes: graphNodes, edges: graphEdges };
        },
        enabled: !!processId,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
