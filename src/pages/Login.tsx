import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn, ShieldAlert, Key, Settings } from 'lucide-react';

export function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-red-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Configuração Necessária
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Para proteger suas chaves, movi a configuração para variáveis de ambiente.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Key size={16} className="text-indigo-600" />
              Como configurar:
            </h3>
            <ol className="mt-3 text-xs text-gray-600 space-y-2 list-decimal list-inside">
              <li>Abra o menu <strong>Settings</strong> (engrenagem)</li>
              <li>Vá em <strong>Secrets</strong> ou <strong>Environment Variables</strong></li>
              <li>Adicione <strong>VITE_FIREBASE_API_KEY</strong> e as outras chaves listadas no arquivo <code>.env.example</code></li>
              <li>Reinicie o servidor de desenvolvimento</li>
            </ol>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 p-3 rounded-lg">
            <Settings size={14} />
            <span>Isso garante que suas chaves não sejam expostas se você exportar para o GitHub.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { user, login, isConfigured } = useAuth();

  if (!isConfigured) {
    return <SetupRequired />;
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome to OmniFlow
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your omnichannel dashboard
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={login}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 shadow-sm"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </span>
            Sign in with Google
          </button>
        </div>
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            Secure authentication powered by Firebase
          </p>
        </div>
      </div>
    </div>
  );
}
