import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Laptop, 
  Calendar, 
  CloudSun, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw, 
  PlusCircle, 
  ShieldAlert, 
  ArrowRight 
} from 'lucide-react';
import { Espacio, Recurso, Incidencia, Reserva, ClimaAlerta } from './types';
import { 
  getSpaces, 
  getResources, 
  getIncidents, 
  getReservations, 
  reportIncident, 
  createReservation, 
  resolveIncident, 
  getWeather 
} from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState<'spaces' | 'resources' | 'incidents' | 'reservations'>('spaces');
  
  const [spaces, setSpaces] = useState<Espacio[]>([]);
  const [resources, setResources] = useState<Recurso[]>([]);
  const [incidents, setIncidents] = useState<Incidencia[]>([]);
  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [weather, setWeather] = useState<ClimaAlerta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [incidentText, setIncidentText] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [applicant, setApplicant] = useState('');
  const [reason, setReason] = useState('');
  const [attendees, setAttendees] = useState<number>(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [spData, resData, incData, revData, wData] = await Promise.allSettled([
        getSpaces(),
        getResources(),
        getIncidents(),
        getReservations(),
        getWeather()
      ]);

      if (spData.status === 'fulfilled') setSpaces(spData.value);
      if (resData.status === 'fulfilled') setResources(resData.value);
      if (incData.status === 'fulfilled') setIncidents(incData.value);
      if (revData.status === 'fulfilled') setReservations(revData.value);
      if (wData.status === 'fulfilled') setWeather(wData.value);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim()) return;
    try {
      setActionLoading(true);
      setFeedback(null);
      const newInc = await reportIncident(incidentText);
      setFeedback({
        type: 'success',
        message: 'Incidencia procesada con IA: [' + newInc.severidad + '] ' + (newInc.accion_sugerida || 'Registrada')
      });
      setIncidentText('');
      await loadAllData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Error al procesar la incidencia con IA.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpaceId || !applicant || !startDate || !endDate) {
      setFeedback({ type: 'error', message: 'Por favor complete todos los campos requeridos.' });
      return;
    }
    try {
      setActionLoading(true);
      setFeedback(null);
      await createReservation({
        espacio_id: selectedSpaceId,
        recurso_id: selectedResourceId || undefined,
        solicitante: applicant,
        motivo: reason || 'Actividad academica',
        asistentes: Number(attendees),
        fecha_inicio: new Date(startDate).toISOString(),
        fecha_fin: new Date(endDate).toISOString()
      });
      setFeedback({ type: 'success', message: 'Reserva aprobada y registrada exitosamente!' });
      setApplicant('');
      setReason('');
      await loadAllData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Conflicto al crear la reserva.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveIncident = async (id: number) => {
    try {
      setActionLoading(true);
      await resolveIncident(id);
      setFeedback({ type: 'success', message: 'Incidencia resuelta. Espacio rehabilitado si procedia.' });
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'No se pudo resolver la incidencia.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Campuslands OpsCenter
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                v1.0 MVP
              </span>
            </h1>
            <p className="text-xs text-slate-400">Sistema Central de Operaciones & Triaje IA</p>
          </div>
        </div>

        {weather && (
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 text-xs">
            <CloudSun className="w-5 h-5 text-amber-400" />
            <div>
              <div className="font-semibold text-slate-200">
                {weather.ubicacion}: {weather.temperatura_c}°C
              </div>
              <div className="text-slate-400">{weather.mensaje}</div>
            </div>
            {weather.nivel_alerta !== 'NORMAL' && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                {weather.nivel_alerta}
              </span>
            )}
          </div>
        )}

        <button 
          onClick={loadAllData} 
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-medium transition"
        >
          <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
          Sincronizar
        </button>
      </header>

      {feedback && (
        <div className={'mx-6 mt-4 p-4 rounded-xl border flex items-center justify-between gap-3 text-sm ' + (
          feedback.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
        )}>
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline">Cerrar</button>
        </div>
      )}

      <div className="px-6 pt-4 border-b border-slate-800 flex gap-2">
        <button
          onClick={() => setActiveTab('spaces')}
          className={'flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all ' + (
            activeTab === 'spaces'
              ? 'bg-slate-900 border-t-2 border-blue-500 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          )}
        >
          <Building2 className="w-4 h-4" />
          Espacios & Aforos ({spaces.length})
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={'flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all ' + (
            activeTab === 'reservations'
              ? 'bg-slate-900 border-t-2 border-blue-500 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          )}
        >
          <Calendar className="w-4 h-4" />
          Nueva Reserva & Agenda
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={'flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all ' + (
            activeTab === 'incidents'
              ? 'bg-slate-900 border-t-2 border-blue-500 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          )}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          Triaje IA & Incidentes ({incidents.filter(i => i.estado === 'ABIERTA').length})
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={'flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all ' + (
            activeTab === 'resources'
              ? 'bg-slate-900 border-t-2 border-blue-500 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          )}
        >
          <Laptop className="w-4 h-4" />
          Recursos Tecnologicos ({resources.length})
        </button>
      </div>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'spaces' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Capacidad Instalada y Estado de Salas</h2>
              <p className="text-xs text-slate-400">Datos oficiales de Campuslands con control de aforo y estado en tiempo real.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {spaces.map((sp) => {
                const isInhabilitado = sp.estado === 'inhabilitado';
                return (
                  <div 
                    key={sp.id}
                    className={'rounded-xl border p-4 transition-all duration-200 ' + (
                      isInhabilitado 
                        ? 'bg-rose-950/20 border-rose-500/40' 
                        : sp.estado === 'ocupado'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white text-base">{sp.nombre}</h3>
                      <span className={'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ' + (
                        isInhabilitado
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : sp.estado === 'ocupado'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      )}>
                        {sp.estado}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-3">{sp.ubicacion}</p>

                    <div className="flex items-center justify-between text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                      <span className="text-slate-400">Aforo Instalado:</span>
                      <span className="font-mono font-bold text-blue-400 text-sm">{sp.capacidad} pers.</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSpaceId(sp.id);
                        setActiveTab('reservations');
                      }}
                      disabled={isInhabilitado}
                      className={'w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ' + (
                        isInhabilitado 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                      )}
                    >
                      {isInhabilitado ? 'Bloqueado por Incidencia' : 'Reservar Espacio'}
                      {!isInhabilitado && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <PlusCircle className="w-5 h-5 text-blue-500" />
                Registrar Reserva
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Aplica automaticamente validacion de aforo, no-solapamiento e integridad operativa.
              </p>

              <form onSubmit={handleCreateReservation} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Espacio a Reservar *</label>
                  <select 
                    value={selectedSpaceId} 
                    onChange={(e) => setSelectedSpaceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- Seleccionar Sala / Cubiculo --</option>
                    {spaces.map(s => (
                      <option key={s.id} value={s.id} disabled={s.estado === 'inhabilitado'}>
                        {s.nombre} (Capacidad: {s.capacidad}) {s.estado === 'inhabilitado' ? '[INHABILITADO]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Numero de Asistentes *</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={attendees} 
                    onChange={(e) => setAttendees(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    (Regla 1: Rechaza si supera el aforo oficial de la sala seleccionada)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Recurso Tecnologico (Opcional)</label>
                  <select 
                    value={selectedResourceId} 
                    onChange={(e) => setSelectedResourceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Ninguno --</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.id} disabled={r.estado !== 'disponible'}>
                        {r.nombre} ({r.categoria}) - {r.estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Solicitante *</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Trainer Juan / Equipo Frontend" 
                    value={applicant} 
                    onChange={(e) => setApplicant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Fecha/Hora Inicio *</label>
                    <input 
                      type="datetime-local" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Fecha/Hora Fin *</label>
                    <input 
                      type="datetime-local" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-lg shadow-blue-500/20"
                >
                  {actionLoading ? 'Validando Reglas de Negocio...' : 'Confirmar Reserva'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-bold text-white">Historial de Reservas Activas</h2>
              {reservations.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No hay reservas activas registradas aun.
                </div>
              ) : (
                <div className="space-y-2">
                  {reservations.map(res => {
                    const sp = spaces.find(s => s.id === res.espacio_id);
                    return (
                      <div key={res.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            {sp?.nombre || res.espacio_id}
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
                              {res.asistentes} personas
                            </span>
                          </div>
                          <div className="text-slate-400 mt-1">
                            Solicitante: <span className="text-slate-200 font-medium">{res.solicitante}</span>
                          </div>
                          <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                            {new Date(res.fecha_inicio).toLocaleString()} a {new Date(res.fecha_fin).toLocaleString()}
                          </div>
                        </div>

                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded font-semibold text-[11px]">
                          {res.estado}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30 rounded-xl p-5 shadow-xl shadow-purple-950/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Triaje Asistido por IA</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Describe el problema con tus propias palabras. La IA de Google Gemini clasificara la severidad, detectara el aula y aplicara el bloqueo preventivo automatico.
              </p>

              <form onSubmit={handleReportIncident} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Descripcion del Incidente *</label>
                  <textarea
                    rows={4}
                    value={incidentText}
                    onChange={(e) => setIncidentText(e.target.value)}
                    placeholder="Ejemplo: Se escucho un corto circuito en el aula Apolo, el proyector echo humo y la sala quedo sin luz."
                    className="w-full bg-slate-950 border border-purple-500/40 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div className="bg-purple-950/30 border border-purple-500/20 rounded-lg p-3 text-[11px] text-purple-200">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                    Regla de Dominio Automatizada:
                  </div>
                  Si el incidente es clasificado como <span className="font-bold text-rose-400">CRITICO</span> o <span className="font-bold text-amber-400">ALTO</span>, el espacio involucrado se bloqueara de inmediato en todo el sistema.
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !incidentText.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                >
                  <Sparkles className="w-4 h-4" />
                  {actionLoading ? 'Analizando con Gemini...' : 'Procesar con IA'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-bold text-white">Feed de Incidencias en Vivo</h2>
              {incidents.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No hay incidentes reportados en este momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((inc) => {
                    const sp = spaces.find(s => s.id === inc.espacio_id);
                    const isCritica = inc.severidad === 'CRITICA';
                    const isAlta = inc.severidad === 'ALTA';
                    return (
                      <div 
                        key={inc.id}
                        className={'rounded-xl border p-4 text-xs transition ' + (
                          inc.estado === 'RESUELTA'
                            ? 'bg-slate-900/40 border-slate-800 opacity-60'
                            : isCritica
                            ? 'bg-rose-950/30 border-rose-500/40'
                            : isAlta
                            ? 'bg-amber-950/30 border-amber-500/40'
                            : 'bg-slate-900 border-slate-800'
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={'px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ' + (
                              isCritica
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : isAlta
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            )}>
                              {inc.severidad}
                            </span>
                            <span className="font-semibold text-slate-300">{inc.categoria}</span>
                            {sp && (
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                                Espacio: {sp.nombre}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={'text-[10px] font-semibold px-2 py-0.5 rounded ' + (
                              inc.estado === 'RESUELTA' ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-300'
                            )}>
                              {inc.estado}
                            </span>
                            {inc.estado !== 'RESUELTA' && (
                              <button
                                onClick={() => handleResolveIncident(inc.id)}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-medium transition"
                              >
                                Resolver y Rehabilitar
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-200 mb-2 italic">"{inc.descripcion}"</p>

                        {inc.accion_sugerida && (
                          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg text-slate-300 text-[11px]">
                            <strong className="text-purple-400">Recomendacion IA:</strong> {inc.accion_sugerida}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Inventario y Prestamo de Recursos Tecnologicos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((rec) => (
                <div key={rec.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-sm">{rec.nombre}</h3>
                    <span className={'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ' + (
                      rec.estado === 'disponible' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-amber-500/20 text-amber-300'
                    )}>
                      {rec.estado}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 mb-3">
                    <div>Categoria: <span className="text-slate-300">{rec.categoria}</span></div>
                    <div>Serial: <span className="font-mono text-slate-300">{rec.serial}</span></div>
                    <div>Ubicacion: <span className="text-slate-300">{rec.ubicacion_actual}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 px-6 py-3 text-center text-xs text-slate-500">
        Campuslands Hackaton 2026 - Desarrollado por Cristian (Frontend) y Samuel (Backend)
      </footer>
    </div>
  );
}
