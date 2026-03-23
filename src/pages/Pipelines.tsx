import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Filter, 
  ChevronRight,
  User,
  Clock,
  Settings,
  X,
  PlusCircle,
  Layout,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Pipeline, Stage, Deal, CustomField } from '../types';
import { pipelineService } from '../services/pipelineService';
import { useAuth } from '../contexts/AuthContext';

export function Pipelines() {
  const { profile } = useAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddingPipeline, setIsAddingPipeline] = useState(false);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPipelineName, setNewPipelineName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'select'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealCompany, setNewDealCompany] = useState('');
  const [newDealCustomValues, setNewDealCustomValues] = useState<Record<string, any>>({});
  const [targetStageId, setTargetStageId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.tenantId) return;

    const unsubPipelines = pipelineService.subscribeToPipelines(profile.tenantId, (pipes) => {
      setPipelines(pipes);
      if (pipes.length > 0 && !activePipelineId) {
        setActivePipelineId(pipes[0].id);
      }
      setLoading(false);
    });

    const unsubDeals = pipelineService.subscribeToDeals(profile.tenantId, (allDeals) => {
      setDeals(allDeals);
    });

    return () => {
      unsubPipelines();
      unsubDeals();
    };
  }, [profile?.tenantId]);

  const activePipeline = pipelines.find(p => p.id === activePipelineId);

  const handleAddDeal = async () => {
    if (!newDealTitle || !activePipelineId || !targetStageId || !profile?.tenantId) return;
    setIsSubmitting(true);
    try {
      await pipelineService.createDeal(profile.tenantId, {
        title: newDealTitle,
        company: newDealCompany,
        value: Number(newDealValue) || 0,
        stageId: targetStageId,
        pipelineId: activePipelineId,
        priority: 'medium',
        status: 'open',
        customValues: newDealCustomValues,
        assignedTo: profile.name || 'User',
        contactId: '' // Optional for now
      });
      setNewDealTitle('');
      setNewDealValue('');
      setNewDealCompany('');
      setNewDealCustomValues({});
      setIsAddingDeal(false);
    } catch (error) {
      console.error('Error adding deal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDeal = async () => {
    if (!editingDeal || !profile?.tenantId) return;
    setIsSubmitting(true);
    try {
      await pipelineService.updateDeal({
        ...editingDeal,
        value: Number(editingDeal.value) || 0
      });
      setEditingDeal(null);
    } catch (error) {
      console.error('Error updating deal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPipeline = async () => {
    if (!newPipelineName || !profile?.tenantId) return;
    setIsSubmitting(true);
    try {
      const newP = await pipelineService.createPipeline(profile.tenantId, newPipelineName);
      if (newP) setActivePipelineId(newP.id);
      setNewPipelineName('');
      setIsAddingPipeline(false);
    } catch (error) {
      console.error('Error adding pipeline:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePipeline = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pipeline? All stages and deals will be lost.')) return;
    try {
      await pipelineService.deletePipeline(id);
      if (activePipelineId === id) setActivePipelineId(null);
    } catch (error) {
      console.error('Error deleting pipeline:', error);
    }
  };

  const handleAddStage = async () => {
    if (!newStageName || !activePipeline) return;
    setIsSubmitting(true);
    try {
      const newStage: Stage = {
        id: `stage_${Date.now()}`,
        name: newStageName,
        order: activePipeline.stages.length,
        color: 'bg-indigo-500'
      };
      await pipelineService.updatePipeline({
        id: activePipeline.id,
        stages: [...(activePipeline.stages || []), newStage]
      });
      setNewStageName('');
      setIsAddingStage(false);
    } catch (error) {
      console.error('Error adding stage:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddField = async () => {
    if (!newFieldName || !activePipeline) return;
    setIsSubmitting(true);
    try {
      const newField: CustomField = {
        id: `field_${Date.now()}`,
        name: newFieldName,
        type: newFieldType,
        required: newFieldRequired,
        options: newFieldType === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(o => o) : undefined
      };
      await pipelineService.updatePipeline({
        id: activePipeline.id,
        customFields: [...(activePipeline.customFields || []), newField]
      });
      setNewFieldName('');
      setNewFieldOptions('');
      setNewFieldRequired(false);
      setIsAddingField(false);
    } catch (error) {
      console.error('Error adding field:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-8 pb-4 flex justify-between items-center bg-white border-b border-gray-100">
        <div className="flex items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span>CRM</span> <ChevronRight size={14} /> <span className="font-semibold text-gray-900">Pipelines</span>
            </div>
            <div className="flex items-center gap-4">
              {pipelines.length > 0 ? (
                <select 
                  value={activePipelineId || ''} 
                  onChange={(e) => setActivePipelineId(e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <span className="text-2xl font-bold text-gray-400 italic">No Pipelines</span>
              )}
              <button 
                onClick={() => setIsAddingPipeline(true)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="New Pipeline"
              >
                <PlusCircle size={20} />
              </button>
              {activePipeline && (
                <button 
                  onClick={() => handleDeletePipeline(activePipeline.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Pipeline"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="h-10 w-px bg-gray-200"></div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddingField(true)}
              disabled={!activePipeline}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-gray-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings size={14} /> Custom Fields
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search deals..." className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button 
            onClick={() => {
              if (activePipeline?.stages?.length) {
                setTargetStageId(activePipeline.stages[0].id);
                setIsAddingDeal(true);
              }
            }}
            disabled={!activePipeline}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> New Deal
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-8 pt-6 flex gap-6 items-start">
        {activePipeline?.stages?.sort((a, b) => a.order - b.order).map((stage) => (
          <div key={stage.id} className="w-80 shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", stage.color)}></div>
                <span className="font-bold text-gray-900">{stage.name}</span>
                <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {deals.filter(d => d.stageId === stage.id && d.pipelineId === activePipelineId).length}
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pb-4 max-h-[calc(100vh-250px)]">
              {deals.filter(d => d.stageId === stage.id && d.pipelineId === activePipelineId).map((deal) => (
                <motion.div 
                  key={deal.id}
                  layoutId={deal.id}
                  onClick={() => setEditingDeal(deal)}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{deal.title}</h4>
                    <button className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal size={16} /></button>
                  </div>
                  <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <User size={12} /> {deal.company}
                  </div>
                  
                  {/* Custom Fields Display */}
                  {activePipeline?.customFields?.map(field => (
                    deal.customValues?.[field.id] && (
                      <div key={field.id} className="mb-2 px-2 py-1 bg-gray-50 rounded text-[10px] text-gray-500 flex justify-between">
                        <span className="font-medium">{field.name}:</span>
                        <span>{deal.customValues[field.id]}</span>
                      </div>
                    )
                  ))}

                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm font-bold text-gray-900">
                      {deal.value > 0 ? `$${deal.value.toLocaleString()}` : 'No Value'}
                    </div>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600">
                        {deal.assignedTo?.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <button 
                onClick={() => {
                  setTargetStageId(stage.id);
                  setIsAddingDeal(true);
                }}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Add Deal
              </button>
            </div>
          </div>
        ))}

        {/* Add Stage Button */}
        {activePipeline && (
          <button 
            onClick={() => setIsAddingStage(true)}
            className="w-80 shrink-0 h-[calc(100vh-250px)] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
              <Plus size={32} />
            </div>
            <span className="font-bold">Add New Stage</span>
          </button>
        )}

        {!activePipeline && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <Layout size={64} className="opacity-20" />
            <p className="font-medium">Create a pipeline to start managing deals</p>
            <button 
              onClick={() => setIsAddingPipeline(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Create First Pipeline
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAddingDeal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">New Deal</h3>
                <button onClick={() => setIsAddingDeal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleAddDeal(); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Dynamic Custom Fields - Moved to top as requested */}
                {activePipeline?.customFields?.map(field => (
                  <div key={field.id}>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      {field.name} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select 
                        value={newDealCustomValues[field.id] || ''}
                        onChange={(e) => setNewDealCustomValues({...newDealCustomValues, [field.id]: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                        required={field.required}
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={newDealCustomValues[field.id] || ''}
                        onChange={(e) => setNewDealCustomValues({...newDealCustomValues, [field.id]: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Deal Title</label>
                  <input 
                    type="text" 
                    value={newDealTitle}
                    onChange={(e) => setNewDealTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Company</label>
                  <input 
                    type="text" 
                    value={newDealCompany}
                    onChange={(e) => setNewDealCompany(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Value ($)</label>
                  <input 
                    type="number" 
                    value={newDealValue}
                    onChange={(e) => setNewDealValue(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Deal'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {editingDeal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Deal</h3>
                <button onClick={() => setEditingDeal(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateDeal(); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Deal Title</label>
                  <input 
                    type="text" 
                    value={editingDeal.title}
                    onChange={(e) => setEditingDeal({...editingDeal, title: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Company</label>
                  <input 
                    type="text" 
                    value={editingDeal.company}
                    onChange={(e) => setEditingDeal({...editingDeal, company: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Value ($)</label>
                  <input 
                    type="number" 
                    value={editingDeal.value}
                    onChange={(e) => setEditingDeal({...editingDeal, value: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Dynamic Custom Fields */}
                {activePipeline?.customFields.map(field => (
                  <div key={field.id}>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      {field.name} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select 
                        value={editingDeal.customValues?.[field.id] || ''}
                        onChange={(e) => setEditingDeal({
                          ...editingDeal, 
                          customValues: { ...editingDeal.customValues, [field.id]: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                        required={field.required}
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={editingDeal.customValues?.[field.id] || ''}
                        onChange={(e) => setEditingDeal({
                          ...editingDeal, 
                          customValues: { ...editingDeal.customValues, [field.id]: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {isAddingPipeline && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">New Pipeline</h3>
                <button onClick={() => setIsAddingPipeline(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Pipeline Name</label>
                  <input 
                    type="text" 
                    value={newPipelineName}
                    onChange={(e) => setNewPipelineName(e.target.value)}
                    placeholder="e.g. Real Estate Sales" 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button 
                  onClick={handleAddPipeline}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Pipeline'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingStage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">New Stage</h3>
                <button onClick={() => setIsAddingStage(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Stage Name</label>
                  <input 
                    type="text" 
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="e.g. Contract Signed" 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button 
                  onClick={handleAddStage}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Add Stage'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingField && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Custom Fields</h3>
                <button onClick={() => setIsAddingField(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  {activePipeline?.customFields.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{f.name}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">{f.type}</div>
                      </div>
                      <button 
                        onClick={async () => {
                          if (!activePipeline) return;
                          await pipelineService.updatePipeline({
                            id: activePipeline.id,
                            customFields: activePipeline.customFields.filter(field => field.id !== f.id)
                          });
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900">Add New Field</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="Field Name" 
                      className="px-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <select 
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as any)}
                      className="px-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Select (Dropdown)</option>
                    </select>
                  </div>
                  {newFieldType === 'select' && (
                    <div className="mt-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Options (comma separated)</label>
                      <input 
                        type="text" 
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="e.g. Hot, Warm, Cold" 
                        className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="required"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="required" className="text-xs font-bold text-gray-700">Mark as Required</label>
                  </div>
                  <button 
                    onClick={handleAddField}
                    disabled={isSubmitting}
                    className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Add Field</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
