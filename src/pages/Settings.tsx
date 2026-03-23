import React, { useState } from 'react';
import { User, Bell, Shield, Plug, CreditCard, Globe, Mail, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export function Settings() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'profile', icon: User, label: 'Perfil' },
    { icon: Bell, label: 'Notificações', id: 'notifications' },
    { icon: Shield, label: 'Segurança', id: 'security' },
    { icon: Plug, label: 'Integrações', id: 'integrations' },
    { icon: CreditCard, label: 'Faturamento', id: 'billing' },
    { icon: Globe, label: 'Geral', id: 'general' },
  ];

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Gerencie sua conta e as preferências da sua empresa.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <tab.icon size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="max-w-2xl">
            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Informações do Perfil</h2>
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                      <img 
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
                        alt="Avatar" 
                        className="h-24 w-24 rounded-2xl border-2 border-gray-100 object-cover"
                      />
                      <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-md border border-gray-100 hover:bg-gray-50 transition-colors">
                        <Save size={16} className="text-indigo-600" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{user?.displayName}</h3>
                      <p className="text-gray-500 text-sm">{user?.email}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-2 capitalize">
                        {profile?.role}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                      <input 
                        type="text" 
                        defaultValue={user?.displayName || ''}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="email" 
                          disabled
                          defaultValue={user?.email || ''}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={20} />}
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab !== 'profile' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Em breve</h3>
                <p className="text-gray-500 max-w-xs">
                  Esta seção das configurações está sendo preparada para você.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
