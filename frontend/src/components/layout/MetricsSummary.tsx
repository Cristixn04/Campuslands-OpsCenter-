import React from 'react';
import { Building2, Users, Laptop, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Espacio, Recurso, Incidencia } from '../../types';

interface MetricsSummaryProps {
  spaces: Espacio[];
  resources: Recurso[];
  incidents: Incidencia[];
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ spaces, resources, incidents }) => {
  const totalCapacidad = spaces.reduce((acc, s) => acc + s.capacidad, 0);
  const espaciosDisponibles = spaces.filter(s => s.estado === 'disponible').length;
  const espaciosInhabilitados = spaces.filter(s => s.estado === 'inhabilitado').length;
  
  const recursosDisponibles = resources.filter(r => r.estado === 'disponible').length;
  const incidentesCriticos = incidents.filter(i => i.estado === 'ABIERTA' && (i.severidad === 'CRITICA' || i.severidad === 'ALTA')).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
      {/* KPI 1: Salas Operativas (Zenith Tower - Piso 6) */}
      <div className="crystal-lens-card crystal-lens-teal p-3.5 sm:p-5 min-h-[125px] sm:min-h-[148px] flex flex-col justify-between group cursor-default">
        {/* Glow prismático de lente */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-campus-teal/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2 relative z-10">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-campus-teal font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
            Salas Disponibles
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 bg-campus-teal/15 text-campus-teal border border-campus-teal/40 shadow-[0_0_16px_rgba(84,198,170,0.25)] backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 sm:gap-2 relative z-10 my-0.5 sm:my-1">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            {espaciosDisponibles}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            / {spaces.length} salas
          </span>
        </div>

        <div className="mt-2 sm:mt-2.5 pt-2 sm:pt-2.5 border-t border-white/10 relative z-10 flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-slate-300 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] flex items-center gap-1 sm:gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-campus-teal shadow-[0_0_6px_rgba(84,198,170,0.9)] shrink-0" />
            <span className="truncate">Zenith • Piso 6</span>
          </span>
          {espaciosInhabilitados > 0 && (
            <span className="text-[9px] sm:text-[10px] font-semibold text-rose-300 bg-rose-500/20 px-1.5 sm:px-2 py-0.5 rounded-full border border-rose-500/30 shrink-0 ml-1">
              {espaciosInhabilitados} inactiva(s)
            </span>
          )}
        </div>
      </div>

      {/* KPI 2: Capacidad Oficial Instalada */}
      <div className="crystal-lens-card crystal-lens-cyan p-3.5 sm:p-5 min-h-[125px] sm:min-h-[148px] flex flex-col justify-between group cursor-default">
        {/* Glow prismático de lente */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2 relative z-10">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-cyan-300 font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
            Capacidad Oficial
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 bg-cyan-400/15 text-campus-cyan border border-cyan-400/40 shadow-[0_0_16px_rgba(0,229,255,0.25)] backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 sm:gap-2 relative z-10 my-0.5 sm:my-1">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            {totalCapacidad}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            campers max
          </span>
        </div>

        <div className="mt-2 sm:mt-2.5 pt-2 sm:pt-2.5 border-t border-white/10 relative z-10 text-[10px] sm:text-[11px]">
          <span className="text-slate-300 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] flex items-center gap-1 sm:gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-campus-cyan shadow-[0_0_6px_rgba(0,229,255,0.9)] shrink-0" />
            <span className="truncate">Aforo en tiempo real</span>
          </span>
        </div>
      </div>

      {/* KPI 3: Recursos en Stock */}
      <div className="crystal-lens-card crystal-lens-blue p-3.5 sm:p-5 min-h-[125px] sm:min-h-[148px] flex flex-col justify-between group cursor-default">
        {/* Glow prismático de lente */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-sky-400/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2 relative z-10">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-sky-300 font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
            Recursos en Stock
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 bg-sky-400/15 text-sky-300 border border-sky-400/40 shadow-[0_0_16px_rgba(56,189,248,0.25)] backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
            <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 sm:gap-2 relative z-10 my-0.5 sm:my-1">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            {recursosDisponibles}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            / {resources.length} equipos
          </span>
        </div>

        <div className="mt-2 sm:mt-2.5 pt-2 sm:pt-2.5 border-t border-white/10 relative z-10 text-[10px] sm:text-[11px]">
          <span className="text-slate-300 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] flex items-center gap-1 sm:gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)] shrink-0" />
            <span className="truncate">Laptops, Audio & Más</span>
          </span>
        </div>
      </div>

      {/* KPI 4: Alertas Operativas */}
      <div className={`crystal-lens-card ${incidentesCriticos > 0 ? 'crystal-lens-rose' : 'crystal-lens-emerald'} p-3.5 sm:p-5 min-h-[125px] sm:min-h-[148px] flex flex-col justify-between group cursor-default`}>
        {/* Glow prismático de lente */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500 ${
          incidentesCriticos > 0 ? 'bg-rose-500/25' : 'bg-emerald-400/15'
        }`} />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2 relative z-10">
          <span className={`text-[10px] sm:text-[11px] font-mono tracking-wider uppercase font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight ${
            incidentesCriticos > 0 ? 'text-rose-300' : 'text-emerald-300'
          }`}>
            Alertas Operativas
          </span>
          <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 backdrop-blur-md transition-all duration-300 group-hover:scale-110 ${
            incidentesCriticos > 0
              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-[0_0_18px_rgba(244,63,94,0.35)] animate-pulse'
              : 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/40 shadow-[0_0_16px_rgba(52,211,153,0.25)]'
          }`}>
            {incidentesCriticos > 0 ? <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 sm:gap-2 relative z-10 my-0.5 sm:my-1">
          <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
            incidentesCriticos > 0 ? 'text-rose-300' : 'text-emerald-300'
          }`}>
            {incidentesCriticos}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {incidentesCriticos === 1 ? 'bloqueo' : 'bloqueos'}
          </span>
        </div>

        <div className="mt-2 sm:mt-2.5 pt-2 sm:pt-2.5 border-t border-white/10 relative z-10 text-[10px] sm:text-[11px]">
          <span className={`font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] flex items-center gap-1 sm:gap-1.5 truncate ${
            incidentesCriticos > 0 ? 'text-rose-200' : 'text-slate-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              incidentesCriticos > 0 
                ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)] animate-ping' 
                : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
            }`} />
            <span className="truncate">{incidentesCriticos > 0 ? 'Atención requerida' : 'Operación normal'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
