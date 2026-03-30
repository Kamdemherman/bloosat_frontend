// src/components/layout/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, FileText, Wallet, Package,
  Warehouse, UserCog, ScrollText, LogOut, Menu, X, Settings2,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',     label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/clients',       label: 'Clients',          icon: Users },
  { to: '/invoices',      label: 'Facturation',      icon: FileText },
  { to: '/encaissements', label: 'Encaissements',    icon: Wallet },
  { to: '/products',      label: 'Produits',         icon: Package },
  { to: '/stock',         label: 'Stock',            icon: Warehouse },
  { to: '/users',         label: 'Utilisateurs',     icon: UserCog,    roles: ['super_admin'] },
  { to: '/logs',          label: 'Logs système',     icon: ScrollText, roles: ['super_admin', 'dg', 'crd'] },
  // { to: '/settings',      label: 'Paramètres',      icon: Settings2,  roles: ['super_admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role?.name)
  );

  return (
    <div className="flex h-screen bg-slate-50" style={{ fontFamily: "'Inter var', sans-serif" }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 bg-slate-900 text-white transition-all duration-200 flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/60">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            B
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-semibold text-white text-sm tracking-wide">BLOOSAT BSS</span>
              <p className="text-xs text-slate-400">v3.0</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-700/60 p-3 space-y-1">
          {sidebarOpen && (
            <div className="px-2 py-1 mb-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role?.display_name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"
          >
            <LogOut size={15} />
            {sidebarOpen && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
