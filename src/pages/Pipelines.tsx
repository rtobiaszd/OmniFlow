import React from 'react';
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
  Layout
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Pipeline, Stage, Deal, CustomField } from '@/src/types';

export function Pipelines() {
  const [pipelines, setPipelines] = React.useState<Pipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = React.useState<string | null>(null);
  const [deals, setDeals] = React.useState<Deal[]>([
    { id: '1', title: 'Enterprise License', company: 'TechCorp', value: 12000, stageId: 's1', pipelineId: 'p1', priority: 'high', status: 'open', customValues: {}, assignedTo: 'JD', createdAt: '2026-03-20', contactId: 'c1' },
    { id: '2', title: 'API Integration', company: 'GlobalSoft', value: 5500, stageId: 's1', pipelineId: 'p1', priority: 'medium', status: 'open', customValues: {}, assignedTo: 'AS', createdAt: '2026-03-21', contactId: 'c2' },
    { id: '3', title: 'Support Issue #1', company: 'StartupInc', value: 0, stageId: 's7', pipelineId: 'p2', priority: 'high', status: 'open', customValues: { cf3: 'P0' }, assignedTo: 'JD', createdAt: '2026-03-22', contactId: 'c3' },
  ]);

  const [isAddingPipeline, setIsAddingPipeline] = React.useState(false);
  const [isAddingStage, setIsAddingStage] = React.useState(false);
  const [isAddingField, setIsAddingField] = React.useState(false);
  const [isAddingDeal, setIsAddingDeal] = React.useState(false);
  const [newPipelineName, setNewPipelineName] = React.useState('');
  const [newStageName, setNewStageName] = React.useState('');
  const [newFieldName, setNewFieldName] = React.useState('');
  const [newFieldType, setNewFieldType] = React.useState<'text' | 'number' | 'date' | 'select'>('text');
  
  const [newDealTitle, setNewDealTitle] = React.useState('');
  const [newDealValue, setNewDealValue] = React.useState('');
  const [newDealCompany, setNewDealCompany] = React.useState('');
  const [newDealCustomValues, setNewDealCustomValues] = React.useState<Record<string, any>>({});
  const [targetStageId, setTargetStageId] = React.useState<string | null>(null);

  const addDeal = () => {
    if (!newDealTitle || !activePipelineId || !targetStageId) return;
    const newD: Deal = {
      id: `d${Date.now()}`,
      title: newDealTitle,
      company: newDealCompany,
      value: Number(newDealValue) || 0,
      stageId: targetStageId,
      pipelineId: activePipelineId,
      priority: 'medium',
      status: 'open',
      customValues: newDealCustomValues,
      assignedTo: 'JD',
      createdAt: new Date().toISOString().split('T')[0],
      contactId: 'c_new'
    };
    setDeals([...deals, newD]);
    setNewDealTitle('');
    setNewDealValue('');
    setNewDealCompany('');
    setNewDealCustomValues({});
    setIsAddingDeal(false);
  };

  React.useEffect(() => {
    fetch('/api/pipelines')
      .then(res => res.json())
      .then(data => {
        setPipelines(data);
        if (data.length > 0) setActivePipelineId(data[0].id);
      });
  }, []);

  const activePipeline = pipelines.find(p => p.id === activePipelineId);

  const addPipeline = () => {
    if (!newPipelineName) return;
    const newP: Pipeline = {
      id: `p${Date.now()}`,
      name: newPipelineName,
      stages: [
        { id: `s${Date.now()}`, name: 'New Stage', order: 0, color: 'bg-blue-500' }
      ],
      customFields: []
    };
    setPipelines([...pipelines, newP]);
    setActivePipelineId(newP.id);
    setNewPipelineName('');
    setIsAddingPipeline(false);
  };

  const addStage = () => {
    if (!newStageName || !activePipelineId) return;
    const updatedPipelines = pipelines.map(p => {
      if (p.id === activePipelineId) {
        return {
          ...p,
          stages: [...p.stages, { id: `s${Date.now()}`, name: newStageName, order: p.stages.length, color: 'bg-indigo-500' }]
        };
      }
      return p;
    });
    setPipelines(updatedPipelines);
    setNewStageName('');
    setIsAddingStage(false);
  };

  const addField = () => {
    if (!newFieldName || !activePipelineId) return;
    const updatedPipelines = pipelines.map(p => {
      if (p.id === activePipelineId) {
        return {
          ...p,
          customFields: [...p.customFields, { id: `cf${Date.now()}`, name: newFieldName, type: newFieldType, required: false }]
        };
      }
      return p;
    });
    setPipelines(updatedPipelines);
    setNewFieldName('');
    setIsAddingField(false);
  };

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
              <select 
                value={activePipelineId || ''} 
                onChange={(e) => setActivePipelineId(e.target.value)}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 cursor-pointer hover:text-indigo-600 transition-colors"
              >
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsAddingPipeline(true)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="New Pipeline"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </div>

          <div className="h-10 w-px bg-gray-200"></div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddingField(true)}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-gray-200 flex items-center gap-2"
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
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200">
            <Plus size={16} /> New Deal
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-8 pt-6 flex gap-6 items-start">
        {activePipeline?.stages.sort((a, b) => a.order - b.order).map((stage) => (
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
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{deal.title}</h4>
                    <button className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal size={16} /></button>
                  </div>
                  <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <User size={12} /> {deal.company}
                  </div>
                  
                  {/* Custom Fields Display */}
                  {activePipeline.customFields.map(field => (
                    deal.customValues[field.id] && (
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
                        {deal.assignedTo}
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
        <button 
          onClick={() => setIsAddingStage(true)}
          className="w-80 shrink-0 h-[calc(100vh-250px)] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all group"
        >
          <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
            <Plus size={32} />
          </div>
          <span className="font-bold">Add New Stage</span>
        </button>
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
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Deal Title</label>
                  <input 
                    type="text" 
                    value={newDealTitle}
                    onChange={(e) => setNewDealTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
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
                
                {/* Dynamic Custom Fields */}
                {activePipeline?.customFields.map(field => (
                  <div key={field.id}>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{field.name}</label>
                    {field.type === 'select' ? (
                      <select 
                        onChange={(e) => setNewDealCustomValues({...newDealCustomValues, [field.id]: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        onChange={(e) => setNewDealCustomValues({...newDealCustomValues, [field.id]: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                ))}

                <button 
                  onClick={addDeal}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4"
                >
                  Create Deal
                </button>
              </div>
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
                  onClick={addPipeline}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Create Pipeline
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
                  onClick={addStage}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Add Stage
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
                      <button className="text-red-400 hover:text-red-600"><X size={16} /></button>
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
                      <option value="select">Select</option>
                    </select>
                  </div>
                  <button 
                    onClick={addField}
                    className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Field
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
