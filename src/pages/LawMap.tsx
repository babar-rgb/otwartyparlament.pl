import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    NodeTypes,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    ArrowLeft,
    FileText,
    Users,
    Zap,
    Link2,
    Clock,
    Tractor,
    Building2,
    Stethoscope,
    Baby,
    Briefcase,
    GraduationCap,
    X,
    ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface ProcessData {
    id: string; // Should be string to handle e.g. "16066-z"
    title: string;
    description: string;
    simple_summary?: string | any;
    who_affected?: string;
    topic_tag?: string;
    category?: string;     // ADDED
    ux_category?: string;  // ADDED
    status?: string;
    document_date?: string;
    term?: number;
}

// ============================================================================
// CUSTOM NODES
// ============================================================================

// Central Law Node (Root)
function LawNode({ data }: { data: { label: string; subtitle?: string } }) {
    return (
        <div className="relative group">
            <Handle type="source" position={Position.Right} className="!bg-blue-500" />
            <Handle type="source" position={Position.Left} className="!bg-blue-500" />
            <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
            <Handle type="source" position={Position.Top} className="!bg-blue-500" />

            <div className="
        px-8 py-6 
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        border-2 border-blue-500/50
        rounded-2xl shadow-2xl shadow-blue-500/20
        min-w-[300px] max-w-[400px]
        backdrop-blur-xl
        transition-all duration-300
        hover:border-blue-400 hover:shadow-blue-400/30
        cursor-pointer
      ">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <FileText className="text-blue-400" size={24} />
                    </div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Ustawa</span>
                </div>
                <h2 className="text-xl font-black text-white leading-tight">
                    {data.label}
                </h2>
                {data.subtitle && (
                    <p className="text-sm text-slate-400 mt-2">{data.subtitle}</p>
                )}
            </div>
        </div>
    );
}

