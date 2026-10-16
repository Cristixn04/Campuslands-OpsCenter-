import React from 'react';
import { ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

export type UserRole = 'admin' | 'client';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSync: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange, onSync, isLoading }) => {
  return (
    <header className="border-b border-white/10 bg-[#060c1a]/95 backdrop-blur-2xl sticky top-0 z-50 shadow-2xl">
      {/* Ticker estilo Terminal Campuslands */}
      <div className="border-b border-white/5 bg-[#02050e]/95 py-1.5 px-6 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-campus-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-campus-teal"></span>
            </span>
            <span className="text-campus-teal font-semibold">CAMPUSLANDS OPS</span>
            <span className="text-white/30">//</span>
            <span className="hidden sm:inline">NODO CENTRAL OPERATIVO</span>
            <span className="text-white/30 hidden sm:inline">//</span>
            <span className="text-campus-cyan hidden md:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-campus-cyan animate-pulse"></span>
              GEMINI 3.8 FLASH COPILOT ONLINE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/40 hidden lg:inline">AFORO: 306 CAMPERS</span>
            <span className="text-white/30 hidden lg:inline">//</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              SISTEMA NOMINAL
            </span>
          </div>
        </div>
      </div>

      {/* Barra Principal de Navegación con Logo Oficial */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo Oficial de Campuslands */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 group">
            {/* Casco Oficial de Astronauta */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-campus-teal to-campus-purple rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
              <img
                src="/casco_azul.svg"
                alt="Campuslands Helmet"
                className="relative w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110 animate-float"
              />
            </div>
            {/* Texto Oficial Campuslands */}
            <div className="flex items-center gap-2">
              <img
                src="/CampuslandsText.svg"
                alt="Campuslands"
                className="h-5 w-auto object-contain brightness-110"
              />
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-campus-cyan/15 text-campus-cyan border border-campus-cyan/30 font-semibold tracking-wider">
                OpsCenter
              </span>
            </div>
          </a>
        </div>

        {/* Switcher de Roles (Admin vs Camper/Cliente) + Botón Sincronizar */}
        <div className="flex items-center gap-3">
          <div className="bg-[#030712] border border-white/15 p-1 rounded-xl flex items-center gap-1 shadow-inner">
            <button
              onClick={() => onRoleChange('client')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
            className="p-2 rounded-xl bg-[#030712] hover:bg-[#0c1830] border border-white/15 text-slate-300 hover:text-white transition shadow-sm active:scale-95"
            title="Sincronizar datos del campus"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-campus-teal' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
