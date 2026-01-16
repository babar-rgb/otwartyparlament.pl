import React, { useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    Position,
    ConnectionLineType,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

interface GraphData {
    nodes: Array<{ id: string, label: string }>;
    edges: Array<{ source: string, target: string, type: string }>;
}

interface LegislativeNetworkProps {
    data: GraphData;
}

// Simple Circular Layout calculation
const getLayoutedElements = (nodes: any[], edges: any[]) => {
    const count = nodes.length;
    const radius = 200;
    const center = { x: 250, y: 250 };

    return {
        nodes: nodes.map((node, index) => {
            const theta = (index / count) * 2 * Math.PI;
            return {
                ...node,
                position: {
                    x: center.x + radius * Math.cos(theta),
                    y: center.y + radius * Math.sin(theta),
                },
                style: {
                    background: '#1e1e24',
                    color: '#fff',
                    border: '1px solid #6366f1',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    width: 150,
                    textAlign: 'center'
                }
            };
        }),
        edges: edges.map(edge => ({
            ...edge,
            type: ConnectionLineType.SmoothStep,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
            style: { stroke: '#6366f1', strokeWidth: 2 },
            label: edge.data?.label,
            labelStyle: { fill: '#94a3b8', fontSize: 10 }
        }))
    };
};

const LegislativeNetwork: React.FC<LegislativeNetworkProps> = ({ data }) => {

    // Transform input to ReactFlow format
    const initialNodes: Node[] = data.nodes.map(n => ({
        id: n.id,
        data: { label: n.label },
        position: { x: 0, y: 0 }, // Will be computed
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    }));

    const initialEdges: Edge[] = data.edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        data: { label: e.type }
    }));

    const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges);

    if (nodes.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center text-secondary border border-white/10 rounded-xl bg-[#1A1A1A]">
                <p>Brak powiązanych dokumentów (poza głównym).</p>
            </div>
        );
    }

    return (
        <div className="h-[500px] w-full border border-white/5 rounded-2xl overflow-hidden bg-[#0a0a0a]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                className="bg-gray-900"
            >
                <Background color="#333" gap={16} />
                <Controls />
            </ReactFlow>
            <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 font-mono bg-black/50 px-2 py-1 rounded">
                Powered by React Flow
            </div>
        </div>
    );
};

export default LegislativeNetwork;