// Info Node (TL;DR, Changes)
function InfoNode({ data }: { data: { label: string; content: string; icon?: string; color?: string } }) {
    const colorClasses: Record<string, string> = {
        blue: 'border-blue-500/50 hover:border-blue-400',
        green: 'border-green-500/50 hover:border-green-400',
        purple: 'border-purple-500/50 hover:border-purple-400',
        amber: 'border-amber-500/50 hover:border-amber-400',
        red: 'border-red-500/50 hover:border-red-400',
    };

    const iconColorClasses: Record<string, string> = {
        blue: 'text-blue-400 bg-blue-500/20',
        green: 'text-green-400 bg-green-500/20',
        purple: 'text-purple-400 bg-purple-500/20',
        amber: 'text-amber-400 bg-amber-500/20',
        red: 'text-red-400 bg-red-500/20',
    };

    const color = data.color || 'blue';

    return (
        <div className="relative">
            <Handle type="target" position={Position.Left} className="!bg-slate-500" />
            <Handle type="target" position={Position.Right} className="!bg-slate-500" />
            <Handle type="target" position={Position.Top} className="!bg-slate-500" />
            <Handle type="target" position={Position.Bottom} className="!bg-slate-500" />

            <div className={`
        px-5 py-4 
        bg-slate-900/90 backdrop-blur-xl
        border ${colorClasses[color]}
        rounded-xl shadow-lg
        min-w-[200px] max-w-[280px]
        transition-all duration-300
        cursor-pointer
        hover:scale-105
      `}>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${iconColorClasses[color]}`}>
                        {data.icon === 'zap' && <Zap size={16} />}
                        {data.icon === 'file' && <FileText size={16} />}
                        {data.icon === 'users' && <Users size={16} />}
                        {data.icon === 'link' && <Link2 size={16} />}
                        {data.icon === 'clock' && <Clock size={16} />}
                        {!data.icon && <FileText size={16} />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {data.label}
                    </span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                    {data.content}
                </p>
            </div>
        </div>
    );
}

// People Node (Who is affected)
function PeopleNode({ data }: { data: { label: string; groups: string[] } }) {
    const icons: Record<string, JSX.Element> = {
        'Rolnik': <Tractor size={20} />,
        'Firma': <Building2 size={20} />,
        'Pacjent': <Stethoscope size={20} />,
        'Rodzic': <Baby size={20} />,
        'Przedsiębiorca': <Briefcase size={20} />,
        'Student': <GraduationCap size={20} />,
    };

    return (
        <div className="relative">
            <Handle type="target" position={Position.Left} className="!bg-slate-500" />

            <div className="
        px-5 py-4 
        bg-slate-900/90 backdrop-blur-xl
        border border-emerald-500/50
        rounded-xl shadow-lg
        min-w-[180px]
        transition-all duration-300
        cursor-pointer
        hover:scale-105 hover:border-emerald-400
      ">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Users size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {data.label}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.groups.map((group, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg text-emerald-300 text-sm"
                        >
                            {icons[group] || <Users size={16} />}
                            <span>{group}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Status Node (Legislative stage)
function StatusNode({ data }: { data: { label: string; stage: string; date?: string } }) {
    const stages = ['Sejm', 'Komisja', 'Senat', 'Prezydent', 'Dziennik Ustaw'];
    const currentIndex = stages.findIndex(s => data.stage.toLowerCase().includes(s.toLowerCase()));

    return (
        <div className="relative">
            <Handle type="target" position={Position.Top} className="!bg-slate-500" />

            <div className="
        px-5 py-4 
        bg-slate-900/90 backdrop-blur-xl
        border border-amber-500/50
        rounded-xl shadow-lg
        min-w-[280px]
        transition-all duration-300
        cursor-pointer
        hover:scale-105 hover:border-amber-400
      ">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <Clock size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {data.label}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-1 mb-2">
                    {stages.map((stage, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                            <div className={`
                w-3 h-3 rounded-full border-2
                ${i <= currentIndex
                                    ? 'bg-amber-500 border-amber-400'
                                    : 'bg-slate-700 border-slate-600'
                                }
              `} />
                            {i < stages.length - 1 && (
                                <div className={`h-0.5 w-full ${i < currentIndex ? 'bg-amber-500' : 'bg-slate-700'}`} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                    {stages.map((stage, i) => (
                        <span key={i} className={i === currentIndex ? 'text-amber-400 font-bold' : ''}>
                            {stage}
                        </span>
                    ))}
                </div>

                {data.date && (
                    <p className="text-xs text-slate-500 mt-2 text-center">
                        Ostatnia aktualizacja: {data.date}
                    </p>
                )}
            </div>
        </div>
    );
}

// Node types registry
const nodeTypes: NodeTypes = {
    lawNode: LawNode,
    infoNode: InfoNode,
    peopleNode: PeopleNode,
    statusNode: StatusNode,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LawMap() {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();
    const [process, setProcess] = useState<ProcessData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Fetch process data
    useEffect(() => {
        if (!processId) return;

        const fetchProcess = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('processes')
                    .select('*')
                    .eq('id', processId)
                    .single();

                if (error) throw error;
                setProcess(data);
            } catch (err) {
                console.error('Error fetching process:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProcess();
    }, [processId]);

    // Build graph from process data
    useEffect(() => {
        if (!process) return;

        // Parse who_affected (handle both Array (Postgres) and String (CSV))
        let affectedGroups: string[] = ['Obywatele'];
        if (Array.isArray(process.who_affected)) {
            affectedGroups = process.who_affected;
        } else if (typeof process.who_affected === 'string') {
            affectedGroups = (process.who_affected as string).split(',').map((g: string) => g.trim()).filter(Boolean);
        }

        // Map category to topic_tag if missing
        const topic = (process.category || process.ux_category || process.topic_tag || 'Ustawa');

        // Truncate title for node
        const shortTitle = process.title.length > 60
            ? process.title.substring(0, 60) + '...'
            : process.title;

        // Build nodes
        const graphNodes: Node[] = [
            // Center: Law title
            {
                id: 'law',
                type: 'lawNode',
                position: { x: 400, y: 300 },
                data: {
                    label: shortTitle,
                    subtitle: topic
                },
            },
            // Left: TL;DR
            {
                id: 'tldr',
                type: 'infoNode',
                position: { x: 50, y: 200 },
                data: {
                    label: 'TL;DR',
                    content: (typeof process.simple_summary === 'object' && process.simple_summary !== null)
                        ? (process.simple_summary as any).tldr || 'Generowanie podsumowania...'
                        : (typeof process.simple_summary === 'string' ? process.simple_summary : 'Generowanie podsumowania... 🤖'),
                    icon: 'zap',
                    color: 'purple'
                },
            },
            // Left: Description
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
            // Right: Who affected
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
            // Right: Topic
            {
                id: 'topic',
                type: 'infoNode',
                position: { x: 750, y: 380 },
                data: {
                    label: 'Kategoria',
                    content: topic,
                    icon: 'link',
                    color: 'green'
                },
            },
            // Bottom: Status
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

        setNodes(graphNodes);
        setEdges(graphEdges);
    }, [process, setNodes, setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Ładowanie mapy myśli...</p>
                </div>
            </div>
        );
    }

    if (!process) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-2xl font-bold text-white mb-4">Nie znaleziono ustawy</p>
                    <Link to="/projekty" className="text-blue-400 hover:text-blue-300">
                        Wróć do listy projektów
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-slate-950 relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-slate-950 via-slate-950/90 to-transparent">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Powrót</span>
                    </button>

                    <div className="text-center">
                        <h1 className="text-lg font-bold text-white">Mapa Myśli Prawa</h1>
                        <p className="text-xs text-slate-500">Interaktywna wizualizacja ustawy</p>
                    </div>

                    <Link
                        to={`/projekty/${processId}`}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <span>Zobacz szczegóły</span>
                        <ExternalLink size={16} />
                    </Link>
                </div>
            </div>

            {/* React Flow Canvas */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.3}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                className="bg-slate-950"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
                <Controls
                    className="!bg-slate-800 !border-slate-700 !rounded-xl !shadow-xl"
                    showInteractive={false}
                />
            </ReactFlow>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 p-4 bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-700">
                <p className="text-xs font-bold text-slate-400 mb-2">LEGENDA</p>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-slate-300">Centrum ustawy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-xs text-slate-300">Podsumowanie</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-300">Grupy docelowe</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-xs text-slate-300">Status procesu</span>
                    </div>
                </div>
            </div>

            {/* Sidebar Panel */}
            {selectedNode && (
                <div className="absolute top-0 right-0 bottom-0 w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 p-6 overflow-y-auto z-20">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Szczegóły węzła</h3>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Typ</p>
                            <p className="text-white">{selectedNode.type}</p>
                        </div>

                        {selectedNode.data.label && (
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Etykieta</p>
                                <p className="text-white">{selectedNode.data.label}</p>
                            </div>
                        )}

                        {selectedNode.data.content && (
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Treść</p>
                                <p className="text-slate-300 leading-relaxed">
                                    {selectedNode.data.fullContent || selectedNode.data.content}
                                </p>
                            </div>
                        )}

                        {selectedNode.data.groups && (
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Grupy</p>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedNode.data.fullGroups || selectedNode.data.groups).map((g: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedNode.id === 'law' && process && (
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Pełny tytuł</p>
                                <p className="text-slate-300 text-sm leading-relaxed">{process.title}</p>

                                {process.description && (
                                    <>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2 mt-4">Pełny opis</p>
                                        <p className="text-slate-300 text-sm leading-relaxed">{process.description}</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 p-3 bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700 text-xs text-slate-400">
                💡 Przeciągaj węzły • Kliknij dla szczegółów • Scrolluj do zoomu
            </div>
        </div>
    );
}
