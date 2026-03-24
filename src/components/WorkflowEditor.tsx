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
  Loader2,
  Plug,
  Database,
  Trash2,
  FileText,
  Mail,
  Cloud,
  Slack
} from 'lucide-react';
import { Workflow, WorkflowNode } from '../types';
import { workflowService } from '../services/workflowService';
import { motion, AnimatePresence } from 'motion/react';

const NODE_TYPES = {
  trigger: { icon: Zap, color: 'bg-orange-500', label: 'Trigger' },
  action: { icon: MessageSquare, color: 'bg-blue-500', label: 'Action' },
  ai: { icon: Cpu, color: 'bg-purple-500', label: 'AI Logic' },
  delay: { icon: Clock, color: 'bg-yellow-500', label: 'Delay' },
  condition: { icon: GitMerge, color: 'bg-indigo-500', label: 'Condition' },
  webhook: { icon: Plug, color: 'bg-green-500', label: 'Webhook' },
  api: { icon: Database, color: 'bg-gray-700', label: 'Generic API' },
  google_sheets: { icon: FileText, color: 'bg-green-600', label: 'Google Sheets' },
  gmail: { icon: Mail, color: 'bg-red-500', label: 'Gmail' },
  slack_msg: { icon: Slack, color: 'bg-purple-600', label: 'Slack Message' },
  google_drive: { icon: Cloud, color: 'bg-blue-500', label: 'Google Drive' },
  google_cloud: { icon: Cloud, color: 'bg-indigo-600', label: 'Google Cloud' },
  schedule: { icon: Clock, color: 'bg-teal-500', label: 'Schedule' },
};

interface WorkflowEditorProps {
  workflow: Workflow;
  onClose: () => void;
}

