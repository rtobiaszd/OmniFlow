import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tenantService } from '../services/tenantService';
import { userService } from '../services/userService';
import { motion } from 'motion/react';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';

export function Setup() {
  const { user, refreshProfile } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create Tenant
      const tenantId = await tenantService.createTenant(companyName.trim());

      // 2. Create User Profile as Admin
      await userService.createProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'admin',
        tenantId
      });

      // 3. Refresh profile in context to trigger redirect
      await refreshProfile();
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Ocorreu um erro durante a configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Building2 className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Configure sua empresa
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Estamos quase lá! Só precisamos de mais algumas informações.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSetup}>
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                Nome da Empresa
              </label>
              <div className="mt-1">
                <input
                  id="company-name"
                  name="company-name"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Minha Empresa SaaS"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !companyName.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Finalizar Configuração
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
