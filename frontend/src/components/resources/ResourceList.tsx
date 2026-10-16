import React, { useState } from 'react';
import { Laptop, QrCode, MapPin, Tag, Wrench, CheckCircle, PlusCircle } from 'lucide-react';
import { Recurso } from '../../types';
import { UserRole } from '../layout/Navbar';

interface ResourceListProps {
  resources: Recurso[];
  role: UserRole;
  onToggleStatusAdmin?: (resourceId: string, newStatus: string) => void;
  onOpenCreateModal?: () => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  role,
  onToggleStatusAdmin,
  onOpenCreateModal
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedQrResource, setSelectedQrResource] = useState<Recurso | null>(null);

  const filteredResources = resources.filter(res => {
    if (filterCategory !== 'all' && res.categoria.toLowerCase() !== filterCategory) {
      return false;
    }
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'audiovisual':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'computo':
        return 'bg-campus-cyan/15 text-campus-cyan border-campus-cyan/30';
      case 'audio':
        return 'bg-campus-blue/15 text-blue-300 border-blue-500/30';
      case 'redes':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-campus-teal" />
            <h2 className="text-base font-bold text-white tracking-tight">Inventario de Recursos Tecnológicos</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Trazabilidad de hardware, equipos audiovisuales y pases digitales de préstamo en el campus.
          </p>
        </div>

        {/* Filtro por Categoría y Botón Admin */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#0c1830] border border-white/20 p-1 rounded-xl">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'computo', label: 'Cómputo' },
              { id: 'audiovisual', label: 'Audiovisual' },
              { id: 'audio', label: 'Audio' },
              { id: 'redes', label: 'Redes' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterCategory === cat.id
                    ? 'bg-campus-teal/20 text-campus-teal border border-campus-teal/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {role === 'admin' && onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-teal to-campus-blue hover:opacity-90 text-white shadow-md shadow-teal-500/20 transition active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nuevo Equipo</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((rec) => {
          const isDisponible = rec.estado === 'disponible';
          const isInhabilitado = rec.estado === 'inhabilitado' || rec.estado === 'en_mantenimiento';

          return (
            <div
              key={rec.id}
              className={`glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between transition-all ${
                isInhabilitado
                  ? 'border-campus-danger/40 bg-campus-danger/5'
                  : !isDisponible
                  ? 'border-campus-warning/40 bg-campus-warning/5'
                  : 'hover:border-campus-teal/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadge(rec.categoria)}`}>
                    {rec.categoria}
                  </span>

                  <span className={`text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full border ${
                    isDisponible
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : isInhabilitado
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {rec.estado.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base mb-2">{rec.nombre}</h3>

                <div className="bg-campus-deep/60 border border-white/5 rounded-xl p-3 space-y-1.5 text-xs text-slate-400 font-mono mb-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Tag className="w-3.5 h-3.5" /> Serial:
                    </span>
                    <span className="text-slate-200 font-semibold">{rec.serial}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5" /> Ubicación:
                    </span>
                    <span className="text-campus-cyan">{rec.ubicacion_actual}</span>
                  </div>
                </div>
              </div>

              {/* Botón de Acciones */}
              <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                <button
                  onClick={() => setSelectedQrResource(rec)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-campus-teal" />
                  <span>Pase QR de Préstamo</span>
                </button>

                {role === 'admin' && onToggleStatusAdmin && (
                  <button
                    onClick={() => onToggleStatusAdmin(rec.id, isDisponible ? 'en_mantenimiento' : 'disponible')}
                    className={`p-2 rounded-xl border text-xs transition ${
                      isInhabilitado
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                    title={isInhabilitado ? 'Marcar como disponible' : 'Marcar en mantenimiento'}
                  >
                    {isInhabilitado ? <CheckCircle className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal QR Emergente */}
      {selectedQrResource && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-white/15 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <h3 className="text-base font-bold text-white">Pase Digital de Equipo</h3>
            <p className="text-xs text-slate-400">{selectedQrResource.nombre}</p>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CAMPUSLANDS-EQUIPO:${selectedQrResource.serial}`}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-campus-deep/80 p-2.5 rounded-xl border border-white/5">
              SERIAL: {selectedQrResource.serial}
            </div>

            <button
              onClick={() => setSelectedQrResource(null)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              Cerrar Pase
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
