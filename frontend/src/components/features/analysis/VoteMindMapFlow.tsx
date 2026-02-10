import { useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    BackgroundVariant,
    NodeTypes,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Sparkles,
    ThumbsUp,
    ThumbsDown,
    AlignLeft,
    Network,
    FileText,
    Users,
    Scale
} from 'lucide-react';

// ============================================================================
// CUSTOM NODES
// ============================================================================

// Central Vote Node
function CenterNode({ data }: { data: { label: string } }) {
    return (
        <div className="relative">
            <Handle type="source" position={Position.Right} />
            <Handle type="source" position={Position.Left} />
            <Handle type="source" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />

            <div className="px-6 py-4 bg-slate-900 border-2 border-accent-blue rounded-2xl shadow-2xl shadow-blue-500/20 max-w-[300px] backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-accent-blue/20 rounded-lg text-accent-blue">
                        <Scale size={18} />
                    </div>
                    <span className="text-[10px] font-black text-accent-blue uppercase tracking-widest">Głosowanie</span>
                </div>
                <h3 className="text-sm font-black text-white leading-tight">{data.label}</h3>
            </div>
        </div>
    );
}

// Analysis Node (Summary / Context)
function AnalysisNode({ data }: { data: { label: string; content: string; icon: 'sparkles' | 'align-left' } }) {
    return (
        <div className="relative">
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />

            <div className="px-5 py-4 bg-slate-900/80 border border-indigo-500/30 rounded-xl shadow-xl max-w-[280px] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                        {data.icon === 'sparkles' ? <Sparkles size={14} /> : <AlignLeft size={14} />}
                    </div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{data.label}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{data.content}</p>
            </div>
        </div>
    );
}

// Argument Node (ZA / PRZECIW)
function ArgumentNode({ data }: { data: { label: string; type: 'pro' | 'con' } }) {
    const isPro = data.type === 'pro';
    return (
        <div className="relative">
            <Handle type="target" position={Position.Top} />

            <div className={`px-4 py-3 bg-slate-900/80 border ${isPro ? 'border-emerald-500/30' : 'border-rose-500/30'} rounded-xl shadow-lg max-w-[220px] backdrop-blur-md`}>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1 bg-${isPro ? 'emerald' : 'rose'}-500/10 rounded text-${isPro ? 'emerald' : 'rose'}-400`}>
                        {isPro ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                    </div>
                    <span className={`text-[9px] font-black text-${isPro ? 'emerald' : 'rose'}-400 uppercase tracking-widest`}>
                        {isPro ? 'Argument ZA' : 'Argument PRZECIW'}
                    </span>
                </div>
                <p className="text-[11px] font-medium text-slate-200 leading-snug">{data.label}</p>
            </div>
        </div>
    );
}

// Connection Node (Process, Bill, Committee)
function ConnectionNode({ data }: { data: { label: string; type: 'process' | 'bill' | 'committee' } }) {
    const icons = {
        process: <Network size={14} />,
        bill: <FileText size={14} />,
        committee: <Users size={14} />
    };
    const colors = {
        process: 'blue',
        bill: 'amber',
        committee: 'purple'
    };

    return (
        <div className="relative">
            <Handle type="target" position={Position.Bottom} />

            <div className={`px-4 py-3 bg-slate-900/80 border border-${colors[data.type]}-500/30 rounded-xl shadow-lg max-w-[200px] backdrop-blur-md`}>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 bg-${colors[data.type]}-500/10 rounded-lg text-${colors[data.type]}-400`}>
                        {icons[data.type]}
                    </div>
                    <span className={`text-[9px] font-black text-${colors[data.type]}-400 uppercase tracking-widest`}>
                        {data.type === 'process' ? 'Proces' : data.type === 'bill' ? 'Druk' : 'Komisja'}
                    </span>
                </div>
                <p className="text-[11px] font-bold text-white line-clamp-2">{data.label}</p>
            </div>
        </div>
    );
}

