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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* KPI 1: Salas Operativas */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group hover:border-campus-teal/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">Salas Disponibles</span>
          <div className="p-2 rounded-xl bg-campus-teal/10 text-campus-teal border border-campus-teal/20">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">{espaciosDisponibles}</span>
          <span className="text-xs text-slate-400">/ {spaces.length} espacios</span>
        </div>
        {espaciosInhabilitados > 0 && (
          <p className="text-[10px] text-campus-danger font-medium mt-1">
            ⚠️ {espaciosInhabilitados} sala(s) inhabilitada(s)
          </p>
        )}
      </div>

      {/* KPI 2: Aforo Total Instalado */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group hover:border-campus-cyan/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">Capacidad Oficial</span>
          <div className="p-2 rounded-xl bg-campus-cyan/10 text-campus-cyan border border-campus-cyan/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">{totalCapacidad}</span>
          <span className="text-xs text-slate-400">campers max</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Aforo validado por Regla 1</p>
      </div>

      {/* KPI 3: Equipos Disponibles */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group hover:border-campus-blue/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">Recursos en Stock</span>
          <div className="p-2 rounded-xl bg-campus-blue/10 text-campus-blue border border-campus-blue/20">
            <Laptop className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">{recursosDisponibles}</span>
          <span className="text-xs text-slate-400">/ {resources.length} equipos</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Laptops, Proyectores & Audio</p>
      </div>

      {/* KPI 4: Estado Operativo e Incidentes */}
      <div className={`glass-panel rounded-2xl p-4 relative overflow-hidden group transition-all duration-300 ${
        incidentesCriticos > 0 ? 'border-campus-danger/50 bg-campus-danger/5' : 'hover:border-emerald-500/40'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">Alertas Operativas</span>
          <div className={`p-2 rounded-xl ${
            incidentesCriticos > 0 
              ? 'bg-campus-danger/20 text-campus-danger animate-pulse border border-campus-danger/30' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {incidentesCriticos > 0 ? <AlertOctagon className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${incidentesCriticos > 0 ? 'text-campus-danger' : 'text-emerald-400'}`}>
            {incidentesCriticos}
          </span>
          <span className="text-xs text-slate-400">bloqueos activos</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {incidentesCriticos > 0 ? 'Requiere atención de mantenimiento' : 'Operación normal sin bloqueos'}
        </p>
      </div>
    </div>
  );
};
