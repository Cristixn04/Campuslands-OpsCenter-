import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  QrCode, 
  MapPin, 
  Tag, 
  Wrench, 
  CheckCircle, 
  PlusCircle, 
  Camera, 
  Eye, 
  Tv,
  Mic,
  Network,
  Cpu
} from 'lucide-react';
import { Recurso } from '../../types';
import { UserRole } from '../layout/Navbar';
import { ResourceImageModal } from './ResourceImageModal';

interface ResourceListProps {
  resources: Recurso[];
  role: UserRole;
  onToggleStatusAdmin?: (resourceId: string, newStatus: string) => void;
  onOpenCreateModal?: () => void;
}

// Mapa de imágenes predeterminadas para hardware inicial del campus con Unsplash en alta resolución
const DEFAULT_RESOURCE_IMAGES: Record<string, string> = {
  // Por ID
  'rec-01': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80', // Proyector Epson 4K
  'rec-02': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80', // Micrófonos Shure
  'rec-03': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80', // Laptop Dell XPS
  'rec-04': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80', // Cámara PTZ Sony
  'rec-05': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80', // Router Cisco Gigabit
  'rec-06': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80', // Switch de Red 24 Puertos PoE

  // Por Serial
  'EPS-4K-9012': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
  'SHU-MIC-3310': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
  'DELL-XPS-1502': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
  'SNY-PTZ-8821': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  'CIS-NET-4401': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  'NET-SW-2409': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
};

