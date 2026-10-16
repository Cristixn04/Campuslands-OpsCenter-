import React, { useState } from 'react';
import { Building2, X, PlusCircle, Users, MapPin, Layers, AlertTriangle } from 'lucide-react';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSpace: (space: { nombre: string; tipo: string; capacidad: number; ubicacion: string }) => Promise<void>;
  isLoading: boolean;
}

export const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  isOpen,
  onClose,
  onCreateSpace,
  isLoading
}) => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('laboratorio_ia');
  const [capacidad, setCapacidad] = useState<number>(25);
  const [ubicacion, setUbicacion] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre de la sala es obligatorio.');
      return;
    }
    if (capacidad <= 0) {
      setError('La capacidad debe ser un número mayor a 0.');
      return;
    }
    if (!ubicacion.trim()) {
      setError('La ubicación dentro del campus es obligatoria.');
      return;
    }

    try {
      await onCreateSpace({
        nombre: nombre.trim(),
        tipo,
        capacidad: Number(capacidad),
        ubicacion: ubicacion.trim()
      });
      // Limpiar formulario y cerrar
      setNombre('');
      setTipo('laboratorio_ia');
      setCapacidad(25);
      setUbicacion('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la sala o espacio.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel max-w-md w-full rounded-2xl p-4 sm:p-6 relative border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200 my-4 sm:my-8">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-campus-purple/20 text-campus-purple border border-campus-purple/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Agregar Nuevo Espacio</h2>
            <p className="text-[11px] font-mono text-campus-teal uppercase tracking-wider">
              Gestión de Infraestructura Campuslands
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          Registra una nueva sala, aula o laboratorio. El sistema la integrará inmediatamente al mapa de aforos y al sistema de reservas y agenda.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de la Sala */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">
              Nombre de la Sala / Espacio *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Laboratorio Quantum, Aula Lovelace"
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-purple focus:ring-1 focus:ring-campus-purple/40"
              required
            />
          </div>

          {/* Tipo de Espacio */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-campus-cyan" />
              Tipo de Espacio *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-campus-purple focus:ring-1 focus:ring-campus-purple/40 cursor-pointer"
            >
              <option value="laboratorio_ia">Laboratorio IA</option>
              <option value="aula_tecnologica">Aula Tecnológica</option>
              <option value="aula_magna">Aula Magna</option>
              <option value="aula">Aula de Clase</option>
              <option value="cubículo">Cubículo de Estudio</option>
              <option value="auditorio">Auditorio Central</option>
              <option value="sala_reuniones">Sala de Reuniones</option>
            </select>
          </div>

          {/* Capacidad y Aforo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-campus-teal" />
                Capacidad Máxima (Aforo) *
              </label>
              <span className="text-[11px] font-mono text-slate-400">campers / personas</span>
            </div>
            <input
              type="number"
              min={1}
              max={500}
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-campus-purple focus:ring-1 focus:ring-campus-purple/40"
              required
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Ubicación Física en Campus *
            </label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej. Piso 3 - Ala Norte, Edificio Principal"
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-purple focus:ring-1 focus:ring-campus-purple/40"
              required
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-purple to-pink-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isLoading ? 'Registrando...' : 'Registrar Sala'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
