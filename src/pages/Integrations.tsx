import React, { useState, useEffect } from 'react';
import { 
  Plug, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Plus,
  Search,
  Loader2,
  Settings,
  X,
  Trash2,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { integrationService } from '../services/integrationService';
import { Integration } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const AVAILABLE_INTEGRATIONS = [
  { id: 'whatsapp', name: 'WhatsApp', provider: 'Meta', icon: 'W', color: 'bg-green-500', description: 'Connect your business WhatsApp account.' },
  { id: 'facebook', name: 'Facebook Messenger', provider: 'Meta', icon: 'F', color: 'bg-blue-700', description: 'Automate customer support on your FB Page.' },
  { id: 'instagram', name: 'Instagram DM', provider: 'Meta', icon: 'I', color: 'bg-pink-600', description: 'Manage Instagram Direct Messages automatically.' },
  { id: 'email', name: 'Email (SMTP/IMAP)', provider: 'Generic', icon: 'E', color: 'bg-red-500', description: 'Sync your professional email inbox.' },
  { id: 'telegram', name: 'Telegram', provider: 'Telegram', icon: 'T', color: 'bg-blue-400', description: 'Automate support via Telegram bots.' },
  { id: 'jira', name: 'Jira Software', provider: 'Atlassian', icon: 'J', color: 'bg-blue-600', description: 'Sync tickets with Jira projects.' },
  { id: 'github', name: 'GitHub', provider: 'GitHub', icon: 'G', color: 'bg-gray-900', description: 'Track issues and PRs in your CRM.' },
  { id: 'slack', name: 'Slack', provider: 'Salesforce', icon: 'S', color: 'bg-purple-600', description: 'Get real-time notifications in Slack.' },
  { id: 'webhook', name: 'Webhook', provider: 'Generic', icon: 'W', color: 'bg-orange-600', description: 'Receive events from any service via webhooks.' },
  { id: 'api', name: 'Custom API', provider: 'Generic', icon: 'A', color: 'bg-indigo-600', description: 'Connect to any REST API with custom auth.' },
  { id: 'google_calendar', name: 'Google Calendar', provider: 'Google', icon: 'G', color: 'bg-blue-500', description: 'Sync your appointments with Google.' },
  { id: 'outlook_calendar', name: 'Outlook Calendar', provider: 'Microsoft', icon: 'O', color: 'bg-blue-600', description: 'Sync your appointments with Outlook.' },
];

export function Integrations() {
  const { profile } = useAuth();
  const [connectedIntegrations, setConnectedIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectingInt, setConnectingInt] = useState<typeof AVAILABLE_INTEGRATIONS[0] | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.tenantId) return;

    const unsubscribe = integrationService.subscribeToIntegrations(profile.tenantId, (data) => {
      setConnectedIntegrations(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.tenantId]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenantId || !connectingInt) return;
    
    setIsSubmitting(true);
    try {
      await integrationService.connectIntegration(
        profile.tenantId, 
        connectingInt.id as any, 
        connectingInt.name,
        credentials
      );
      setConnectingInt(null);
      setCredentials({});
    } catch (error) {
      console.error('Error connecting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration? All credentials will be removed.')) return;
    try {
      await integrationService.disconnectIntegration(id);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const renderCredentialFields = () => {
    if (!connectingInt) return null;

    const fields: Record<string, { label: string, type: string, placeholder: string }> = {};
    
    switch (connectingInt.id) {
      case 'whatsapp':
        fields.apiKey = { label: 'API Key', type: 'password', placeholder: 'Meta Cloud API Key' };
        fields.phoneNumberId = { label: 'Phone Number ID', type: 'text', placeholder: 'e.g. 1059382...' };
        break;
      case 'facebook':
        fields.pageId = { label: 'Page ID', type: 'text', placeholder: 'Your Facebook Page ID' };
        fields.accessToken = { label: 'Page Access Token', type: 'password', placeholder: 'EAAB...' };
        break;
      case 'instagram':
        fields.instagramId = { label: 'Instagram Business ID', type: 'text', placeholder: 'e.g. 178414...' };
        fields.accessToken = { label: 'Access Token', type: 'password', placeholder: 'EAAB...' };
        break;
      case 'email':
        fields.imapHost = { label: 'IMAP Host (Receiving)', type: 'text', placeholder: 'imap.gmail.com' };
        fields.smtpHost = { label: 'SMTP Host (Sending)', type: 'text', placeholder: 'smtp.gmail.com' };
        fields.user = { label: 'Email / Username', type: 'text', placeholder: 'user@example.com' };
        fields.pass = { label: 'App Password', type: 'password', placeholder: 'xxxx xxxx xxxx xxxx' };
        break;
      case 'telegram':
        fields.botToken = { label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...' };
        break;
      case 'jira':
        fields.url = { label: 'Instance URL', type: 'text', placeholder: 'https://company.atlassian.net' };
        fields.email = { label: 'Email', type: 'email', placeholder: 'admin@company.com' };
        fields.token = { label: 'API Token', type: 'password', placeholder: 'Your Jira API Token' };
        break;
      case 'github':
        fields.token = { label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...' };
        break;
      case 'slack':
        fields.webhookUrl = { label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/...' };
        break;
      case 'webhook':
        fields.url = { label: 'Webhook URL', type: 'text', placeholder: 'https://your-app.com/api/webhook' };
        fields.secret = { label: 'Webhook Secret (Optional)', type: 'password', placeholder: 'For signature verification' };
        break;
      case 'api':
        fields.baseUrl = { label: 'Base URL', type: 'text', placeholder: 'https://api.example.com/v1' };
        fields.authType = { label: 'Auth Type (Bearer/Basic/None)', type: 'text', placeholder: 'Bearer' };
        fields.token = { label: 'Auth Token / Key', type: 'password', placeholder: 'Your API Key' };
        fields.headerName = { label: 'Auth Header Name', type: 'text', placeholder: 'Authorization' };
        break;
      case 'google_calendar':
      case 'outlook_calendar':
        fields.clientId = { label: 'Client ID', type: 'text', placeholder: 'OAuth Client ID' };
        fields.clientSecret = { label: 'Client Secret', type: 'password', placeholder: 'OAuth Client Secret' };
        break;
    }

    return Object.entries(fields).map(([key, config]) => (
      <div key={key}>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{config.label}</label>
        <input 
          type={config.type}
          required
          placeholder={config.placeholder}
          value={credentials[key] || ''}
          onChange={(e) => setCredentials({ ...credentials, [key]: e.target.value })}
          className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>
    ));
  };

  const filteredIntegrations = AVAILABLE_INTEGRATIONS.filter(int => 
    int.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    int.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Webhook Info Card */}
      <div className="bg-[#151619] text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              Incoming Webhooks
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Use this unique endpoint to send external events to your workflows. 
              Send a POST request with a JSON body to trigger your automations.
            </p>
          </div>
          
          <div className="flex-1 max-w-md">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Your Webhook URL</label>
            <div className="flex gap-2">
              <code className="flex-1 bg-white/5 p-3 rounded-xl text-[10px] font-mono break-all border border-white/10 text-indigo-300">
                {window.location.origin}/api/webhooks/{profile?.tenantId}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/${profile?.tenantId}`);
                  alert('URL copied to clipboard!');
                }}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p>Loading integrations...</p>
          </div>
        ) : (
          filteredIntegrations.map((int) => {
            const connected = connectedIntegrations.find(c => c.provider === int.id);
            const isConnecting = connectingInt?.id === int.id;

            return (
              <motion.div 
                key={int.id} 
                layout
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg",
                    int.color
                  )}>
                    {int.icon}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    connected ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                  )}>
                    {connected ? (
                      <>
                        <CheckCircle2 size={12} />
                        Connected
                      </>
                    ) : (
                      <>
                        <Plug size={12} />
                        Available
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{int.name}</h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">{int.provider}</p>
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">{int.description}</p>
                </div>

                <div className="flex gap-2">
                  {connected ? (
                    <>
                      <button 
                        className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Settings size={16} />
                        Configure
                      </button>
                      <button 
                        onClick={() => handleDisconnect(connected.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Disconnect"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setConnectingInt(int)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                    >
                      <Plus size={16} />
                      Connect
                    </button>
                  )}
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                    <ExternalLink size={20} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
        
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

      {/* Connection Modal */}
      <AnimatePresence>
        {connectingInt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold", connectingInt.color)}>
                    {connectingInt.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Connect {connectingInt.name}</h3>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">{connectingInt.provider}</p>
                  </div>
                </div>
                <button onClick={() => setConnectingInt(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleConnect} className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl text-xs text-indigo-700 leading-relaxed">
                  <strong>Security Note:</strong> Your credentials are encrypted and stored securely. We only use them to sync data between your accounts.
                </div>
                
                {renderCredentialFields()}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Save & Connect'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
