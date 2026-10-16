import React, { useState } from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, Clock, RefreshCw, Send, HelpCircle } from 'lucide-react';
import { Incidencia, Espacio } from '../../types';
import { UserRole } from '../layout/Navbar';

interface AITriageBoxProps {
  incidents: Incidencia[];
  spaces: Espacio[];
  role: UserRole;
  onReportIncident: (descripcion: string) => Promise<void>;
  onResolveIncident: (id: number) => Promise<void>;
  isLoading: boolean;
}

export const AITriageBox: React.FC<AITriageBoxProps> = ({
  incidents,
  spaces,
  role,
  onReportIncident,
  onResolveIncident,
  isLoading
}) => {
  const [description, setDescription] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isLoading) return;
    await onReportIncident(description);
    setDescription('');
  };

  const handleQuickPrompt = (text: string) => {
    setDescription(text);
  };

  const filteredIncidents = incidents.filter(inc => {
    if (activeFilter === 'open') return inc.estado !== 'RESUELTA';
    if (activeFilter === 'resolved') return inc.estado === 'RESUELTA';
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel Izquierdo: Formulario Copiloto IA */}
      <div className="lg:col-span-1 glass-panel rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-2xl">
        {/* Glow cósmico de fondo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-campus-purple/15 blur-3xl rounded-full pointer-events-none -mr-16 -mt-16"></div>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-campus-purple/20 text-campus-purple border border-campus-purple/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Triaje Asistido por IA</h2>
            <p className="text-[11px] font-mono text-campus-teal uppercase tracking-wider">Gemini 3.8 Flash Agent</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          {role === 'client' 
            ? 'Como Camper o Trainer, reporta cualquier falla técnica, daño en aula o pérdida de equipo. La IA analizará la severidad y protegerá la operación del campus.'
            : 'Panel de reporte directo de incidencias operativas con clasificación y enrutamiento automatizado.'}
        </p>

        {/* Plantillas Rápidas de Reporte */}
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-campus-cyan" />
            Reportes rápidos frecuentes:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '⚡ Corto en Apolo', text: 'Se escuchó un corto circuito en el aula Apolo, el proyector sacó chispas y hay humo en la sala.' },
              { label: '📦 Pérdida de Laptop', text: 'Se extravió la Laptop Dell XPS Dev Lab asignada al laboratorio Skilab, no aparece en el rack.' },
              { label: '❄️ Aire dañado Spooki', text: 'El aire acondicionado de Spooki no enciende y la sala tiene temperatura muy alta con 35 campers.' },
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(p.text)}
                className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Descripción del Evento / Incidente *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe en lenguaje natural. Ej: El proyector de Apolo huele a quemado y los cables están calientes..."
              className="w-full bg-campus-deep/90 border border-white/10 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-campus-purple/60 focus:ring-1 focus:ring-campus-purple/40"
              required
            />
          </div>

          {/* Banner explicativo de la Regla 3 */}
          <div className="bg-campus-deep/60 border border-campus-purple/30 rounded-xl p-3 text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-campus-purple flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Regla Central de Dominio (Automatizada):</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Si la IA determina severidad <span className="text-campus-danger font-bold">CRÍTICA</span> o <span className="text-campus-warning font-bold">ALTA</span>, inhabilitará automáticamente el espacio o equipo involucrado.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-purple to-indigo-600 hover:opacity-95 text-white flex items-center justify-center gap-2 shadow-lg shadow-campus-purple/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analizando con Gemini 3.8 Flash...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Analizar y Triar con IA</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Panel Derecho: Feed de Incidencias en Vivo */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Feed Operativo de Incidencias
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-mono text-slate-300">
                {incidents.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Historial y trazabilidad de eventos procesados por el Copiloto.</p>
          </div>

          {/* Filtros de Incidencias */}
          <div className="flex items-center gap-1 bg-campus-surface border border-white/10 p-1 rounded-xl">
            {(['all', 'open', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  activeFilter === f
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'open' ? 'Abiertas' : 'Resueltas'}
              </button>
            ))}
          </div>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-xs">
            No hay incidencias que coincidan con el filtro actual.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map((inc) => {
              const sp = spaces.find(s => s.id === inc.espacio_id);
              const isCritica = inc.severidad === 'CRITICA';
              const isAlta = inc.severidad === 'ALTA';
              const isResuelta = inc.estado === 'RESUELTA';

              return (
                <div
                  key={inc.id}
                  className={`glass-panel rounded-2xl p-4 text-xs transition-all ${
                    isResuelta
                      ? 'opacity-60 bg-campus-deep/40'
                      : isCritica
                      ? 'border-campus-danger/40 bg-campus-danger/5 shadow-md shadow-rose-950/20'
                      : isAlta
                      ? 'border-campus-warning/40 bg-campus-warning/5'
                      : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Severidad */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                        isCritica
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isAlta
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                        {inc.severidad}
                      </span>

                      {/* Categoría */}
                      <span className="font-semibold text-slate-200">{inc.categoria}</span>

                      {/* Espacio Afectado */}
                      {sp && (
                        <span className="text-[11px] bg-campus-surface border border-white/10 text-campus-cyan px-2 py-0.5 rounded-lg font-mono">
                          📍 {sp.nombre}
                        </span>
                      )}
                    </div>

                    {/* Estado y Acción de Resolver (Solo Administrador) */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        isResuelta 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {inc.estado}
                      </span>

                      {!isResuelta && (
                        role === 'admin' ? (
                          <button
                            onClick={() => onResolveIncident(inc.id)}
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-medium transition shadow-sm flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Resolver & Rehabilitar</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">En revisión operativa</span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Descripción del usuario */}
                  <p className="text-slate-200 mb-3 italic bg-campus-deep/50 p-2.5 rounded-xl border border-white/5">
                    "{inc.descripcion}"
                  </p>

                  {/* Recomendación y Triaje IA */}
                  {inc.accion_sugerida && (
                    <div className="bg-campus-purple/10 border border-campus-purple/20 p-3 rounded-xl text-slate-300 text-[11px] flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-campus-purple shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-campus-purple font-medium">Recomendación IA:</strong>{' '}
                        <span>{inc.accion_sugerida}</span>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center gap-1.5 justify-end">
                    <Clock className="w-3 h-3" />
                    <span>Reportado: {new Date(inc.creada_en).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
