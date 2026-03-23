import React, { useState } from 'react';
import { Search, UserPlus, Mail, Phone, MoreVertical, Filter } from 'lucide-react';
import { motion } from 'motion/react';

const mockContacts = [
  { id: 1, name: 'João Silva', email: 'joao@exemplo.com', phone: '+55 11 99999-9999', company: 'Tech Solutions', status: 'Active' },
  { id: 2, name: 'Maria Oliveira', email: 'maria@exemplo.com', phone: '+55 11 88888-8888', company: 'Global Corp', status: 'Lead' },
  { id: 3, name: 'Carlos Santos', email: 'carlos@exemplo.com', phone: '+55 11 77777-7777', company: 'Startup Inc', status: 'Customer' },
  { id: 4, name: 'Ana Costa', email: 'ana@exemplo.com', phone: '+55 11 66666-6666', company: 'Digital Agency', status: 'Active' },
];

export function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-gray-500">Gerencie seus clientes e leads em um só lugar.</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <UserPlus size={20} />
          <span>Novo Contato</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <Filter size={20} />
            <span>Filtros</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Empresa</th>
                <th className="px-6 py-4 font-medium">Contato</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockContacts.map((contact) => (
                <motion.tr 
                  key={contact.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {contact.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{contact.company}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span>{contact.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 mt-1">
                        <Phone size={14} className="text-gray-400" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      contact.status === 'Customer' ? 'bg-green-100 text-green-800' :
                      contact.status === 'Lead' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
