import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  MapPin, 
  Sparkles, 
  Laptop, 
  Tv, 
  Mic, 
  Network, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle,
  Wrench,
  Camera
} from 'lucide-react';
import { Recurso } from '../../types';

interface ResourceImageModalProps {
  resource: Recurso | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceImageModal: React.FC<ResourceImageModalProps> = ({
  resource,
  isOpen,
  onClose
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state when resource changes
  useEffect(() => {
    setImageError(false);
  }, [resource?.id, resource?.imagen_url]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !resource) return null;

  const getCategoryBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'audiovisual':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10';
      case 'computo':
        return 'bg-campus-cyan/20 text-campus-cyan border-campus-cyan/40 shadow-cyan-500/10';
      case 'audio':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-500/10';
      case 'redes':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40 shadow-slate-500/10';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'audiovisual':
        return <Tv className="w-8 h-8 text-purple-400" />;
      case 'computo':
        return <Laptop className="w-8 h-8 text-campus-cyan" />;
      case 'audio':
        return <Mic className="w-8 h-8 text-blue-400" />;
      case 'redes':
        return <Network className="w-8 h-8 text-amber-400" />;
      default:
        return <Cpu className="w-8 h-8 text-campus-teal" />;
    }
  };

  const getFallbackGradient = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'audiovisual':
        return 'from-purple-900/50 via-[#100720] to-[#030611]';
      case 'computo':
        return 'from-cyan-900/50 via-[#071626] to-[#030611]';
      case 'audio':
        return 'from-blue-900/50 via-[#0a1530] to-[#030611]';
      case 'redes':
        return 'from-amber-900/40 via-[#1e1308] to-[#030611]';
      default:
        return 'from-teal-900/40 via-[#051a1e] to-[#030611]';
    }
  };

  const isDisponible = resource.estado === 'disponible';
  const isInhabilitado = resource.estado === 'inhabilitado' || resource.estado === 'en_mantenimiento';
  const hasImage = Boolean(resource.imagen_url && !imageError);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="glass-panel max-w-2xl w-full rounded-3xl p-5 sm:p-7 relative border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow prismático de fondo cósmico */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none -mt-24 bg-gradient-to-br from-campus-teal/20 via-purple-600/15 to-transparent" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none -mb-24 bg-gradient-to-tr from-campus-cyan/20 via-blue-600/15 to-transparent" />

        {/* Botón cerrar esquina superior */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition z-20 group"
          title="Cerrar (Esc)"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Cabecera del Recurso */}
        <div className="mb-4 pr-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm font-semibold ${getCategoryBadge(resource.categoria)}`}>
              {resource.categoria}
            </span>

            <span className={`text-[11px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
              isDisponible
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : isInhabilitado
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              {isDisponible ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : isInhabilitado ? (
                <Wrench className="w-3 h-3 text-rose-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              )}
              <span>{resource.estado.replace('_', ' ')}</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {resource.nombre}
          </h2>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 bg-campus-deep/80 px-2.5 py-1 rounded-lg border border-white/5">
              <Tag className="w-3.5 h-3.5 text-campus-teal" />
              <span>SERIAL:</span>
              <span className="text-slate-200 font-semibold">{resource.serial}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-campus-deep/80 px-2.5 py-1 rounded-lg border border-white/5">
              <MapPin className="w-3.5 h-3.5 text-campus-cyan" />
              <span>SALA:</span>
              <span className="text-campus-cyan font-semibold">{resource.ubicacion_actual}</span>
            </div>
          </div>
        </div>

        {/* Contenedor de la Imagen con Brillo Prismático */}
        <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-campus-cyan/60 via-purple-500/50 to-campus-teal/60 shadow-[0_0_35px_rgba(84,198,170,0.25)] overflow-hidden mb-5">
          {/* Destello de bisel prismático superior */}
          <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none z-10" />

          <div className="relative w-full h-64 sm:h-96 rounded-[14px] overflow-hidden bg-[#030611] flex items-center justify-center">
            {hasImage ? (
              <>
                <img
                  src={resource.imagen_url}
                  alt={resource.nombre}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
                {/* Degradado inferior para contraste sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Badge flotante en la foto */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono text-white/90 shadow-lg">
                  <Sparkles className="w-3 h-3 text-campus-teal animate-pulse" />
                  <span>Fotografía Oficial de Inventario</span>
                </div>
              </>
            ) : (
              // Fallback temático de alta tecnología cósmica según categoría
              <div className={`w-full h-full bg-gradient-to-br ${getFallbackGradient(resource.categoria)} flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`}>
                {/* Cuadrícula holográfica cósmica */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(84,198,170,0.15)] backdrop-blur-sm">
                    {getCategoryIcon(resource.categoria)}
                  </div>
                  
                  <span className="text-xs font-mono text-campus-teal uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-1">
                    <Camera className="w-3.5 h-3.5" /> RECURSO SIN FOTO PERSONALIZADA
                  </span>

                  <h3 className="text-base sm:text-lg font-bold text-white max-w-md">
                    {resource.nombre}
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Activo tecnológico registrado y auditado por la coordinación técnica del campus.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-campus-teal animate-pulse" />
            <span>ID: {resource.id}</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition active:scale-95 border border-white/10"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
};