export function WorkflowEditor({ workflow, onClose }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const renderNodeLabel = (type: string, data: any) => (
    <div className="flex items-center gap-2 p-2">
      <div className={`p-1.5 rounded-lg ${NODE_TYPES[type as keyof typeof NODE_TYPES]?.color || 'bg-gray-500'} text-white`}>
        {React.createElement(NODE_TYPES[type as keyof typeof NODE_TYPES]?.icon || Zap, { size: 14 })}
      </div>
      <div className="text-left">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
          {NODE_TYPES[type as keyof typeof NODE_TYPES]?.label || 'Node'}
        </div>
        <div className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{data.label || 'New Node'}</div>
      </div>
    </div>
  );

  useEffect(() => {
    // Map our workflow nodes to ReactFlow nodes
    const initialNodes: Node[] = workflow.nodes.map((n) => ({
      id: n.id,
      type: 'default',
      position: n.position,
      data: { 
        label: renderNodeLabel(n.type, n.data),
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

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const originalNode = node.data.originalNode as WorkflowNode;
          const updatedOriginal = { ...originalNode, data: { ...originalNode.data, ...newData } };
          return {
            ...node,
            data: {
              ...node.data,
              label: renderNodeLabel(originalNode.type, updatedOriginal.data),
              originalNode: updatedOriginal
            }
          };
        }
        return node;
      })
    );
    // Update selected node state to reflect changes in sidebar
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => {
        if (!prev) return null;
        const originalNode = prev.data.originalNode as WorkflowNode;
        const updatedOriginal = { ...originalNode, data: { ...originalNode.data, ...newData } };
        return {
          ...prev,
          data: {
            ...prev.data,
            label: renderNodeLabel(originalNode.type, updatedOriginal.data),
            originalNode: updatedOriginal
          }
        };
      });
    }
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  };

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
        label: renderNodeLabel(type, { label: `New ${NODE_TYPES[type].label}` }),
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
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
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

        {/* Configuration Sidebar */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 border-l border-gray-100 p-6 bg-white overflow-y-auto shrink-0"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Configure Node</h3>
                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Display Label</label>
                  <input 
                    type="text"
                    value={(selectedNode.data.originalNode as WorkflowNode).data.label || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* AI Logic Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'ai' && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">AI Prompt / Instruction</label>
                    <textarea 
                      value={(selectedNode.data.originalNode as WorkflowNode).data.prompt || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                      placeholder="e.g. Classify the user intent and extract the product name..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none"
                    />
                  </div>
                )}

                {/* Webhook Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'webhook' && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Webhook URL</label>
                    <input 
                      type="url"
                      value={(selectedNode.data.originalNode as WorkflowNode).data.url || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                      placeholder="https://api.example.com/webhook"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                )}

                {/* API Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'api' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Endpoint URL</label>
                      <input 
                        type="url"
                        value={(selectedNode.data.originalNode as WorkflowNode).data.url || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Method</label>
                      <select 
                        value={(selectedNode.data.originalNode as WorkflowNode).data.method || 'GET'}
                        onChange={(e) => updateNodeData(selectedNode.id, { method: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Google Sheets Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'google_sheets' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Spreadsheet ID</label>
                      <input 
                        type="text"
                        value={(selectedNode.data.originalNode as WorkflowNode).data.spreadsheetId || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { spreadsheetId: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Sheet Name</label>
                      <input 
                        type="text"
                        value={(selectedNode.data.originalNode as WorkflowNode).data.sheetName || 'Sheet1'}
                        onChange={(e) => updateNodeData(selectedNode.id, { sheetName: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Action</label>
                      <select 
                        value={(selectedNode.data.originalNode as WorkflowNode).data.action || 'APPEND'}
                        onChange={(e) => updateNodeData(selectedNode.id, { action: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="APPEND">Append Row</option>
                        <option value="UPDATE">Update Row</option>
                        <option value="GET">Get Row</option>
                        <option value="CLEAR">Clear Sheet</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Gmail Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'gmail' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">To</label>
                      <input 
                        type="email"
                        value={(selectedNode.data.originalNode as WorkflowNode).data.to || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { to: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Subject</label>
                      <input 
                        type="text"
                        value={(selectedNode.data.originalNode as WorkflowNode).data.subject || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { subject: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Body</label>
                      <textarea 
                        value={(selectedNode.data.originalNode as WorkflowNode).data.body || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { body: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Slack Message Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'slack_msg' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Channel ID</label>
                      <input 
                        type="text"
                        value={(selectedNode.data.originalNode as WorkflowNode).data.channelId || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { channelId: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Message</label>
                      <textarea 
                        value={(selectedNode.data.originalNode as WorkflowNode).data.message || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Google Cloud Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'google_cloud' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Service</label>
                      <select 
                        value={(selectedNode.data.originalNode as WorkflowNode).data.service || 'PUBSUB'}
                        onChange={(e) => updateNodeData(selectedNode.id, { service: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="PUBSUB">Pub/Sub</option>
                        <option value="FUNCTIONS">Cloud Functions</option>
                        <option value="STORAGE">Cloud Storage</option>
                        <option value="BIGQUERY">BigQuery</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Action / Payload</label>
                      <textarea 
                        value={(selectedNode.data.originalNode as WorkflowNode).data.payload || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { payload: e.target.value })}
                        placeholder='{"topic": "my-topic", "data": "..."}'
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Delay Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'delay' && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Delay Duration (minutes)</label>
                    <input 
                      type="number"
                      value={(selectedNode.data.originalNode as WorkflowNode).data.delay || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { delay: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                )}

                {/* Condition Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'condition' && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Condition Expression</label>
                    <input 
                      type="text"
                      value={(selectedNode.data.originalNode as WorkflowNode).data.condition || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                      placeholder="e.g. status === 'active'"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-2">Use JavaScript expressions to evaluate the condition.</p>
                  </div>
                )}

                {/* Schedule Configuration */}
                {(selectedNode.data.originalNode as WorkflowNode).type === 'schedule' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Frequency</label>
                      <select 
                        value={(selectedNode.data.originalNode as WorkflowNode).data.frequency || 'DAILY'}
                        onChange={(e) => updateNodeData(selectedNode.id, { frequency: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="HOURLY">Hourly</option>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Time (HH:MM)</label>
                      <input 
                        type="time"
                        value={(selectedNode.data.originalNode as WorkflowNode).data.time || '09:00'}
                        onChange={(e) => updateNodeData(selectedNode.id, { time: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => deleteNode(selectedNode.id)}
                    className="w-full py-2 text-red-600 bg-red-50 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete Node
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
