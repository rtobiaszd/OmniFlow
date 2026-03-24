import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  GitBranch, 
  Zap, 
  Plug, 
  Users as UsersIcon, 
  Calendar, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Languages,
  UserCircle,
  Package,
  Layers
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { tenantService, Tenant } from '../services/tenantService';
import { moduleService } from '../services/moduleService';
import { ModuleDefinition } from '../types';

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const { logout, profile } = useAuth();
  const { t } = useTranslation();
  const [customModules, setCustomModules] = React.useState<ModuleDefinition[]>([]);

  React.useEffect(() => {
    if (!profile?.tenantId) return;
    const unsub = moduleService.subscribeToModuleDefinitions(profile.tenantId, setCustomModules);
    return unsub;
  }, [profile?.tenantId]);

  const navItems = [
    { icon: LayoutDashboard, label: t('common.dashboard'), path: '/' },
    { icon: Inbox, label: t('common.inbox'), path: '/inbox' },
    { icon: GitBranch, label: t('common.pipelines'), path: '/pipelines' },
    { icon: Zap, label: t('common.workflows'), path: '/workflows' },
    { icon: Plug, label: t('common.integrations'), path: '/integrations' },
    { icon: UsersIcon, label: t('common.contacts'), path: '/contacts' },
    { icon: Calendar, label: t('common.calendar'), path: '/calendar' },
    { icon: Layers, label: 'Módulos', path: '/modules' },
  ];

  // Add Team management for admins
  if (profile?.role === 'admin') {
    navItems.push({ icon: UserCircle, label: 'Equipe', path: '/users' });
  }

  return (
    <div 
      className={cn(
        "h-screen bg-[#151619] text-white transition-all duration-300 flex flex-col border-r border-white/10",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && <span className="font-bold text-xl tracking-tight italic">OmniFlow</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-white/10 rounded-md transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center p-3 rounded-lg transition-all group",
                isActive 
                  ? "bg-white text-[#151619]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} className={cn("shrink-0", isActive ? "" : "group-hover:scale-110 transition-transform")} />
              {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
            </Link>
          );
        })}

        {/* Custom Modules Section */}
        {!collapsed && customModules.length > 0 && (
          <div className="pt-4 pb-2 px-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Personalizados</span>
          </div>
        )}
        {customModules.map((mod) => {
          const path = `/modules/${mod.slug}`;
          const isActive = location.pathname === path;
          return (
            <Link
              key={mod.id}
              to={path}
              className={cn(
                "flex items-center p-3 rounded-lg transition-all group",
                isActive 
                  ? "bg-white text-[#151619]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Package size={20} className={cn("shrink-0", isActive ? "" : "group-hover:scale-110 transition-transform")} />
              {!collapsed && <span className="ml-3 font-medium">{mod.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <Link
          to="/settings"
          className="flex items-center p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <Settings size={20} />
          {!collapsed && <span className="ml-3 font-medium">{t('common.settings')}</span>}
        </Link>
        <button 
          onClick={logout}
          className="w-full flex items-center p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut size={20} />
          {!collapsed && <span className="ml-3 font-medium">{t('common.logout')}</span>}
        </button>
      </div>
    </div>
  );
}

export function Topbar() {
  const { user, profile } = useAuth();
  const { i18n } = useTranslation();
  const [tenant, setTenant] = React.useState<Tenant | null>(null);

  React.useEffect(() => {
    if (profile?.tenantId) {
      tenantService.getTenant(profile.tenantId).then(setTenant);
    }
  }, [profile?.tenantId]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
          {tenant?.name?.charAt(0) || 'T'}
        </div>
        <span className="font-semibold text-gray-700">{tenant?.name || 'Carregando...'}</span>
        {tenant?.plan && (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono uppercase tracking-wider">
            {tenant.plan} Plan
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 pr-6 border-r border-gray-200">
          <Languages size={18} className="text-gray-400" />
          <select 
            onChange={(e) => changeLanguage(e.target.value)}
            value={i18n.language}
            className="text-sm font-medium text-gray-600 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="es">Español</option>
          </select>
        </div>

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">{user?.displayName || 'User'}</div>
            <div className="text-xs text-gray-500 capitalize">{profile?.role || 'Visitante'}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
              alt="Avatar" 
              referrerPolicy="no-referrer" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
