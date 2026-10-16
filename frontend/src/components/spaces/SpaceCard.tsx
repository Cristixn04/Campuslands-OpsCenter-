import React from 'react';
import { Users, MapPin, CalendarPlus, ShieldAlert, Wrench, CheckCircle } from 'lucide-react';
import { Espacio } from '../../types';
import { UserRole } from '../layout/Navbar';

interface SpaceCardProps {
  space: Espacio;
  role: UserRole;
  onSelectToReserve: (spaceId: string) => void;
  onToggleStatusAdmin?: (spaceId: string, newStatus: string) => void;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({
  space,
  role,
  onSelectToReserve,
  onToggleStatusAdmin
}) => {
  const isInhabilitado = space.estado === 'inhabilitado';
  const isOcupado = space.estado === 'ocupado';
  const isDisponible = space.estado === 'disponible';

  // Obtener estilo visual de categoría
  const getBadgeType = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'auditorio':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'laboratorio_ia':
        return 'bg-campus-cyan/10 text-campus-cyan border-campus-cyan/20';
      case 'aula_tecnologica':
      case 'aula_magna':
        return 'bg-campus-blue/10 text-blue-300 border-blue-500/20';
      case 'cubículo':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    }
  };

  return (
    <div
      className={`glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
        isInhabilitado
          ? 'border-campus-danger/40 bg-campus-danger/5 shadow-lg shadow-rose-950/20'
          : isOcupado
          ? 'border-campus-warning/40 bg-campus-warning/5'
          : 'hover:border-campus-teal/50'
      }`}
    >
      {/* Glow de fondo para inhabilitados */}
      {isInhabilitado && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-campus-danger/10 blur-2xl pointer-events-none rounded-full -mr-10 -mt-10"></div>
      )}

      {/* Header de la Tarjeta */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${getBadgeType(space.tipo)}`}>
              {space.tipo.replace('_', ' ')}
            </span>
            <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
              {space.nombre}
            </h3>
          </div>

          {/* Badge de Estado con Semáforo */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase font-semibold border ${
            isInhabilitado
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : isOcupado
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isInhabilitado
                ? 'bg-rose-400 animate-pulse'
                : isOcupado
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}></span>
            <span>{space.estado}</span>
          </div>
        </div>

        {/* Ubicación */}
        <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-4">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{space.ubicacion}</span>
        </p>

        {/* Métrica de Aforo */}
        <div className="bg-campus-deep/60 border border-white/5 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-campus-teal" />
              Capacidad Instalada:
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {space.capacidad} <span className="text-xs font-normal text-slate-400">personas</span>
            </span>
          </div>
          {/* Barra de capacidad */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isInhabilitado 
                  ? 'bg-campus-danger' 
                  : isOcupado 
                  ? 'bg-campus-warning' 
                  : 'bg-gradient-to-r from-campus-teal to-campus-cyan'
              }`}
              style={{ width: isInhabilitado ? '100%' : '65%' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Botones de Acción según el Rol */}
      <div className="pt-2 border-t border-white/5">
        {role === 'client' ? (
          // Vista Camper/Cliente
          <button
            onClick={() => onSelectToReserve(space.id)}
            disabled={isInhabilitado}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isInhabilitado
                ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-to-r from-campus-teal to-campus-blue hover:opacity-90 text-white shadow-lg shadow-campus-teal/20 active:scale-[0.98]'
            }`}
          >
            {isInhabilitado ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Bloqueado por Incidencia</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4" />
                <span>Reservar Espacio</span>
              </>
            )}
          </button>
        ) : (
          // Vista Administrador (Gestión directa)
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectToReserve(space.id)}
              className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-campus-teal" />
              <span>Ver / Reservar</span>
            </button>

            {onToggleStatusAdmin && (
              <button
                onClick={() => onToggleStatusAdmin(space.id, isDisponible ? 'inhabilitado' : 'disponible')}
                className={`p-2 rounded-xl border text-xs font-medium transition ${
                  isInhabilitado
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
                title={isInhabilitado ? 'Habilitar Sala' : 'Inhabilitar Sala manualmente'}
              >
                {isInhabilitado ? <CheckCircle className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
