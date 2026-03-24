import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Download,
  ChevronLeft,
  X,
  FileText,
  Calendar,
  Hash,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { moduleService } from '../services/moduleService';
import { ModuleDefinition, ModuleRecord } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ModuleView() {
  const { slug } = useParams<{ slug: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [module, setModule] = useState<ModuleDefinition | null>(null);
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ModuleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'reports'>('data');

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!profile?.tenantId || !slug) return;

    const unsubModules = moduleService.subscribeToModuleDefinitions(profile.tenantId, (modules) => {
      const found = modules.find(m => m.slug === slug);
      if (found) {
        setModule(found);
        const unsubRecords = moduleService.subscribeToModuleRecords(found.id, profile.tenantId, (recs) => {
          setRecords(recs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLoading(false);
        });
        return () => unsubRecords();
      } else {
        setLoading(false);
      }
    });

    return unsubModules;
  }, [profile?.tenantId, slug]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenantId || !module) return;

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await moduleService.updateModuleRecord(editingRecord.id, formData);
      } else {
        await moduleService.createModuleRecord(profile.tenantId, module.id, formData);
      }
      setIsAddingRecord(false);
      setEditingRecord(null);
      setFormData({});
    } catch (error) {
      // Error is already handled in service, but we can log it here too if needed
      console.error('Error saving record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: ModuleRecord) => {
    setEditingRecord(record);
    setFormData(record.data);
    setIsAddingRecord(true);
  };

  const confirmDelete = async () => {
    if (!deletingRecordId) return;
    try {
      await moduleService.deleteModuleRecord(deletingRecordId);
      setDeletingRecordId(null);
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const filteredRecords = records.filter(rec => {
    const searchStr = JSON.stringify(rec.data).toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Módulo não encontrado</h2>
        <button onClick={() => navigate('/modules')} className="mt-4 text-indigo-600 font-bold hover:underline">
          Voltar para Módulos
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/modules')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{module.name}</h1>
          <p className="text-gray-500 mt-1">{module.description}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('data')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'data' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Dados
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'reports' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Relatórios
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-medium">
            <Filter size={18} />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-medium">
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={() => {
              setEditingRecord(null);
              setFormData({});
              setIsAddingRecord(true);
            }}
            className="flex items-center gap-2 bg-[#151619] text-white px-6 py-3 rounded-xl font-medium hover:bg-black transition-all shadow-lg shadow-black/10"
          >
            <Plus size={20} />
            Novo Registro
          </button>
        </div>
      </div>

      {activeTab === 'data' ? (
        <>
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`Buscar em ${module.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all shadow-sm"
            />
          </div>

          {/* Records Table */}
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    {module.fields.map(field => (
                      <th key={field.id} className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {field.name}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                      {module.fields.map(field => (
                        <td key={field.id} className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {renderFieldValue(field, record.data[field.id])}
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeletingRecordId(record.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={module.fields.length + 1} className="px-6 py-20 text-center">
                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhum registro encontrado</h3>
                        <p className="text-gray-500 mt-1">Clique em "Novo Registro" para começar a preencher este módulo.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Total de Registros</h3>
            <div className="text-4xl font-bold text-gray-900">{records.length}</div>
            <p className="text-xs text-gray-500 mt-2">Registros ativos no módulo</p>
          </div>
          
          {module.fields.filter(f => f.type === 'select').map(field => {
            const stats = records.reduce((acc: any, rec) => {
              const val = rec.data[field.id] || 'Não definido';
              acc[val] = (acc[val] || 0) + 1;
              return acc;
            }, {});

            return (
              <div key={field.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Distribuição por {field.name}</h3>
                <div className="space-y-3">
                  {Object.entries(stats).map(([label, count]: [any, any]) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{label}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full" 
                          style={{ width: `${(count / records.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Record Modal */}
      <AnimatePresence>
        {isAddingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingRecord ? 'Editar Registro' : 'Novo Registro'}
                  </h2>
                  <p className="text-sm text-gray-500">Preencha os campos do módulo {module.name}.</p>
                </div>
                <button 
                  onClick={() => setIsAddingRecord(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateRecord} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {module.fields.map((field) => (
                    <div key={field.id} className={field.type === 'text' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderFieldInput(field, formData[field.id], (val) => setFormData({ ...formData, [field.id]: val }))}
                    </div>
                  ))}
                </div>
              </form>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingRecord(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateRecord}
                  disabled={isSubmitting}
                  className="bg-[#151619] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
                >
                  {isSubmitting ? 'Salvando...' : editingRecord ? 'Atualizar' : 'Salvar Registro'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingRecordId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Excluir Registro?</h2>
              <p className="text-gray-500 mb-8">
                Esta ação é irreversível. O registro será permanentemente removido deste módulo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingRecordId(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderFieldValue(field: any, value: any) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-gray-300 italic text-sm">Vazio</span>;
  }

  switch (field.type) {
    case 'boolean':
      return value ? (
        <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
          <CheckCircle2 size={14} /> Sim
        </span>
      ) : (
        <span className="flex items-center gap-1 text-gray-400 font-medium text-sm">
          <X size={14} /> Não
        </span>
      );
    case 'number':
      return <span className="font-mono text-sm text-gray-600">{value}</span>;
    case 'date':
      try {
        return <span className="text-sm text-gray-600">{format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}</span>;
      } catch {
        return <span className="text-sm text-gray-600">{value}</span>;
      }
    case 'select':
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold uppercase tracking-wider">
          {value}
        </span>
      );
    default:
      return <span className="text-sm text-gray-900 font-medium">{value}</span>;
  }
}

function renderFieldInput(field: any, value: any, onChange: (val: any) => void) {
  const baseClasses = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all";

  switch (field.type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              value ? "bg-indigo-600" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                value ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-sm text-gray-600">{value ? 'Sim' : 'Não'}</span>
        </div>
      );
    case 'number':
      return (
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className={cn(baseClasses, "pl-10")}
            required={field.required}
          />
        </div>
      );
    case 'date':
      return (
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(baseClasses, "pl-10")}
            required={field.required}
          />
        </div>
      );
    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          required={field.required}
        >
          <option value="">Selecione...</option>
          {field.options?.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          required={field.required}
          placeholder={`Digite ${field.name.toLowerCase()}...`}
        />
      );
  }
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
