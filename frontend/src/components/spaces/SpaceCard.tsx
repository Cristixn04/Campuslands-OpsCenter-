import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  CalendarPlus, 
  ShieldAlert, 
  Wrench, 
  CheckCircle, 
  Sparkles,
  Camera
} from 'lucide-react';
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
  const [imageError, setImageError] = useState<boolean>(false);

  const isInhabilitado = space.estado === 'inhabilitado';
  const isOcupado = space.estado === 'ocupado';
  const isDisponible = space.estado === 'disponible';

  // Obtener estilo visual de categoría (Inspirado en media_1792159729300.png)
  const getBadgeType = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'auditorio':
        return 'bg-purple-950/70 text-purple-200 border-purple-500/30';
      case 'laboratorio_ia':
        return 'bg-cyan-950/70 text-campus-cyan border-cyan-500/30';
      case 'aula_tecnologica':
      case 'aula_magna':
        return 'bg-blue-950/70 text-blue-200 border-blue-500/30';
      case 'cubículo':
        return 'bg-amber-950/70 text-amber-200 border-amber-500/30';
      default:
        return 'bg-slate-900/70 text-slate-200 border-slate-500/30';
    }
  };

  // Generador de fallback cósmico temático según el tipo de espacio
  const getFallbackGradient = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'auditorio':
        return 'from-purple-900/40 via-indigo-950/70 to-[#02050e]';
      case 'laboratorio_ia':
        return 'from-cyan-900/40 via-blue-950/70 to-[#02050e]';
      case 'aula_tecnologica':
      case 'aula_magna':
        return 'from-blue-900/40 via-slate-950/70 to-[#02050e]';
      case 'cubículo':
        return 'from-amber-900/30 via-slate-950/70 to-[#02050e]';
      default:
        return 'from-teal-900/30 via-slate-950/70 to-[#02050e]';
    }
  };

  // Resolución multi-formato de foto de la sala (Nombre slug o ID en .jpg, .png, .webp)
  const slug = space.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-');

  const candidateUrls = space.imagen_url
    ? [space.imagen_url]
    : [
        `/spaces/${slug}.jpg`,
        `/spaces/${slug}.png`,
        `/spaces/${slug}.webp`,
        `/spaces/${space.id}.jpg`,
        `/spaces/${space.id}.png`,
        `/spaces/${space.id}.webp`,
      ];

  const [urlIndex, setUrlIndex] = useState<number>(0);
  const photoUrl = candidateUrls[urlIndex] || '';

  const handleImageError = () => {
    if (urlIndex < candidateUrls.length - 1) {
      setUrlIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  return (
    <div
      className={`glass-morphism-card p-5 flex flex-col justify-between relative overflow-hidden group ${
        isInhabilitado
          ? 'border-campus-danger/40 shadow-lg shadow-rose-950/30'
          : isOcupado
          ? 'border-campus-warning/40 shadow-lg shadow-amber-950/20'
          : 'hover:border-campus-teal/50'
      }`}
    >
      {/* Glow cósmico de fondo suave (Ref: media_1792159729300.png) */}
      <div className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16 transition-opacity duration-500 ${
        isInhabilitado
          ? 'bg-rose-500/15 opacity-80'
          : isOcupado
          ? 'bg-amber-500/10 opacity-70'
          : 'bg-campus-teal/10 group-hover:bg-campus-teal/20 opacity-50 group-hover:opacity-100'
      }`} />

      <div>
        {/* ========================================================= */}
        {/* ESPACIO PARA FOTOGRAFÍA DE LA SALA                        */}
        {/* Donde integrar fotos: guarda en /frontend/public/spaces/   */}
        {/* con el nombre de la sala (ej. auditorio.jpg, spooki.jpg)  */}
        {/* ========================================================= */}
        <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-4 bg-[#030611] border border-white/10 group/img shadow-inner">
          {!imageError ? (
            <img
              src={photoUrl}
              alt={space.nombre}
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
            />
          ) : (
            // Placeholder de alta tecnología cósmica si aún no existe foto física
            <div className={`w-full h-full bg-gradient-to-br ${getFallbackGradient(space.tipo)} flex flex-col items-center justify-center p-4 text-center relative overflow-hidden`}>
              {/* Patrón de cuadrícula tecnológica */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mb-2 shadow-inner group-hover/img:scale-110 transition duration-300">
                <Camera className="w-6 h-6 text-campus-teal opacity-80" />
              </div>
              <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                {space.nombre}
              </span>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                Espacio Tecnológico Campuslands
              </span>
            </div>
          )}

          {/* Degradado inferior para fundir con el contenido */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060c1a] via-[#060c1a]/25 to-transparent pointer-events-none" />

          {/* Badges Flotantes sobre la Imagen (Frosted Glass Effect) */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
            {/* Tipo de espacio */}
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md shadow-lg font-semibold ${getBadgeType(space.tipo)}`}>
              {space.tipo.replace('_', ' ')}
            </span>

            {/* Badge de Estado con Semáforo */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold border backdrop-blur-md shadow-lg ${
              isInhabilitado
                ? 'bg-rose-950/80 text-rose-200 border-rose-500/40'
                : isOcupado
                ? 'bg-amber-950/80 text-amber-200 border-amber-500/40'
                : 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isInhabilitado
                  ? 'bg-rose-400 animate-pulse'
                  : isOcupado
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              }`} />
              <span>{space.estado}</span>
            </div>
          </div>

          {/* Tip visual para el desarrollador en hover */}
          <div className="absolute bottom-2 right-2.5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="text-[9px] font-mono text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-campus-teal" /> Vista de Sala
            </span>
          </div>
        </div>

        {/* Nombre y Ubicación */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-campus-teal transition-colors">
            {space.nombre}
          </h3>
          <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-campus-teal shrink-0" />
            <span>{space.ubicacion}</span>
          </p>
        </div>

        {/* Métrica de Aforo Cósmico con Barra de Capacidad */}
        <div className="crystal-lens-card !rounded-2xl p-3.5 mb-4 !border-white/15 !bg-white/[0.03] shadow-inner">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-200 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-campus-cyan" />
              Capacidad Oficial:
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {space.capacidad} <span className="text-xs font-normal text-slate-300">campers</span>
            </span>
          </div>

          {/* Barra de progreso de aforo */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isInhabilitado 
                  ? 'bg-campus-danger' 
                  : isOcupado 
                  ? 'bg-campus-warning' 
                  : 'bg-gradient-to-r from-campus-teal via-campus-cyan to-campus-blue'
              }`}
              style={{ width: isInhabilitado ? '100%' : '75%' }}
            />
          </div>
        </div>
      </div>

      {/* Botones de Acción según el Rol */}
      <div className="pt-2 border-t border-white/10">
        {role === 'client' ? (
          // Vista Camper/Cliente
          <button
            onClick={() => onSelectToReserve(space.id)}
            disabled={isInhabilitado}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isInhabilitado
                ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-to-r from-campus-teal to-campus-blue hover:opacity-95 text-white shadow-lg shadow-campus-teal/20 active:scale-[0.98]'
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
              className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-campus-teal" />
              <span>Ver / Reservar</span>
            </button>

            {onToggleStatusAdmin && (
              <button
                onClick={() => onToggleStatusAdmin(space.id, isDisponible ? 'inhabilitado' : 'disponible')}
                className={`p-2 rounded-xl border text-xs font-medium transition active:scale-95 ${
                  isInhabilitado
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
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
