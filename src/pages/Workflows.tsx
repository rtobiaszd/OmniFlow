import React from 'react';
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
  Clock
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const workflows = [
  { id: 1, name: 'WhatsApp Lead Capture', description: 'Automatically creates a deal when a new contact messages on WhatsApp.', active: true, nodes: 5, executions: '1.2k' },
  { id: 2, name: 'Jira Sync Automation', description: 'Syncs pipeline stage changes to Jira issues.', active: false, nodes: 3, executions: '450' },
  { id: 3, name: 'AI Auto-Responder', description: 'Uses Gemini to respond to common customer inquiries.', active: true, nodes: 4, executions: '3.8k' },
  { id: 4, name: 'Abandoned Cart Follow-up', description: 'Sends a reminder message after 24 hours of inactivity.', active: true, nodes: 6, executions: '890' },
];

export function Workflows() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Workflows</h1>
          <p className="text-gray-500 mt-2">Automate your business processes with our visual engine.</p>
        </div>
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2">
          <Plus size={20} /> Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((wf) => (
          <div key={wf.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "p-4 rounded-2xl",
                wf.active ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-400"
              )}>
                <Zap size={32} />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"><Settings2 size={20} /></button>
                <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{wf.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{wf.description}</p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nodes</div>
                  <div className="text-lg font-bold text-gray-900">{wf.nodes}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Executions</div>
                  <div className="text-lg font-bold text-gray-900">{wf.executions}</div>
                </div>
              </div>
              <button className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                wf.active 
                  ? "bg-orange-50 text-orange-600 hover:bg-orange-100" 
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              )}>
                {wf.active ? <><Pause size={16} /> Deactivate</> : <><Play size={16} /> Activate</>}
              </button>
            </div>
          </div>
        ))}
      </div>

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
