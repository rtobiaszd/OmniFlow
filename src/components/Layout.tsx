import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  GitBranch, 
  Zap, 
  Plug, 
  Users, 
  Calendar, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Inbox, label: 'Inbox', path: '/inbox' },
  { icon: GitBranch, label: 'Pipelines', path: '/pipelines' },
  { icon: Zap, label: 'Workflows', path: '/workflows' },
  { icon: Plug, label: 'Integrations', path: '/integrations' },
  { icon: Users, label: 'Contacts', path: '/contacts' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const { logout } = useAuth();

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

      <nav className="flex-1 px-3 space-y-1">
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
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <Link
          to="/settings"
          className="flex items-center p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <Settings size={20} />
          {!collapsed && <span className="ml-3 font-medium">Settings</span>}
        </Link>
        <button 
          onClick={logout}
          className="w-full flex items-center p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut size={20} />
          {!collapsed && <span className="ml-3 font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}

export function Topbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
          {user?.displayName?.charAt(0) || 'U'}
        </div>
        <span className="font-semibold text-gray-700">Acme Corp</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono uppercase tracking-wider">Pro Plan</span>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">{user?.displayName || 'User'}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
            <img 
              src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} 
              alt="Avatar" 
              referrerPolicy="no-referrer" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