// Resolver de imágenes inteligente para equipos del campus
const resolveResourceImageUrl = (resource: Recurso, customMap: Record<string, string>): string | undefined => {
  // 1. Si el recurso ya trae imagen_url definida directamente
  if (resource.imagen_url) return resource.imagen_url;

  // 2. Imagen personalizada almacenada en localStorage por Serial o ID
  const sUpper = resource.serial?.trim().toUpperCase();
  if (sUpper && customMap[sUpper]) return customMap[sUpper];
  if (resource.id && customMap[resource.id]) return customMap[resource.id];

  // 3. Presets exactos por ID o Serial
  if (resource.id && DEFAULT_RESOURCE_IMAGES[resource.id]) return DEFAULT_RESOURCE_IMAGES[resource.id];
  if (sUpper && DEFAULT_RESOURCE_IMAGES[sUpper]) return DEFAULT_RESOURCE_IMAGES[sUpper];

  // 4. Búsqueda por palabras clave en el nombre del equipo
  const name = resource.nombre.toLowerCase();
  if (name.includes('epson') || name.includes('proyector')) {
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('shure') || name.includes('micr')) {
    return 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('dell') || name.includes('xps') || name.includes('laptop') || name.includes('thinkpad')) {
    return 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('ptz') || name.includes('sony') || name.includes('cámara') || name.includes('camara') || name.includes('streaming')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('cisco') || name.includes('router') || name.includes('móvil') || name.includes('movil')) {
    return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('switch') || name.includes('poe') || name.includes('puertos')) {
    return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80';
  }
  if (name.includes('gpu') || name.includes('nvidia') || name.includes('a100') || name.includes('servidor') || name.includes('server')) {
    return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80';
  }

  // 5. Presets genéricos de alta calidad por categoría
  const cat = resource.categoria.toLowerCase();
  if (cat === 'computo') {
    return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80';
  }
  if (cat === 'audiovisual') {
    return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80';
  }
  if (cat === 'audio') {
    return 'https://images.unsplash.com/photo-1520523839898-50712825e617?auto=format&fit=crop&w=1200&q=80';
  }
  if (cat === 'redes') {
    return 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=1200&q=80';
  }

  return undefined;
};

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  role,
  onToggleStatusAdmin,
  onOpenCreateModal
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedQrResource, setSelectedQrResource] = useState<Recurso | null>(null);
  const [selectedImageResource, setSelectedImageResource] = useState<Recurso | null>(null);

  // Estado para imágenes personalizadas leídas de localStorage en tiempo real
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  const loadCustomImages = () => {
    try {
      const stored = localStorage.getItem('campus_resource_images');
      if (stored) {
        setCustomImages(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error al sincronizar imágenes de campus_resource_images:', err);
    }
  };

  useEffect(() => {
    loadCustomImages();

    // Sincronizar automáticamente en tiempo real ante eventos de storage
    const handleStorageChange = () => {
      loadCustomImages();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fusión reactiva en tiempo real de recursos con sus imágenes
  const mergedResources: Recurso[] = resources.map(res => ({
    ...res,
    imagen_url: resolveResourceImageUrl(res, customImages)
  }));

  const filteredResources = mergedResources.filter(res => {
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

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'audiovisual':
        return <Tv className="w-5 h-5 text-purple-400" />;
      case 'computo':
        return <Laptop className="w-5 h-5 text-campus-cyan" />;
      case 'audio':
        return <Mic className="w-5 h-5 text-blue-400" />;
      case 'redes':
        return <Network className="w-5 h-5 text-amber-400" />;
      default:
        return <Cpu className="w-5 h-5 text-campus-teal" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-campus-teal shrink-0" />
            <h2 className="text-base font-bold text-white tracking-tight">Inventario de Recursos Tecnológicos</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Trazabilidad de hardware, equipos audiovisuales, fotografías y pases digitales de préstamo en el campus.
          </p>
        </div>

        {/* Filtro por Categoría y Botón Admin con Scroll Horizontal en Móviles */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-[#0c1830] border border-white/20 p-1 rounded-xl overflow-x-auto scrollbar-none touch-scroll max-w-full w-full sm:w-auto">
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
                className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 whitespace-nowrap transition ${
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-teal to-campus-blue hover:opacity-90 text-white shadow-md shadow-teal-500/20 transition active:scale-95 whitespace-nowrap shrink-0"
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
              className={`glass-panel glass-panel-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all ${
                isInhabilitado
                  ? 'border-campus-danger/40 bg-campus-danger/5'
                  : !isDisponible
                  ? 'border-campus-warning/40 bg-campus-warning/5'
                  : 'hover:border-campus-teal/40'
              }`}
            >
              <div>
                {/* Cabecera de la Tarjeta con Badges */}
                <div className="flex justify-between items-start mb-3">
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

                {/* Previsualización de Fotografía del Equipo */}
                <div 
                  onClick={() => setSelectedImageResource(rec)}
                  className="relative h-36 w-full rounded-xl overflow-hidden mb-3.5 bg-[#030611] border border-white/10 group/img cursor-pointer shadow-inner"
                  title="Haz clic para ver en alta resolución"
                >
                  {rec.imagen_url ? (
                    <img
                      src={rec.imagen_url}
                      alt={rec.nombre}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900/60 to-[#030611] flex flex-col items-center justify-center p-3 text-center">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-1.5">
                        {getCategoryIcon(rec.categoria)}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Campus Tech Gear</span>
                    </div>
                  )}

                  {/* Degradado inferior con badge flotante para expandir */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060c1a] via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono text-white/90 flex items-center gap-1 opacity-90 group-hover/img:opacity-100 transition shadow-sm">
                    <Eye className="w-3 h-3 text-campus-teal" />
                    <span>Ver</span>
                  </div>
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

              {/* Botones de Acciones */}
              <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                {/* Botón interactivo "Ver Foto" */}
                <button
                  onClick={() => setSelectedImageResource(rec)}
                  className="px-3 py-2 rounded-xl bg-campus-teal/15 hover:bg-campus-teal/25 border border-campus-teal/30 hover:border-campus-teal/50 text-xs font-semibold text-campus-teal hover:text-white transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap"
                  title="Visualizar fotografía del equipo en alta resolución"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ver Foto</span>
                </button>

                {/* Botón Pase QR de Préstamo */}
                <button
                  onClick={() => setSelectedQrResource(rec)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-campus-cyan" />
                  <span>Pase QR</span>
                </button>

                {/* Toggle Admin de Mantenimiento */}
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

      {/* Modal Fotográfico Emergente */}
      <ResourceImageModal
        resource={selectedImageResource}
        isOpen={Boolean(selectedImageResource)}
        onClose={() => setSelectedImageResource(null)}
      />

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
