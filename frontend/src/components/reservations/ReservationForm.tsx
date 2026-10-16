import React, { useState } from 'react';
import { CalendarPlus, AlertTriangle, Users, Laptop, CheckCircle2, X } from 'lucide-react';
import { Espacio, Recurso, Reserva } from '../../types';
import { UserRole } from '../layout/Navbar';

interface ReservationFormProps {
  spaces: Espacio[];
  resources: Recurso[];
  role: UserRole;
  preselectedSpaceId?: string;
  onClose?: () => void;
  onSubmitReservation: (reserva: Omit<Reserva, 'id' | 'estado'>) => Promise<void>;
  isLoading: boolean;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  spaces,
  resources,
  role,
  preselectedSpaceId,
  onClose,
  onSubmitReservation,
  isLoading
}) => {
  const [spaceId, setSpaceId] = useState(preselectedSpaceId || '');
  const [resourceId, setResourceId] = useState('');
  const [applicant, setApplicant] = useState(role === 'client' ? 'Camper Juan Pérez / Cohorte 2026' : 'Trainer / Operaciones');
  const [reason, setReason] = useState('');
  const [attendees, setAttendees] = useState<number>(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedSpace = spaces.find(s => s.id === spaceId);

  // Validación reactiva de aforo en tiempo real (Regla 1 en el cliente)
  const isOverCapacity = selectedSpace ? attendees > selectedSpace.capacidad : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!spaceId) {
      setValidationError('Debes seleccionar un espacio.');
      return;
    }

    if (selectedSpace && selectedSpace.estado === 'inhabilitado') {
      setValidationError(`El espacio '${selectedSpace.nombre}' está inhabilitado por incidentes y no puede ser reservado.`);
      return;
    }

    if (isOverCapacity && selectedSpace) {
      setValidationError(`Conflicto de Aforo: La sala '${selectedSpace.nombre}' tiene aforo de ${selectedSpace.capacidad} personas. No se permiten ${attendees} asistentes.`);
      return;
    }

    if (!startDate || !endDate) {
      setValidationError('Debes indicar fecha y hora de inicio y fin.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setValidationError('La fecha de inicio debe ser anterior a la de finalización.');
      return;
    }

    try {
      await onSubmitReservation({
        espacio_id: spaceId,
        recurso_id: resourceId || undefined,
        solicitante: applicant,
        motivo: reason || 'Sesión de aprendizaje / Desarrollo Tech',
        asistentes: Number(attendees),
        fecha_inicio: start.toISOString(),
        fecha_fin: end.toISOString()
      });
      if (onClose) onClose();
    } catch (err: any) {
      setValidationError(err.response?.data?.detail || 'Error al procesar la reserva.');
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative border border-white/10 shadow-2xl">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-campus-teal/15 text-campus-teal border border-campus-teal/30">
          <CalendarPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Registrar Nueva Reserva</h2>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Control de Aforo y No-Solapamiento
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-5 leading-relaxed">
        Completa los detalles para reservar un espacio en el campus. El sistema valida automáticamente el aforo instalado y la disponibilidad del horario.
      </p>

      {validationError && (
        <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Espacio */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1.5">
            Espacio o Sala Requerida *
          </label>
          <select
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30 cursor-pointer"
            required
          >
            <option value="">-- Seleccionar Espacio --</option>
            {spaces.map(s => {
              const disabled = s.estado === 'inhabilitado';
              return (
                <option key={s.id} value={s.id} disabled={disabled}>
                  {s.nombre} (Aforo: {s.capacidad} pers.) {disabled ? '⛔ [INHABILITADO POR INCIDENTE]' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Asistentes con Validación Reactiva */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-campus-cyan" />
              Número de Asistentes *
            </label>
            {selectedSpace && (
              <span className={`text-[11px] font-mono ${isOverCapacity ? 'text-campus-danger font-bold' : 'text-slate-400'}`}>
                Aforo oficial: {selectedSpace.capacidad} pers.
              </span>
            )}
          </div>
          <input
            type="number"
            min={1}
            value={attendees}
            onChange={(e) => setAttendees(Number(e.target.value))}
            className={`w-full bg-[#0c1830] border rounded-xl p-2.5 text-xs text-white focus:outline-none transition ${
              isOverCapacity 
                ? 'border-campus-danger text-campus-danger focus:ring-1 focus:ring-campus-danger' 
                : 'border-white/20 focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30'
            }`}
            required
          />
          {isOverCapacity && selectedSpace && (
            <p className="text-[11px] text-campus-danger mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Supera el aforo máximo de {selectedSpace.nombre} ({selectedSpace.capacidad}). Por favor reduce asistentes o elige otra sala.</span>
            </p>
          )}
        </div>

        {/* Recurso Tecnológico (Opcional) */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-campus-blue" />
            Recurso Tecnológico Adicional (Opcional)
          </label>
          <select
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30 cursor-pointer"
          >
            <option value="">-- Sin equipo tecnológico adicional --</option>
            {resources.map(r => (
              <option key={r.id} value={r.id} disabled={r.estado !== 'disponible'}>
                {r.nombre} ({r.categoria}) - {r.estado}
              </option>
            ))}
          </select>
        </div>

        {/* Solicitante */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1.5">
            Nombre del Solicitante / Responsable *
          </label>
          <input
            type="text"
            value={applicant}
            onChange={(e) => setApplicant(e.target.value)}
            placeholder="Ej. Camper / Trainer"
            className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30"
            required
          />
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-xs font-medium text-slate-200 mb-1.5">
            Motivo o Actividad *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. Taller intensivo de Inteligencia Artificial / Hackatón"
            className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30"
            required
          />
        </div>

        {/* Rango de Horario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">
              Fecha y Hora de Inicio *
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30 cursor-pointer"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">
              Fecha y Hora de Fin *
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30 cursor-pointer"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isOverCapacity}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-teal to-campus-blue hover:opacity-95 text-white shadow-lg shadow-campus-teal/20 transition flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isLoading ? 'Verificando Reglas de Negocio...' : 'Confirmar Reserva en Campus'}</span>
        </button>
      </form>
    </div>
  );
};
