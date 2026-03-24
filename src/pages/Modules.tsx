import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  ExternalLink,
  PlusCircle,
  X,
  Settings2,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { moduleService } from '../services/moduleService';
import { ModuleDefinition, ModuleField } from '../types';
import { Link } from 'react-router-dom';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção' },
  { value: 'boolean', label: 'Booleano' },
  { value: 'relation', label: 'Relação' }
];

const MODULE_TEMPLATES = [
  {
    name: 'Inventário',
    description: 'Controle de estoque e produtos',
    icon: 'Package',
    fields: [
      { id: 'f1', name: 'Nome do Produto', type: 'text', required: true },
      { id: 'f2', name: 'SKU', type: 'text', required: true },
      { id: 'f3', name: 'Quantidade', type: 'number', required: true },
      { id: 'f4', name: 'Preço Unitário', type: 'number', required: true },
      { id: 'f5', name: 'Categoria', type: 'select', required: false, options: ['Eletrônicos', 'Móveis', 'Vestuário'] }
    ]
  },
  {
    name: 'Projetos',
    description: 'Gestão de projetos internos',
    icon: 'Layout',
    fields: [
      { id: 'f1', name: 'Nome do Projeto', type: 'text', required: true },
      { id: 'f2', name: 'Data de Início', type: 'date', required: true },
      { id: 'f3', name: 'Prazo', type: 'date', required: false },
      { id: 'f4', name: 'Status', type: 'select', required: true, options: ['Planejamento', 'Em Execução', 'Concluído'] },
      { id: 'f5', name: 'Orçamento', type: 'number', required: false }
    ]
  }
];

export function Modules() {
  const { profile } = useAuth();
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

  // New Module State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<ModuleField[]>([]);

  useEffect(() => {
    if (!profile?.tenantId) return;
    const unsub = moduleService.subscribeToModuleDefinitions(profile.tenantId, (mods) => {
      setModules(mods.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
    return unsub;
  }, [profile?.tenantId]);

  const handleAddField = () => {
    const newField: ModuleField = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'text',
      required: false
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleFieldChange = (id: string, updates: Partial<ModuleField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenantId || !name) return;

    setIsSubmitting(true);
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      await moduleService.createModuleDefinition(profile.tenantId, {
        name,
        description,
        slug,
        icon: 'Package',
        fields
      });
      setIsAddingModule(false);
      setName('');
      setDescription('');
      setFields([]);
    } catch (error) {
      console.error('Error creating module:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseTemplate = (template: typeof MODULE_TEMPLATES[0]) => {
    setName(template.name);
    setDescription(template.description);
    setFields(template.fields.map(f => ({ ...f, id: `field_${Math.random().toString(36).substr(2, 9)}` })) as ModuleField[]);
  };

  const confirmDelete = async () => {
    if (!deletingModuleId) return;
    try {
      await moduleService.deleteModuleDefinition(deletingModuleId);
      setDeletingModuleId(null);
    } catch (error) {
      console.error('Error deleting module:', error);
    }
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Módulos Personalizados</h1>
          <p className="text-gray-500 mt-1">Crie suas próprias tabelas, CRUDs e relatórios integrados.</p>
        </div>
        <button
          onClick={() => setIsAddingModule(true)}
          className="flex items-center justify-center gap-2 bg-[#151619] text-white px-6 py-3 rounded-xl font-medium hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95"
        >
          <Plus size={20} />
          Novo Módulo
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar módulos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredModules.map((mod) => (
            <motion.div
              key={mod.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-black/5 transition-all group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-[#151619] group-hover:text-white transition-colors">
                  <Package size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/modules/${mod.slug}`}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                    title="Abrir Módulo"
                  >
                    <ExternalLink size={18} />
                  </Link>
                  <button 
                    onClick={() => setDeletingModuleId(mod.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{mod.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{mod.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {mod.fields.length} Campos
                </span>
                <Link
                  to={`/modules/${mod.slug}`}
                  className="text-sm font-bold text-[#151619] hover:underline flex items-center gap-1"
                >
                  Gerenciar Dados
                  <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredModules.length === 0 && !isAddingModule && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nenhum módulo encontrado</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Comece criando seu primeiro módulo personalizado para gerenciar dados específicos do seu negócio.
            </p>
            <button
              onClick={() => setIsAddingModule(true)}
              className="mt-6 text-indigo-600 font-bold hover:underline"
            >
              Criar Módulo Agora
            </button>
          </div>
        )}
      </div>

      {/* Add Module Modal */}
      <AnimatePresence>
        {isAddingModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Criar Novo Módulo</h2>
                  <p className="text-sm text-gray-500">Defina a estrutura e os campos do seu módulo.</p>
                </div>
                <button 
                  onClick={() => setIsAddingModule(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Sugestões</h3>
                      <div className="space-y-3">
                        {MODULE_TEMPLATES.map((template) => (
                          <button
                            key={template.name}
                            onClick={() => handleUseTemplate(template)}
                            className="w-full text-left p-4 rounded-2xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
                          >
                            <div className="flex items-center gap-3 mb-1">
                              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                {template.icon === 'Package' ? <Package size={16} /> : <Layout size={16} />}
                              </div>
                              <span className="font-bold text-gray-900">{template.name}</span>
                            </div>
                            <p className="text-xs text-gray-500">{template.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Módulo</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Frota de Veículos"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Para que serve este módulo?"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all h-24 resize-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Campos do Módulo</h3>
                        <button
                          type="button"
                          onClick={handleAddField}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <PlusCircle size={16} />
                          Adicionar Campo
                        </button>
                      </div>

                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={field.id}
                            className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome</label>
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => handleFieldChange(field.id, { name: e.target.value })}
                                  placeholder="Nome do campo"
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
                                />
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo</label>
                                <select
                                  value={field.type}
                                  onChange={(e) => handleFieldChange(field.id, { type: e.target.value as any })}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
                                >
                                  {FIELD_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                  ))}
                                </select>
                              </div>
                              {field.type === 'select' && (
                                <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Opções (separadas por vírgula)</label>
                                  <input
                                    type="text"
                                    value={field.options?.join(', ') || ''}
                                    onChange={(e) => handleFieldChange(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                                    placeholder="Opção 1, Opção 2..."
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
                                  />
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveField(field.id)}
                              className="mt-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </motion.div>
                        ))}
                        {fields.length === 0 && (
                          <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-sm text-gray-400">Nenhum campo adicionado ainda.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsAddingModule(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateModule}
                  disabled={isSubmitting || !name || fields.length === 0}
                  className="bg-[#151619] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Módulo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingModuleId && (
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Excluir Módulo?</h2>
              <p className="text-gray-500 mb-8">
                Esta ação é irreversível. Todos os dados e registros associados a este módulo serão permanentemente removidos.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingModuleId(null)}
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

function ChevronRight({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
