import React, { useState } from 'react';
import { Espacio } from '../../types';
import { SpaceCard } from './SpaceCard';
import { UserRole } from '../layout/Navbar';
import { Filter, Search, PlusCircle } from 'lucide-react';

interface SpaceGridProps {
  spaces: Espacio[];
  role: UserRole;
  onSelectToReserve: (spaceId: string) => void;
  onToggleStatusAdmin?: (spaceId: string, newStatus: string) => void;
  onOpenCreateModal?: () => void;
}

export const SpaceGrid: React.FC<SpaceGridProps> = ({
  spaces,
  role,
  onSelectToReserve,
  onToggleStatusAdmin,
  onOpenCreateModal
}) => {
  const [filterType, setFilterType] = useState<string>('todos');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSpaces = spaces.filter(space => {
    // Filtro por tipo
    if (filterType === 'aulas' && !['aula', 'aula_magna', 'aula_tecnologica', 'aula_teorica'].includes(space.tipo.toLowerCase())) {
      return false;
    }
    if (filterType === 'reuniones' && !space.tipo.toLowerCase().includes('reunion') && !space.tipo.toLowerCase().includes('sala_reuniones')) {
      return false;
    }
    if (filterType === 'cubiculos' && !space.tipo.toLowerCase().includes('cubículo')) {
      return false;
    }
    if (filterType === 'labs' && !space.tipo.toLowerCase().includes('laboratorio')) {
      return false;
    }
    if (filterType === 'auditorio' && !space.tipo.toLowerCase().includes('auditorio')) {
      return false;
    }

    // Filtro solo disponibles
    if (onlyAvailable && space.estado !== 'disponible') {
      return false;
    }

    // Búsqueda por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return space.nombre.toLowerCase().includes(q) || space.ubicacion.toLowerCase().includes(q);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="crystal-lens-card p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Pills de Filtrado */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5 mr-1 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <Filter className="w-3.5 h-3.5 text-campus-teal" />
            Filtros:
          </span>
          {[
            { id: 'todos', label: `Todos (${spaces.length})` },
            { id: 'aulas', label: 'Aulas' },
            { id: 'labs', label: 'Laboratorios IA' },
            { id: 'reuniones', label: 'Salas de Reuniones' },
            { id: 'cubiculos', label: 'Cubículos' },
            { id: 'auditorio', label: 'Auditorio' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === tab.id
                  ? 'bg-campus-teal/20 text-campus-teal border border-campus-teal/40 font-semibold'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Checkbox solo disponibles y buscador */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded bg-campus-deep border-white/20 text-campus-teal focus:ring-0 focus:ring-offset-0"
            />
            <span>Solo disponibles</span>
          </label>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar sala o piso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30 transition shadow-inner"
            />
          </div>

          {role === 'admin' && onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-purple to-pink-600 hover:opacity-90 text-white shadow-md shadow-purple-500/20 transition active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nueva Sala</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Salas */}
      {filteredSpaces.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-xs">
          No se encontraron espacios con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSpaces.map(sp => (
            <SpaceCard
              key={sp.id}
              space={sp}
              role={role}
              onSelectToReserve={onSelectToReserve}
              onToggleStatusAdmin={onToggleStatusAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
};
