import React from 'react';
import { RefreshCw, LogOut } from 'lucide-react';
import { User, UserRole } from '../../services/authService';

export type { UserRole };

interface NavbarProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onSync: () => void;
  isLoading: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentRole: _currentRole, 
  onRoleChange: _onRoleChange, 
  onSync, 
  isLoading,
  currentUser,
  onLogout
}) => {
  return (
    <header className="border-b border-white/10 bg-[#060c1a]/95 backdrop-blur-2xl sticky top-0 z-50 shadow-2xl">
      {/* Barra Principal de Navegación con Logo Oficial */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Logo Oficial de Campuslands */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            {/* Casco Oficial de Astronauta */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-campus-teal to-campus-purple rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
              <img
                src="/casco_azul.svg"
                alt="Campuslands Helmet"
                className="relative w-7 h-7 sm:w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110 animate-float"
              />
            </div>
            {/* Texto Oficial Campuslands */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <img
                src="/CampuslandsText.svg"
                alt="Campuslands"
                className="h-4 sm:h-5 w-auto object-contain brightness-110"
              />
              <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-campus-cyan/15 text-campus-cyan border border-campus-cyan/30 font-semibold tracking-wider">
                OpsCenter
              </span>
            </div>
          </a>
        </div>

        {/* Acciones de Navegación: Sincronizar + Chip Usuario / Logout */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Botón de Sincronización */}
          <button
            onClick={onSync}
            disabled={isLoading}
            className="p-1.5 sm:p-2 rounded-xl bg-[#030712] hover:bg-[#0c1830] border border-white/15 text-slate-300 hover:text-white transition shadow-sm active:scale-95"
            title="Sincronizar datos del campus"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin text-campus-teal' : ''}`} />
          </button>

          {/* Chip de Usuario Conectado + Botón de Cerrar Sesión */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-white/10">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#030712] border border-white/10 shadow-inner">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-campus-teal to-campus-purple flex items-center justify-center text-black font-bold text-[10px]">
                  {currentUser.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-white leading-tight max-w-[120px] sm:max-w-[150px] truncate">
                    {currentUser.nombre}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 leading-tight truncate max-w-[120px] sm:max-w-[150px]">
                    {currentUser.cargo || (currentUser.role === 'admin' ? 'Administrador' : 'Camper')}
                  </span>
                </div>
                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full font-semibold tracking-wider ${
                  currentUser.role === 'admin'
                    ? 'bg-campus-purple/20 text-campus-purple border border-campus-purple/30'
                    : 'bg-campus-teal/20 text-campus-teal border border-campus-teal/30'
                }`}>
                  {currentUser.role === 'admin' ? 'ADMIN' : 'CLIENTE'}
                </span>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Cerrar Sesión"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#030712] hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs transition shadow-sm active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline text-[11px] font-mono">Salir</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
