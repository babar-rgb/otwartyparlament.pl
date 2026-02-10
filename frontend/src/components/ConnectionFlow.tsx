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
    Network,
    FileText,
    Users,
    Scale,
    GripHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// CUSTOM NODES
// ============================================================================

// Central Vote Node
function VoteNode({ data }: { data: { label: string } }) {
    return (
        <div className="relative">
            <Handle type="source" position={Position.Right} id="right" />
            <Handle type="source" position={Position.Left} id="left" />

            <div className="px-5 py-4 bg-slate-900 border-2 border-accent-blue rounded-2xl shadow-xl max-w-[240px] border-opacity-60 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-accent-blue/10 rounded-lg text-accent-blue">
                        <Scale size={16} />
                    </div>
                    <span className="text-[9px] font-black text-accent-blue uppercase tracking-widest">Głosowanie</span>
                </div>
                <h3 className="text-[11px] font-black text-white leading-tight">{data.label}</h3>
            </div>
        </div>
    );
}

// Connection Node (Process, Bill, Committee)
function ConnectionNode({ data }: { data: { label: string; type: 'process' | 'bill' | 'committee'; id?: string; number?: string } }) {
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
    const labelPrefix = {
        process: 'Proces Legislacyjny',
        bill: 'Druk nr ' + (data.number || ''),
        committee: 'Komisja'
    };

    return (
        <div className="relative group">
            <Handle type="target" position={Position.Left} id="target-left" />
            <Handle type="target" position={Position.Right} id="target-right" />
            <Handle type="source" position={Position.Top} id="source-top" />
            <Handle type="target" position={Position.Bottom} id="target-bottom" />

            <div
                className={`px-4 py-3 bg-slate-900/90 border border-${colors[data.type]}-500/30 rounded-xl shadow-lg max-w-[200px] backdrop-blur-md cursor-pointer hover:border-${colors[data.type]}-500/60 transition-all hover:scale-105`}
            >
                <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 bg-${colors[data.type]}-500/10 rounded-lg text-${colors[data.type]}-400`}>
                        {icons[data.type]}
                    </div>
                    <span className={`text-[8px] font-black text-${colors[data.type]}-400 uppercase tracking-widest`}>
                        {labelPrefix[data.type]}
                    </span>
                </div>
                <p className="text-[10px] font-bold text-white line-clamp-2">{data.label}</p>
            </div>
        </div>
    );
}

const nodeTypes: NodeTypes = {
    vote: VoteNode,
    connection: ConnectionNode,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ConnectionFlowProps {
    voteTitle: string;
    data: {
        process: any;
        bills: any[];
        committees: any[];
    };
}

export default function ConnectionFlow({ voteTitle, data }: ConnectionFlowProps) {
    const navigate = useNavigate();

    const onNodeClick = (_: any, node: Node) => {
        const { data } = node;
        if (data?.type === 'process' && data.id) {
            navigate(`/procesy/${data.id}`);
        } else if (data?.type === 'bill' && data.number) {
            navigate(`/projekty/${data.number}`);
        } else if (data?.type === 'committee' && data.id && data.committee_code) {
            navigate(`/komisje/${data.committee_code}/posiedzenie/${data.id}`);
        }
    };

    const { nodes, edges } = useMemo(() => {
        const initialNodes: Node[] = [
            {
                id: 'vote',
                type: 'vote',
                data: { label: voteTitle },
                position: { x: 300, y: 300 },
            }
        ];
        const initialEdges: Edge[] = [];

        // 1. Process (Right)
        if (data.process) {
            initialNodes.push({
                id: 'process',
                type: 'connection',
                data: { label: data.process.title, type: 'process', id: data.process.id },
                position: { x: 650, y: 280 },
            });
            initialEdges.push({
                id: 'e-vote-process',
                source: 'vote',
                target: 'process',
                sourceHandle: 'right',
                targetHandle: 'target-left',
                animated: true,
                style: { stroke: '#3b82f6' }
            });

            // Bills connected to Process
            data.bills.forEach((bill, i) => {
                const billId = `bill-${bill.number}`;
                initialNodes.push({
                    id: billId,
                    type: 'connection',
                    data: { label: bill.title, type: 'bill', number: bill.number },
                    position: { x: 950, y: 150 + i * 150 },
                });
                initialEdges.push({
                    id: `e-process-bill-${i}`,
                    source: 'process',
                    target: billId,
                    sourceHandle: 'right',
                    targetHandle: 'target-left',
                    style: { stroke: '#f59e0b', strokeDasharray: '5,5' }
                });
            });
        }

        // 2. Committees (Left / Bottom)
        data.committees.forEach((c, i) => {
            const commId = `comm-${c.id}`;
            initialNodes.push({
                id: commId,
                type: 'connection',
                data: {
                    label: `${c.committee_code} (nr ${c.sitting_number})`,
                    type: 'committee',
                    id: c.id,
                    committee_code: c.committee_code
                },
                position: { x: 0, y: 150 + i * 150 },
            });
            initialEdges.push({
                id: `e-vote-comm-${i}`,
                source: 'vote',
                target: commId,
                sourceHandle: 'left',
                targetHandle: 'target-right',
                style: { stroke: '#a855f7' }
            });
        });

        return { nodes: initialNodes, edges: initialEdges };
    }, [voteTitle, data]);

    return (
        <div className="w-full h-full bg-page/30 border border-border-base rounded-2xl overflow-hidden relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                className="bg-transparent"
                minZoom={0.5}
                maxZoom={1.5}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
                <Controls className="!bg-slate-900 !border-slate-800 !text-white" />
            </ReactFlow>

            <div className="absolute top-4 left-4 flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-border-base rounded-full text-[9px] font-black text-secondary uppercase tracking-widest backdrop-blur-md">
                    <GripHorizontal size={12} /> Przeciągaj aby eksplorować • Kliknij węzeł aby przejść do szczegółów
                </div>
            </div>
        </div>
    );
}
