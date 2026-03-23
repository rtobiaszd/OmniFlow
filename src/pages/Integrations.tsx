import React from 'react';
import { 
  Plug, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Plus,
  Search
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const integrations = [
  { id: 'whatsapp', name: 'WhatsApp', provider: 'Meta', status: 'connected', icon: 'W', color: 'bg-green-500' },
  { id: 'email', name: 'Email (SMTP/IMAP)', provider: 'Generic', status: 'connected', icon: 'E', color: 'bg-red-500' },
  { id: 'telegram', name: 'Telegram', provider: 'Telegram', status: 'disconnected', icon: 'T', color: 'bg-blue-400' },
  { id: 'jira', name: 'Jira Software', provider: 'Atlassian', status: 'error', icon: 'J', color: 'bg-blue-600' },
  { id: 'github', name: 'GitHub', provider: 'GitHub', status: 'disconnected', icon: 'G', color: 'bg-gray-900' },
  { id: 'slack', name: 'Slack', provider: 'Salesforce', status: 'disconnected', icon: 'S', color: 'bg-purple-600' },
];

export function Integrations() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Integrations</h1>
          <p className="text-gray-500 mt-2">Connect your favorite tools to automate your workflow.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search integrations..." 
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((int) => (
          <div key={int.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg",
                int.color
              )}>
                {int.icon}
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                int.status === 'connected' ? "bg-green-50 text-green-600" :
                int.status === 'error' ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"
              )}>
                {int.status === 'connected' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {int.status}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">{int.name}</h3>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">{int.provider}</p>
            </div>

            <div className="flex gap-2">
              <button className={cn(
                "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                int.status === 'connected' 
                  ? "bg-gray-50 text-gray-600 hover:bg-gray-100" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              )}>
                {int.status === 'connected' ? 'Configure' : 'Connect'}
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                <ExternalLink size={20} />
              </button>
            </div>
          </div>
        ))}
        
        <button className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <Plus size={32} />
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">Request Integration</div>
            <div className="text-xs mt-1">Don't see what you need?</div>
          </div>
        </button>
      </div>
    </div>
  );
}
