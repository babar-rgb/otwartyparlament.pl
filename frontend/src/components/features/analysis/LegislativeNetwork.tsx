import React, { useMemo, useState } from 'react';
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
    GripHorizontal,
    Vote,
    Scale,
    Edit3,
    MessageCircle,
    Filter,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

type NodeType = 'vote' | 'bill' | 'law' | 'amendment' | 'interpellation' | 'process';

interface CustomNodeData {
    label: string;
    type: NodeType;
    id?: string;
    number?: string;
    confidence?: number;
    metadata?: any;
}

// ============================================================================
// CUSTOM NODES
// ============================================================================

function ProcessNode({ data }: { data: CustomNodeData }) {
    const getNodeStyle = (type: NodeType) => {
        switch (type) {
            case 'vote':
                return {
                    bg: 'bg-blue-500/5',
                    border: 'border-blue-500/20',
                    hoverBorder: 'group-hover:border-blue-500/40',
                    shadow: 'shadow-blue-500/5',
                    iconBg: 'bg-blue-500/10',
                    iconColor: 'text-blue-500',
                    icon: <Vote size={14} />,
                    label: 'Głosowanie'
                };
            case 'bill':
                return {
                    bg: 'bg-amber-500/5',
                    border: 'border-amber-500/20',
                    hoverBorder: 'group-hover:border-amber-500/40',
                    shadow: 'shadow-amber-500/5',
                    iconBg: 'bg-amber-500/10',
                    iconColor: 'text-amber-500',
                    icon: <FileText size={14} />,
                    label: `Druk nr ${data.number || '?'}`
                };
            case 'law':
                return {
                    bg: 'bg-emerald-500/5',
                    border: 'border-emerald-500/20',
                    hoverBorder: 'group-hover:border-emerald-500/40',
                    shadow: 'shadow-emerald-500/5',
                    iconBg: 'bg-emerald-500/10',
                    iconColor: 'text-emerald-500',
                    icon: <Scale size={14} />,
                    label: 'Ustawa'
                };
            case 'amendment':
                return {
                    bg: 'bg-rose-500/5',
                    border: 'border-rose-500/20',
                    hoverBorder: 'group-hover:border-rose-500/40',
                    shadow: 'shadow-rose-500/5',
                    iconBg: 'bg-rose-500/10',
                    iconColor: 'text-rose-500',
                    icon: <Edit3 size={14} />,
                    label: 'Poprawka'
                };
            case 'interpellation':
                return {
                    bg: 'bg-purple-500/5',
                    border: 'border-purple-500/20',
                    hoverBorder: 'group-hover:border-purple-500/40',
                    shadow: 'shadow-purple-500/5',
                    iconBg: 'bg-purple-500/10',
                    iconColor: 'text-purple-500',
                    icon: <MessageCircle size={14} />,
                    label: 'Interpelacja'
                };
            default:
                return {
                    bg: 'bg-indigo-500/5',
                    border: 'border-indigo-500/20',
                    hoverBorder: 'group-hover:border-indigo-500/40',
                    shadow: 'shadow-indigo-500/5',
                    iconBg: 'bg-indigo-500/10',
                    iconColor: 'text-indigo-500',
                    icon: <Network size={14} />,
                    label: 'Proces'
                };
        }
    };

    const style = getNodeStyle(data.type);

    return (
        <div className="relative group">
            <Handle type="target" position={Position.Left} className="!bg-indigo-500/50" />
            <Handle type="source" position={Position.Right} className="!bg-indigo-500/50" />

            <div className={`
                px-5 py-3 rounded-2xl border backdrop-blur-xl transition-all duration-300
                ${style.bg} ${style.border} ${style.hoverBorder} shadow-lg ${style.shadow}
                cursor-pointer hover:scale-105 min-w-[180px] max-w-[240px]
            `}>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${style.iconBg} ${style.iconColor}`}>
                        {style.icon}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${style.iconColor}`}>
                        {style.label}
                    </span>
                    {data.confidence && data.confidence < 1.0 && (
                        <span className="text-[8px] text-amber-500 font-bold">
                            {Math.round(data.confidence * 100)}%
                        </span>
                    )}
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
    nodes: Array<{ id: string, label: string, type?: NodeType, number?: string, confidence?: number }>;
    edges: Array<{ source: string, target: string, type: string }>;
}

