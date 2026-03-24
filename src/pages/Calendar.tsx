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
  Loader2,
  X,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { integrationService } from '../services/integrationService';
import { calendarService } from '../services/calendarService';
import { contactService, Contact } from '../services/contactService';
import { Integration, Appointment } from '../types';

const mockEvents = [
  { id: 1, title: 'Reunião com Cliente', time: '10:00 - 11:00', type: 'Meeting', color: 'bg-blue-100 text-blue-800' },
  { id: 2, title: 'Demo de Produto', time: '14:30 - 15:30', type: 'Demo', color: 'bg-purple-100 text-purple-800' },
  { id: 3, title: 'Follow-up Lead', time: '16:00 - 16:30', type: 'Call', color: 'bg-green-100 text-green-800' },
];

export function Calendar() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [connectedIntegrations, setConnectedIntegrations] = useState<Integration[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [newAppt, setNewAppt] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    type: 'meeting' as Appointment['type'],
    contactId: '',
    location: ''
  });

  useEffect(() => {
    if (!profile?.tenantId) return;

    const unsubIntegrations = integrationService.subscribeToIntegrations(profile.tenantId, (data) => {
      setConnectedIntegrations(data);
    });

    const unsubAppointments = calendarService.subscribeToAppointments(profile.tenantId, (data) => {
      setAppointments(data);
      setLoading(false);
    });

    const unsubContacts = contactService.subscribeToContacts(profile.tenantId, (data) => {
      setContacts(data);
    });

    return () => {
      unsubIntegrations();
      unsubAppointments();
      unsubContacts();
    };
  }, [profile?.tenantId]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenantId || !newAppt.title) return;

    setIsSubmitting(true);
    try {
      const start = new Date(`${newAppt.date}T${newAppt.startTime}`).toISOString();
      const end = new Date(`${newAppt.date}T${newAppt.endTime}`).toISOString();

      await calendarService.createAppointment(profile.tenantId, {
        title: newAppt.title,
        description: newAppt.description,
        startTime: start,
        endTime: end,
        type: newAppt.type,
        contactId: newAppt.contactId,
        location: newAppt.location,
        status: 'scheduled'
      });

      setIsCreating(false);
      setNewAppt({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        type: 'meeting',
        contactId: '',
        location: ''
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onClick={() => handleConnect('google_calendar')}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold",
              isGoogleConnected 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600"
            )}
          >
            <Globe size={18} />
            <span>{isGoogleConnected ? 'Google Connected' : 'Connect Google'}</span>
          </button>
          <button 
            onClick={() => handleConnect('outlook_calendar')}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold",
              isOutlookConnected 
                ? "bg-blue-50 border-blue-200 text-blue-700" 
                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600"
            )}
          >
            <Mail size={18} />
            <span>{isOutlookConnected ? 'Outlook Connected' : 'Connect Outlook'}</span>
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm ml-4"
          >
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
            {days.map(day => {
              const dayAppointments = appointments.filter(appt => {
                const apptDate = new Date(appt.startTime);
                return apptDate.getDate() === day && 
                       apptDate.getMonth() === currentDate.getMonth() &&
                       apptDate.getFullYear() === currentDate.getFullYear();
              });

              return (
                <div key={day} className="bg-white h-24 sm:h-32 p-2 hover:bg-gray-50 transition-colors cursor-pointer group border-r border-b border-gray-50">
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                    day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() ? 'bg-indigo-600 text-white' : 'text-gray-700'
                  }`}>
                    {day}
                  </span>
                  <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)] scrollbar-hide">
                    {dayAppointments.map(appt => (
                      <div 
                        key={appt.id}
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded truncate font-medium",
                          appt.type === 'meeting' ? "bg-blue-100 text-blue-800" :
                          appt.type === 'call' ? "bg-green-100 text-green-800" :
                          appt.type === 'demo' ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-800"
                        )}
                      >
                        {new Date(appt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {appt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
              {appointments
                .filter(appt => new Date(appt.startTime) >= new Date())
                .slice(0, 5)
                .map(event => (
                <motion.div 
                  key={event.id}
                  whileHover={{ x: 4 }}
                  className="p-4 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full",
                      event.type === 'meeting' ? "bg-blue-100 text-blue-800" :
                      event.type === 'call' ? "bg-green-100 text-green-800" :
                      event.type === 'demo' ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-800"
                    )}>
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {new Date(event.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{event.title}</h4>
                  <p className="text-xs text-gray-500 flex items-center">
                    <MapPin size={12} className="mr-1" />
                    {event.location || 'Sem local definido'}
                  </p>
                </motion.div>
              ))}
              {appointments.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-400">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum evento agendado</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-2xl shadow-sm p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Dica do OmniFlow</h3>
              <p className="text-indigo-100 text-sm">
                Conecte seu Google Calendar para sincronizar automaticamente seus agendamentos.
              </p>
              <button 
                onClick={() => handleConnect('google_calendar')}
                className="mt-4 bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors"
              >
                {isGoogleConnected ? 'Sincronizado' : 'Conectar Agora'}
              </button>
            </div>
            <CalendarIcon className="absolute -bottom-4 -right-4 h-24 w-24 text-indigo-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Novo Agendamento</h2>
                  <p className="text-sm text-gray-500">Preencha os detalhes do compromisso.</p>
                </div>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Título</label>
                    <input
                      type="text"
                      required
                      value={newAppt.title}
                      onChange={(e) => setNewAppt({ ...newAppt, title: e.target.value })}
                      placeholder="Ex: Reunião de Alinhamento"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Data</label>
                      <input
                        type="date"
                        required
                        value={newAppt.date}
                        onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                      <select
                        value={newAppt.type}
                        onChange={(e) => setNewAppt({ ...newAppt, type: e.target.value as any })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="meeting">Reunião</option>
                        <option value="call">Chamada</option>
                        <option value="demo">Demo</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Início</label>
                      <input
                        type="time"
                        required
                        value={newAppt.startTime}
                        onChange={(e) => setNewAppt({ ...newAppt, startTime: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Fim</label>
                      <input
                        type="time"
                        required
                        value={newAppt.endTime}
                        onChange={(e) => setNewAppt({ ...newAppt, endTime: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Contato (Opcional)</label>
                    <select
                      value={newAppt.contactId}
                      onChange={(e) => setNewAppt({ ...newAppt, contactId: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="">Nenhum contato selecionado</option>
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>{contact.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Local / Link</label>
                    <input
                      type="text"
                      value={newAppt.location}
                      onChange={(e) => setNewAppt({ ...newAppt, location: e.target.value })}
                      placeholder="Ex: Google Meet, Escritório..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
                    <textarea
                      value={newAppt.description}
                      onChange={(e) => setNewAppt({ ...newAppt, description: e.target.value })}
                      placeholder="Notas adicionais..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-24 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Criar Agendamento'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