const nodeTypes: NodeTypes = {
    center: CenterNode,
    analysis: AnalysisNode,
    argument: ArgumentNode,
    connection: ConnectionNode,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface VoteMindMapFlowProps {
    title: string;
    summary: string;
    pros: string[];
    cons: string[];
    procedural_context?: any;
    connections?: any;
}

export default function VoteMindMapFlow({
    title,
    summary,
    pros,
    cons,
    procedural_context,
    connections
}: VoteMindMapFlowProps) {

    const { nodes, edges } = useMemo(() => {
        const initialNodes: Node[] = [
            {
                id: 'center',
                type: 'center',
                data: { label: title },
                position: { x: 400, y: 300 },
            }
        ];
        const initialEdges: Edge[] = [];

        // 1. Summary Node (Left)
        initialNodes.push({
            id: 'summary',
            type: 'analysis',
            data: { label: 'Podsumowanie AI', content: summary.substring(0, 150) + '...', icon: 'align-left' },
            position: { x: 50, y: 280 },
        });
        initialEdges.push({ id: 'e-center-summary', source: 'center', target: 'summary', animated: true, style: { stroke: '#6366f1' } });

        // 2. Procedural Context Node (Far Left)
        if (procedural_context) {
            const context = typeof procedural_context === 'string' ? JSON.parse(procedural_context) : procedural_context;
            initialNodes.push({
                id: 'context',
                type: 'analysis',
                data: { label: 'Kontekst Proceduralny', content: context.procedural_context || context.description || '', icon: 'sparkles' },
                position: { x: -250, y: 280 },
            });
            initialEdges.push({ id: 'e-summary-context', source: 'summary', target: 'context', animated: true, style: { stroke: '#818cf8', strokeDasharray: '5,5' } });
        }

        // 3. Pros (Top)
        pros.slice(0, 3).forEach((pro, i) => {
            const id = `pro-${i}`;
            initialNodes.push({
                id,
                type: 'argument',
                data: { label: pro, type: 'pro' },
                position: { x: 150 + i * 250, y: 50 },
            });
            initialEdges.push({ id: `e-center-${id}`, source: 'center', target: id, style: { stroke: '#10b981' } });
        });

        // 4. Cons (Bottom)
        cons.slice(0, 3).forEach((con, i) => {
            const id = `con-${i}`;
            initialNodes.push({
                id,
                type: 'argument',
                data: { label: con, type: 'con' },
                position: { x: 150 + i * 250, y: 550 },
            });
            initialEdges.push({ id: `e-center-${id}`, source: 'center', target: id, style: { stroke: '#f43f5e' } });
        });

        // 5. Connections (Right)
        if (connections?.process) {
            initialNodes.push({
                id: 'process',
                type: 'connection',
                data: { label: connections.process.title, type: 'process' },
                position: { x: 750, y: 250 },
            });
            initialEdges.push({ id: 'e-center-process', source: 'center', target: 'process', animated: true, style: { stroke: '#3b82f6' } });

            if (connections.bills?.length > 0) {
                const bill = connections.bills[0];
                initialNodes.push({
                    id: 'bill',
                    type: 'connection',
                    data: { label: `Druk nr ${bill.number}`, type: 'bill' },
                    position: { x: 950, y: 250 },
                });
                initialEdges.push({ id: 'e-process-bill', source: 'process', target: 'bill', style: { stroke: '#f59e0b', strokeDasharray: '2,2' } });
            }
        }

        return { nodes: initialNodes, edges: initialEdges };
    }, [title, summary, pros, cons, procedural_context, connections]);

    return (
        <div className="w-full h-[600px] bg-slate-950/20 border border-border-base rounded-[2rem] overflow-hidden relative group">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={1.5}
                preventScrolling={false}
                zoomOnScroll={false}
                className="bg-transparent"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
                <Controls showInteractive={false} className="!bg-slate-900 !border-slate-800 !text-white" />
            </ReactFlow>

            {/* Overlay instruction */}
            <div className="absolute top-4 right-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Interaktywna Mapa Myśli AI
            </div>
        </div>
    );
}