interface LegislativeNetworkProps {
    data: GraphData;
}

export default function LegislativeNetwork({ data }: LegislativeNetworkProps) {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<Set<NodeType>>(new Set());

    const toggleFilter = (type: NodeType) => {
        const newFilters = new Set(filters);
        if (newFilters.has(type)) {
            newFilters.delete(type);
        } else {
            newFilters.add(type);
        }
        setFilters(newFilters);
    };

    const onNodeClick = (_: any, node: Node) => {
        const { id, data } = node;
        const nodeType = data.type as NodeType;

        // Navigate based on node type
        if (nodeType === 'bill' || id.startsWith('bill-')) {
            const num = data.number || id.replace('bill-', '');
            navigate(`/projekty/${num}`);
        } else if (nodeType === 'vote') {
            navigate(`/glosowania/${id}`);
        } else if (nodeType === 'interpellation') {
            navigate(`/interpelacje/${id}`);
        }
    };

    const { nodes, edges } = useMemo(() => {
        // Filter nodes based on active filters
        const filteredNodes = data.nodes.filter(n => {
            if (filters.size === 0) return true;
            return !filters.has(n.type || 'process');
        });

        const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

        const initialNodes: Node[] = filteredNodes.map((n, i) => {
            const nodeType = n.type || 'process';

            return {
                id: n.id,
                type: 'custom',
                data: {
                    label: n.label,
                    type: nodeType,
                    number: n.number,
                    confidence: n.confidence
                },
                // Hierarchical layout with slight randomization
                position: {
                    x: 400 + 350 * Math.cos((i / filteredNodes.length) * 2 * Math.PI),
                    y: 300 + 250 * Math.sin((i / filteredNodes.length) * 2 * Math.PI)
                },
            };
        });

        // Filter edges to only include those between visible nodes
        const filteredEdges = data.edges.filter(e =>
            filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
        );

        const initialEdges: Edge[] = filteredEdges.map((e, i) => ({
            id: `e-${i}`,
            source: e.source,
            target: e.target,
            animated: true,
            style: {
                stroke: e.type === 'amends' ? '#f43f5e' :
                    e.type === 'references' ? '#a855f7' : '#6366f1',
                strokeWidth: e.type === 'amends' ? 3 : 2,
                strokeDasharray: e.type === 'references' ? '5,5' : undefined,
                opacity: 0.4
            },
        }));

        return { nodes: initialNodes, edges: initialEdges };
    }, [data, filters]);

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

    const nodeTypeCounts = data.nodes.reduce((acc, n) => {
        const type = n.type || 'process';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<NodeType, number>);

    return (
        <div className="w-full space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(nodeTypeCounts).map(([type, count]) => {
                    const isActive = !filters.has(type as NodeType);
                    const typeLabels = {
                        vote: { label: 'Głosowania', icon: <Vote size={12} />, color: 'blue' },
                        bill: { label: 'Druki', icon: <FileText size={12} />, color: 'amber' },
                        law: { label: 'Ustawy', icon: <Scale size={12} />, color: 'emerald' },
                        amendment: { label: 'Poprawki', icon: <Edit3 size={12} />, color: 'rose' },
                        interpellation: { label: 'Interpelacje', icon: <MessageCircle size={12} />, color: 'purple' },
                        process: { label: 'Procesy', icon: <Network size={12} />, color: 'indigo' }
                    };
                    const config = typeLabels[type as NodeType] || typeLabels.process;

                    return (
                        <button
                            key={type}
                            onClick={() => toggleFilter(type as NodeType)}
                            className={`
                                px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                flex items-center gap-2
                                ${isActive
                                    ? `bg-${config.color}-500/10 border border-${config.color}-500/20 text-${config.color}-500`
                                    : 'bg-white/5 border border-white/10 text-secondary/40 line-through'
                                }
                            `}
                        >
                            {config.icon}
                            {config.label} ({count})
                            {!isActive && <X size={10} />}
                        </button>
                    );
                })}
            </div>

            {/* Graph */}
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
                        Graf Legislacyjny
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
                    <div className="text-[8px] font-mono text-secondary/30 uppercase tracking-widest">
                        {nodes.length} węzłów • {edges.length} połączeń
                    </div>
                </div>
            </div>
        </div>
    );
}
