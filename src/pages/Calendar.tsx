import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  Globe,
  Mail,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { integrationService } from '../services/integrationService';
import { Integration } from '../types';

const mockEvents = [
  { id: 1, title: 'Reunião com Cliente', time: '10:00 - 11:00', type: 'Meeting', color: 'bg-blue-100 text-blue-800' },
  { id: 2, title: 'Demo de Produto', time: '14:30 - 15:30', type: 'Demo', color: 'bg-purple-100 text-purple-800' },
  { id: 3, title: 'Follow-up Lead', time: '16:00 - 16:30', type: 'Call', color: 'bg-green-100 text-green-800' },
];

export function Calendar() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [connectedIntegrations, setConnectedIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.tenantId) return;

    const unsubscribe = integrationService.subscribeToIntegrations(profile.tenantId, (data) => {
      setConnectedIntegrations(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.tenantId]);

  const isGoogleConnected = connectedIntegrations.some(i => i.provider === 'google_calendar');
  const isOutlookConnected = connectedIntegrations.some(i => i.provider === 'outlook_calendar');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();

  const handleConnect = (provider: 'google_calendar' | 'outlook_calendar') => {
    // Redirect to integrations page or show modal
    window.location.href = '/integrations';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500">Gerencie seus compromissos e agendamentos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleConnect('google')}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold",
              integrations.google 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600"
            )}
          >
            <Globe size={18} />
            <span>{integrations.google ? 'Google Connected' : 'Connect Google'}</span>
          </button>
          <button 
            onClick={() => handleConnect('microsoft')}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold",
              integrations.microsoft 
                ? "bg-blue-50 border-blue-200 text-blue-700" 
                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600"
            )}
          >
            <Mail size={18} />
            <span>{integrations.microsoft ? 'Outlook Connected' : 'Connect Outlook'}</span>
          </button>
          <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm ml-4">
            <Plus size={20} />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-900 capitalize">{monthName} {year}</h2>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="bg-gray-50 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
            {padding.map((_, i) => (
              <div key={`pad-${i}`} className="bg-white h-24 sm:h-32 p-2"></div>
            ))}
            {days.map(day => (
              <div key={day} className="bg-white h-24 sm:h-32 p-2 hover:bg-gray-50 transition-colors cursor-pointer group">
                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                  day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'bg-indigo-600 text-white' : 'text-gray-700'
                }`}>
                  {day}
                </span>
                {day === 23 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded truncate font-medium">
                      Reunião Cliente
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <CalendarIcon className="mr-2 text-indigo-600" size={20} />
              Próximos Eventos
            </h3>
            <div className="space-y-4">
              {mockEvents.map(event => (
                <motion.div 
                  key={event.id}
                  whileHover={{ x: 4 }}
                  className="p-4 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${event.color}`}>
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {event.time}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{event.title}</h4>
                  <p className="text-xs text-gray-500 flex items-center">
                    <MapPin size={12} className="mr-1" />
                    Google Meet
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-2xl shadow-sm p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Dica do OmniFlow</h3>
              <p className="text-indigo-100 text-sm">
                Conecte seu Google Calendar para sincronizar automaticamente seus agendamentos.
              </p>
              <button 
                onClick={() => handleConnect('google')}
                className="mt-4 bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors"
              >
                {integrations.google ? 'Sincronizado' : 'Conectar Agora'}
              </button>
            </div>
            <CalendarIcon className="absolute -bottom-4 -right-4 h-24 w-24 text-indigo-500 opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
