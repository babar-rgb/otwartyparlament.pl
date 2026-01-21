import React, { useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    BackgroundVariant,
    Handle,
    Position,
    NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Network,
    FileText,
    Link as LinkIcon,
    GripHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// CUSTOM NODES
// ============================================================================

function ProcessNode({ data }: { data: { label: string; type: 'process' | 'bill'; id?: string; number?: string } }) {
    const isBill = data.type === 'bill';

    return (
        <div className="relative group">
            <Handle type="target" position={Position.Left} className="!bg-indigo-500/50" />
            <Handle type="source" position={Position.Right} className="!bg-indigo-500/50" />

            <div className={`
                px-5 py-3 rounded-2xl border backdrop-blur-xl transition-all duration-300
                ${isBill
                    ? 'bg-amber-500/5 border-amber-500/20 group-hover:border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-indigo-500/5 border-indigo-500/20 group-hover:border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                }
                cursor-pointer hover:scale-105 min-w-[180px] max-w-[240px]
            `}>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`
                        p-1.5 rounded-lg 
                        ${isBill ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}
                    `}>
                        {isBill ? <FileText size={14} /> : <Network size={14} />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isBill ? 'text-amber-500' : 'text-indigo-500'}`}>
                        {isBill ? `Druk nr ${data.number}` : 'Proces Główny'}
                    </span>
                </div>
                <h3 className="text-[11px] font-bold text-white leading-snug line-clamp-2">
                    {data.label}
                </h3>

                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-secondary/40 uppercase tracking-tighter">Kliknij aby przejść</span>
                    <LinkIcon size={10} className="text-secondary/20" />
                </div>
            </div>
        </div>
    );
}

const nodeTypes: NodeTypes = {
    custom: ProcessNode,
};

// ============================================================================
// COMPONENT
// ============================================================================

interface GraphData {
    nodes: Array<{ id: string, label: string }>;
    edges: Array<{ source: string, target: string, type: string }>;
}

interface LegislativeNetworkProps {
    data: GraphData;
}

export default function LegislativeNetwork({ data }: LegislativeNetworkProps) {
    const navigate = useNavigate();

    const onNodeClick = (_: any, node: Node) => {
        const { id, data } = node;
        // Logic to distinguish between bills and sub-processes if needed
        // For now, if it looks like a number, it's a bill
        if (id.startsWith('bill-') || (data.number)) {
            const num = data.number || id.replace('bill-', '');
            navigate(`/projekty/${num}`);
        }
    };

    const { nodes, edges } = useMemo(() => {
        const initialNodes: Node[] = data.nodes.map((n, i) => {
            const isBill = n.label.toLowerCase().includes('druk');
            const billNumber = isBill ? n.label.match(/\d+/)?.[0] : undefined;

            return {
                id: n.id,
                type: 'custom',
                data: {
                    label: n.label,
                    type: isBill ? 'bill' : 'process',
                    number: billNumber
                },
                // Circular-ish layout with slight randomization for organic feel
                position: {
                    x: 400 + 350 * Math.cos((i / data.nodes.length) * 2 * Math.PI),
                    y: 300 + 250 * Math.sin((i / data.nodes.length) * 2 * Math.PI)
                },
            };
        });

        const initialEdges: Edge[] = data.edges.map((e, i) => ({
            id: `e-${i}`,
            source: e.source,
            target: e.target,
            animated: true,
            style: {
                stroke: '#6366f1',
                strokeWidth: 2,
                opacity: 0.4
            },
        }));

        return { nodes: initialNodes, edges: initialEdges };
    }, [data]);

    if (!data.nodes.length) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-secondary mb-4 opacity-50">
                    <Network size={24} />
                </div>
                <p className="text-secondary font-medium italic">Brak dodatkowych powiązań dokumentów dla tego procesu.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[550px] relative bg-[#0A0A0A]/30 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.4}
                maxZoom={1.5}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e1b4b" />
                <Controls className="!bg-slate-900 !border-white/10 !text-white" />
            </ReactFlow>

            <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-full text-[9px] font-black text-secondary uppercase tracking-[0.2em] backdrop-blur-md">
                    <GripHorizontal size={12} className="text-indigo-500" />
                    Interaktywna Mapa Powiązań
                </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
                <div className="text-[8px] font-mono text-secondary/30 uppercase tracking-widest">
                    Legislative Relational Network // Structural Map
                </div>
            </div>
        </div>
    );
}
