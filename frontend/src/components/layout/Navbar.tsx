import React from 'react';
import { ShieldCheck, UserCheck, RefreshCw, Orbit } from 'lucide-react';

export type UserRole = 'admin' | 'client';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSync: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange, onSync, isLoading }) => {
  return (
    <header className="border-b border-white/10 bg-campus-deep/80 backdrop-blur-2xl sticky top-0 z-50">
      {/* Ticker estilo Terminal Campuslands */}
      <div className="border-b border-white/5 bg-black/40 py-1 px-6 overflow-hidden select-none">
        <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-campus-teal animate-pulse"></span>
            <span className="text-campus-teal font-semibold">CAMPUSLANDS OPS</span>
            <span className="text-white/30">//</span>
            <span className="hidden sm:inline">NODO CENTRAL OPERATIVO</span>
            <span className="text-white/30 hidden sm:inline">//</span>
            <span className="text-campus-cyan hidden md:inline">GEMINI 3.8 FLASH COPILOT ONLINE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/40 hidden lg:inline">AFORO TOTAL: 306 CAMPERS</span>
            <span className="text-white/30 hidden lg:inline">//</span>
            <span className="text-emerald-400 font-semibold">ESTADO: 100% OPERACIONAL</span>
          </div>
        </div>
      </div>

      {/* Barra Principal de Navegación */}
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Marca con estilo cósmico Campuslands */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-campus-teal to-campus-purple rounded-xl blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative w-10 h-10 rounded-xl bg-campus-surface border border-white/15 flex items-center justify-center shadow-lg">
              <Orbit className="w-6 h-6 text-campus-teal" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
                CAMPUS<span className="text-campus-teal font-extrabold">LANDS</span>
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-campus-cyan/10 text-campus-cyan border border-campus-cyan/20 font-semibold tracking-wider">
                OpsCenter
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-light">
              Gestión Integral de Espacios, Equipos y Triaje IA
            </p>
          </div>
        </div>

        {/* Selector de Roles (Admin vs Camper/Cliente) + Botón Sincronizar */}
        <div className="flex items-center gap-3">
          {/* Switcher de Rol */}
          <div className="bg-campus-surface/90 border border-white/10 p-1 rounded-xl flex items-center gap-1 shadow-inner">
            <button
              onClick={() => onRoleChange('client')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentRole === 'client'
                  ? 'bg-gradient-to-r from-campus-teal to-campus-blue text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Camper / Trainer</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentRole === 'admin'
                  ? 'bg-gradient-to-r from-campus-purple to-pink-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrador</span>
            </button>
          </div>

          {/* Botón de Sincronización */}
          <button
            onClick={onSync}
            disabled={isLoading}
            className="p-2 rounded-xl bg-campus-surface hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition shadow-sm active:scale-95"
            title="Sincronizar con el servidor"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-campus-teal' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
