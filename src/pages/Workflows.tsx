import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Settings2,
  GitMerge,
  MessageSquare,
  Database,
  Cpu,
  Clock,
  X,
  Loader2,
  Plug,
  Layout,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { workflowService } from '../services/workflowService';
import { integrationService } from '../services/integrationService';
import { pipelineService } from '../services/pipelineService';
import { Workflow, Integration, Pipeline } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { WorkflowEditor } from '../components/WorkflowEditor';

const WORKFLOW_TEMPLATES = [
  {
    id: 'template-fruit',
    name: 'Frutaria: Alerta de Estoque Baixo',
    description: 'Notifica o gerente quando o estoque de frutas sazonais atinge um nível crítico.',
    niche: 'Frutaria',
    nodes: [
      { id: '1', type: 'trigger' as const, data: { label: 'Estoque Baixo' }, position: { x: 250, y: 0 } },
      { id: '2', type: 'action' as const, data: { label: 'Enviar WhatsApp Gerente' }, position: { x: 250, y: 100 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }]
  },
  {
    id: 'template-grocery',
    name: 'Mercearia: Promoção Relâmpago',
    description: 'Envia ofertas para clientes VIP quando novos produtos chegam.',
    niche: 'Mercearia',
    nodes: [
      { id: '1', type: 'trigger' as const, data: { label: 'Novo Produto Chegou' }, position: { x: 250, y: 0 } },
      { id: '2', type: 'ai' as const, data: { label: 'Gerar Texto Promocional' }, position: { x: 250, y: 100 } },
      { id: '3', type: 'action' as const, data: { label: 'Disparar Email Marketing' }, position: { x: 250, y: 200 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }]
  },
  {
    id: 'template-restaurant',
    name: 'Restaurante: Confirmação de Reserva',
    description: 'Automatiza a confirmação de mesas via WhatsApp e Email.',
    niche: 'Restaurante',
    nodes: [
      { id: '1', type: 'trigger' as const, data: { label: 'Nova Reserva' }, position: { x: 250, y: 0 } },
      { id: '2', type: 'action' as const, data: { label: 'Confirmar via WhatsApp' }, position: { x: 250, y: 100 } },
      { id: '3', type: 'delay' as const, data: { label: 'Aguardar 1h antes' }, position: { x: 250, y: 200 } },
      { id: '4', type: 'action' as const, data: { label: 'Lembrete Final' }, position: { x: 250, y: 300 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }, { id: 'e3-4', source: '3', target: '4' }]
  },
  {
    id: 'template-realestate',
    name: 'Imobiliária: Qualificação de Lead',
    description: 'Usa IA para qualificar leads que entram via formulário ou WhatsApp.',
    niche: 'Imobiliária',
    nodes: [
      { id: '1', type: 'trigger' as const, data: { label: 'Novo Lead' }, position: { x: 250, y: 0 } },
      { id: '2', type: 'ai' as const, data: { label: 'Qualificar Perfil', prompt: 'Analise o interesse do lead e classifique em: Quente, Morno ou Frio.' }, position: { x: 250, y: 100 } },
      { id: '3', type: 'condition' as const, data: { label: 'Lead Quente?' }, position: { x: 250, y: 200 } },
      { id: '4', type: 'action' as const, data: { label: 'Notificar Corretor VIP' }, position: { x: 100, y: 300 } },
      { id: '5', type: 'action' as const, data: { label: 'Enviar Email Nutrição' }, position: { x: 400, y: 300 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }, { id: 'e3-4', source: '3', target: '4' }, { id: 'e3-5', source: '3', target: '5' }]
  },
  {
    id: 'template-ecommerce',
    name: 'E-commerce: Carrinho Abandonado',
    description: 'Recupera vendas enviando cupons de desconto após 2 horas.',
    niche: 'E-commerce',
    nodes: [
      { id: '1', type: 'trigger' as const, data: { label: 'Carrinho Abandonado' }, position: { x: 250, y: 0 } },
      { id: '2', type: 'delay' as const, data: { label: 'Aguardar 2h', delay: 120 }, position: { x: 250, y: 100 } },
      { id: '3', type: 'ai' as const, data: { label: 'Gerar Cupom Personalizado' }, position: { x: 250, y: 200 } },
      { id: '4', type: 'action' as const, data: { label: 'Enviar WhatsApp Recuperação' }, position: { x: 250, y: 300 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }, { id: 'e3-4', source: '3', target: '4' }]
  },
  {
    id: 'template-education',
    name: 'Educação: Matrícula de Aluno',
    description: 'Automatiza o processo de matrícula e envio de material didático.',
    niche: 'Educação',
    nodes: [
      { id: '1', type: 'trigger' as const, data: { label: 'Nova Matrícula' }, position: { x: 250, y: 0 } },
      { id: '2', type: 'action' as const, data: { label: 'Gerar Acesso Portal' }, position: { x: 250, y: 100 } },
      { id: '3', type: 'action' as const, data: { label: 'Enviar Material PDF' }, position: { x: 250, y: 200 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }]
  },
  {
    id: 'template-health',
    name: 'Saúde: Lembrete de Consulta',
    description: 'Envia lembretes via WhatsApp 24h antes da consulta médica.',
    niche: 'Saúde',
    nodes: [
      { id: '1', type: 'trigger' as const, data: { label: 'Consulta Agendada' }, position: { x: 250, y: 0 } },
      { id: '2', type: 'delay' as const, data: { label: 'Aguardar T-24h' }, position: { x: 250, y: 100 } },
      { id: '3', type: 'action' as const, data: { label: 'Confirmar Presença' }, position: { x: 250, y: 200 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }]
  },
  {
    id: 'template-logistics',
    name: 'Logística: Rastreio de Pedido',
    description: 'Notifica o cliente sobre cada mudança no status da entrega.',
    niche: 'Logística',
    nodes: [
      { id: '1', type: 'trigger' as const, data: { label: 'Status Alterado' }, position: { x: 250, y: 0 } },
      { id: '2', type: 'condition' as const, data: { label: 'Em Rota?' }, position: { x: 250, y: 100 } },
      { id: '3', type: 'action' as const, data: { label: 'Enviar SMS Rastreio' }, position: { x: 250, y: 200 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }]
  }
];

export function Workflows() {
  const { profile } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWf, setEditingWf] = useState<Workflow | null>(null);
  const [visualEditingWf, setVisualEditingWf] = useState<Workflow | null>(null);
  const [newWf, setNewWf] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.tenantId) return;

    const unsubWorkflows = workflowService.subscribeToWorkflows(profile.tenantId, (data) => {
      setWorkflows(data);
      setLoading(false);
    });

    const unsubIntegrations = integrationService.subscribeToIntegrations(profile.tenantId, (data) => {
      setIntegrations(data);
    });

    const unsubPipelines = pipelineService.subscribeToPipelines(profile.tenantId, (data) => {
      setPipelines(data);
    });

    return () => {
      unsubWorkflows();
      unsubIntegrations();
      unsubPipelines();
    };
  }, [profile?.tenantId]);

  const handleCreateFromTemplate = async (template: typeof WORKFLOW_TEMPLATES[0]) => {
    if (!profile?.tenantId) return;
    setIsSubmitting(true);
    try {
      const wf = await workflowService.createWorkflow(profile.tenantId, template.name, template.description);
      if (wf) {
        await workflowService.updateWorkflow({
          ...wf,
          nodes: template.nodes,
          edges: template.edges
        });
      }
    } catch (error) {
      console.error('Error creating from template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenantId || !newWf.name) return;

    setIsSubmitting(true);
    try {
      await workflowService.createWorkflow(profile.tenantId, newWf.name, newWf.description);
      setIsCreating(false);
      setNewWf({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating workflow:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWf) return;

    setIsSubmitting(true);
    try {
      await workflowService.updateWorkflow(editingWf);
      setEditingWf(null);
    } catch (error) {
      console.error('Error updating workflow:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await workflowService.deleteWorkflow(id);
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await workflowService.toggleActive(id, !currentActive);
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Workflows</h1>
          <p className="text-gray-500 mt-2">Automate your business processes with our visual engine.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2"
        >
          <Plus size={20} /> Create Workflow
        </button>
      </div>

      {/* Templates Section */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Layout size={20} className="text-indigo-600" />
          Sugestões por Nicho
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WORKFLOW_TEMPLATES.map(template => (
            <motion.div 
              key={template.id}
              whileHover={{ y: -4 }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {template.niche}
                </span>
                <Zap size={18} className="text-gray-300 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-xs text-gray-500 mb-6 line-clamp-2 leading-relaxed">{template.description}</p>
              <button 
                onClick={() => handleCreateFromTemplate(template)}
                disabled={isSubmitting}
                className="w-full py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : (
                  <>
                    Usar Template
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p>Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
            <Zap size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No workflows found</p>
            <p className="text-sm">Create your first automation to get started.</p>
          </div>
        ) : (
          workflows.map((wf) => (
            <motion.div 
              layout
              key={wf.id} 
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "p-4 rounded-2xl",
                  wf.active ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-400"
                )}>
                  <Zap size={32} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingWf(wf)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Settings2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(wf.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{wf.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{wf.description}</p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {wf.integrationId && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <Plug size={12} />
                      {integrations.find(i => i.id === wf.integrationId)?.name || 'Integration'}
                    </div>
                  )}
                  {wf.pipelineId && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <Layout size={12} />
                      {pipelines.find(p => p.id === wf.pipelineId)?.name || 'Pipeline'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nodes</div>
                    <div className="text-lg font-bold text-gray-900">{wf.nodes?.length || 0}</div>
                  </div>
                  <button 
                    onClick={() => setVisualEditingWf(wf)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
                  >
                    <GitMerge size={16} /> Edit Logic
                  </button>
                </div>
                <button 
                  onClick={() => handleToggle(wf.id, wf.active)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                    wf.active 
                      ? "bg-orange-50 text-orange-600 hover:bg-orange-100" 
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  )}
                >
                  {wf.active ? <><Pause size={16} /> Deactivate</> : <><Play size={16} /> Activate</>}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Workflow</h3>
                <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Workflow Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. WhatsApp Auto-Responder"
                    value={newWf.name}
                    onChange={(e) => setNewWf({ ...newWf, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                  <textarea 
                    placeholder="What does this workflow do?"
                    value={newWf.description}
                    onChange={(e) => setNewWf({ ...newWf, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Workflow'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {editingWf && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Workflow Settings</h3>
                <button onClick={() => setEditingWf(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Name</label>
                    <input 
                      type="text"
                      required
                      value={editingWf.name}
                      onChange={(e) => setEditingWf({ ...editingWf, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                    <textarea 
                      value={editingWf.description}
                      onChange={(e) => setEditingWf({ ...editingWf, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-20 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Settings2 size={16} className="text-indigo-600" />
                    Links & Connections
                  </h4>
                  
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Link Integration</label>
                    <select 
                      value={editingWf.integrationId || ''}
                      onChange={(e) => setEditingWf({ ...editingWf, integrationId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">No Integration</option>
                      {integrations.map(int => (
                        <option key={int.id} value={int.id}>{int.name} ({int.provider})</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">This workflow will trigger or act on this integration.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Link Pipeline</label>
                    <select 
                      value={editingWf.pipelineId || ''}
                      onChange={(e) => setEditingWf({ ...editingWf, pipelineId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">No Pipeline</option>
                      {pipelines.map(pipe => (
                        <option key={pipe.id} value={pipe.id}>{pipe.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">This workflow will create or update deals in this pipeline.</p>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visualEditingWf && (
          <WorkflowEditor 
            workflow={visualEditingWf} 
            onClose={() => setVisualEditingWf(null)} 
          />
        )}
      </AnimatePresence>

      <div className="bg-[#151619] text-white p-12 rounded-[40px] relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4 italic">Workflow Engine v2.0</h2>
          <p className="text-gray-400 leading-relaxed mb-8">
            Our new node-based engine supports AI decision making, external API calls, and complex conditional branching. 
            Build your own logic or use one of our pre-built templates.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <GitMerge size={18} className="text-indigo-400" />
              <span className="text-sm font-medium">Branching</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <Cpu size={18} className="text-purple-400" />
              <span className="text-sm font-medium">AI Logic</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <Clock size={18} className="text-orange-400" />
              <span className="text-sm font-medium">Delays</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Zap size={400} className="translate-x-1/4 -translate-y-1/4" />
        </div>
      </div>
    </div>
  );
}
