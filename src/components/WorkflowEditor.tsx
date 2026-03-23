import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Node,
  Edge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  X, 
  Save, 
  Zap, 
  MessageSquare, 
  Cpu, 
  Clock, 
  GitMerge, 
  Plus,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Workflow, WorkflowNode } from '../types';
import { workflowService } from '../services/workflowService';

const NODE_TYPES = {
  trigger: { icon: Zap, color: 'bg-orange-500', label: 'Trigger' },
  action: { icon: MessageSquare, color: 'bg-blue-500', label: 'Action' },
  ai: { icon: Cpu, color: 'bg-purple-500', label: 'AI Logic' },
  delay: { icon: Clock, color: 'bg-yellow-500', label: 'Delay' },
  condition: { icon: GitMerge, color: 'bg-indigo-500', label: 'Condition' },
};

interface WorkflowEditorProps {
  workflow: Workflow;
  onClose: () => void;
}

export function WorkflowEditor({ workflow, onClose }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Map our workflow nodes to ReactFlow nodes
    const initialNodes: Node[] = workflow.nodes.map((n) => ({
      id: n.id,
      type: 'default', // Using default for now, can customize later
      position: n.position,
      data: { 
        label: (
          <div className="flex items-center gap-2 p-2">
            <div className={`p-1.5 rounded-lg ${NODE_TYPES[n.type as keyof typeof NODE_TYPES]?.color || 'bg-gray-500'} text-white`}>
              {React.createElement(NODE_TYPES[n.type as keyof typeof NODE_TYPES]?.icon || Zap, { size: 14 })}
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                {NODE_TYPES[n.type as keyof typeof NODE_TYPES]?.label || 'Node'}
              </div>
              <div className="text-xs font-bold text-gray-900">{n.data.label || 'New Node'}</div>
            </div>
          </div>
        ),
        originalNode: n
      },
      style: { borderRadius: '12px', border: '1px solid #E5E7EB', background: 'white', width: 180 }
    }));

    setNodes(initialNodes);
    setEdges(workflow.edges || []);
  }, [workflow]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Map back to our Workflow format
      const updatedNodes: WorkflowNode[] = nodes.map((n) => ({
        id: n.id,
        type: (n.data.originalNode as WorkflowNode)?.type || 'action',
        data: (n.data.originalNode as WorkflowNode)?.data || {},
        position: n.position
      }));

      await workflowService.updateWorkflow({
        ...workflow,
        nodes: updatedNodes,
        edges: edges
      });
      onClose();
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addNode = (type: keyof typeof NODE_TYPES) => {
    const id = `node_${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: (
          <div className="flex items-center gap-2 p-2">
            <div className={`p-1.5 rounded-lg ${NODE_TYPES[type].color} text-white`}>
              {React.createElement(NODE_TYPES[type].icon, { size: 14 })}
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                {NODE_TYPES[type].label}
              </div>
              <div className="text-xs font-bold text-gray-900">New {NODE_TYPES[type].label}</div>
            </div>
          </div>
        ),
        originalNode: {
          id,
          type,
          data: { label: `New ${NODE_TYPES[type].label}` },
          position: { x: 0, y: 0 }
        }
      },
      style: { borderRadius: '12px', border: '1px solid #E5E7EB', background: 'white', width: 180 }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      {/* Editor Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{workflow.name}</h2>
            <p className="text-xs text-gray-400">Workflow Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save Workflow
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Editor Main */}
      <div className="flex-1 relative bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background color="#E5E7EB" gap={20} />
          <Controls />
          <MiniMap zoomable pannable />
          
          <Panel position="top-left" className="bg-white p-2 rounded-2xl border border-gray-100 shadow-xl flex flex-col gap-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-2 mb-1">Add Nodes</div>
            {(Object.keys(NODE_TYPES) as Array<keyof typeof NODE_TYPES>).map((type) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-all group text-left"
              >
                <div className={`p-2 rounded-lg ${NODE_TYPES[type].color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                  {React.createElement(NODE_TYPES[type].icon, { size: 16 })}
                </div>
                <span className="text-sm font-bold text-gray-700">{NODE_TYPES[type].label}</span>
              </button>
            ))}
          </Panel>

          <Panel position="bottom-center" className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white shadow-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Drag and drop nodes to organize • Connect nodes to build logic
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
