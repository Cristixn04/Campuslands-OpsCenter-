import React, { useState } from 'react';
import { Laptop, X, PlusCircle, Tag, MapPin, Hash, AlertTriangle } from 'lucide-react';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateResource: (resource: { nombre: string; categoria: string; serial: string; ubicacion_actual: string }) => Promise<void>;
  isLoading: boolean;
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  onCreateResource,
  isLoading
}) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('computo');
  const [serial, setSerial] = useState('');
  const [ubicacionActual, setUbicacionActual] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }
    if (!serial.trim()) {
      setError('El serial único del equipo es obligatorio.');
      return;
    }
    if (!ubicacionActual.trim()) {
      setError('La ubicación o sala de custodia es obligatoria.');
      return;
    }

    try {
      await onCreateResource({
        nombre: nombre.trim(),
        categoria,
        serial: serial.trim().toUpperCase(),
        ubicacion_actual: ubicacionActual.trim()
      });
      // Limpiar formulario y cerrar
      setNombre('');
      setCategoria('computo');
      setSerial('');
      setUbicacionActual('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrar el equipo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel max-w-md w-full rounded-2xl p-6 relative border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-campus-teal/20 text-campus-teal border border-campus-teal/30">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Agregar Equipo Tecnológico</h2>
            <p className="text-[11px] font-mono text-campus-teal uppercase tracking-wider">
              Control de Inventario Campuslands
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          Ingresa un nuevo activo tecnológico al inventario central. Se le asignará seguimiento digital y disponibilidad para reservas de campers y trainers.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre del Equipo */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">
              Nombre o Modelo del Equipo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Laptop Dell XPS Dev Lab, Proyector Láser 4K"
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40"
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-campus-cyan" />
              Categoría Tecnológica *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40 cursor-pointer"
            >
              <option value="computo">Cómputo / Laptops</option>
              <option value="audiovisual">Audiovisual / Proyectores</option>
              <option value="audio">Audio / Microfonía</option>
              <option value="redes">Redes / Telecom</option>
              <option value="otro">Accesorios / Otro</option>
            </select>
          </div>

          {/* Serial Único */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-campus-teal" />
              Serial Único / Placa de Inventario *
            </label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="Ej. DEV-XPS-009, PRJ-4K-003"
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs font-mono uppercase text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40"
              required
            />
          </div>

          {/* Ubicación Actual */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Ubicación Inicial / Sala Asignada *
            </label>
            <input
              type="text"
              value={ubicacionActual}
              onChange={(e) => setUbicacionActual(e.target.value)}
              placeholder="Ej. Skilab, Apolo, Almacén Central"
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40"
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-teal to-campus-blue hover:opacity-90 text-white shadow-lg shadow-teal-500/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isLoading ? 'Registrando...' : 'Registrar Equipo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
