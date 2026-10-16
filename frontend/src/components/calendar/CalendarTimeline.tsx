import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ExternalLink,
  Download,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CalendarDays,
  CheckCircle2,
  Layers,
  Sparkles,
  Building2
} from 'lucide-react';
import { Reserva, Espacio } from '../../types';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../utils/googleCalendar';

export interface CalendarTimelineProps {
  reservas: Reserva[];
  espacios: Espacio[];
  className?: string;
}

export const CalendarTimeline: React.FC<CalendarTimelineProps> = ({
  reservas = [],
  espacios = [],
  className = ''
}) => {
  // Helper para obtener fecha local en formato YYYY-MM-DD
  const getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [filterSpaceId, setFilterSpaceId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllDates, setShowAllDates] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'agenda' | 'timeline'>('agenda');
  const [onlyOccupiedInTimeline, setOnlyOccupiedInTimeline] = useState<boolean>(false);

  // Mapeo rápido de ID de espacio a Objeto Espacio
  const spacesMap = useMemo(() => {
    const map = new Map<string, Espacio>();
    espacios.forEach(e => map.set(e.id, e));
    return map;
  }, [espacios]);

  // Extraer fecha 'YYYY-MM-DD' de una reserva
  const getReservaDate = (reserva: Reserva): string => {
    const d = new Date(reserva.fecha_inicio);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Formatear rango horario y calcular duración
  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { timeText: 'Horario a confirmar', duration: '' };
    }
    const formatH = (d: Date) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    const durationText = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

    return {
      timeText: `${formatH(start)} - ${formatH(end)}`,
      duration: durationText
    };
  };

  // Formato amigable de fecha en español
  const formatDateSpanish = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return dateStr;
    const formatted = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Navegación de días
  const handleNavigateDay = (delta: number) => {
    setShowAllDates(false);
    const parts = selectedDate.split('-');
    const [y, m, d] = parts.map(Number);
    const currentDate = new Date(y, m - 1, d);
    currentDate.setDate(currentDate.getDate() + delta);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleGoToToday = () => {
    setShowAllDates(false);
    setSelectedDate(getTodayString());
  };

  // Etiqueta dinámica para el botón del navegador (< [Hoy / Mañana / Ayer / 17 oct] >)
  const getNavDayLabel = () => {
    if (showAllDates) return 'Todas';
    const today = getTodayString();
    if (selectedDate === today) return 'Hoy';

    const [todayY, todayM, todayD] = today.split('-').map(Number);
    const [selY, selM, selD] = selectedDate.split('-').map(Number);
    const todayDate = new Date(todayY, todayM - 1, todayD);
    const selDate = new Date(selY, selM - 1, selD);

    const diffDays = Math.round((selDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';

    const diaNum = selDate.getDate();
    const mes = selDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    return `${diaNum} ${mes}`;
  };

  // Obtener fechas únicas con reservas para navegación rápida
  const datesWithReservations = useMemo(() => {
    const datesCount = new Map<string, number>();
    reservas.forEach(r => {
      const d = getReservaDate(r);
      if (d) {
        datesCount.set(d, (datesCount.get(d) || 0) + 1);
      }
    });
    return Array.from(datesCount.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 7); // Mostrar hasta 7 días destacados
  }, [reservas]);

  // Filtrado de reservas
  const filteredReservas = useMemo(() => {
    return reservas
      .filter(r => {
        // Filtro por fecha (a menos que se active ver todas)
        if (!showAllDates) {
          const rDate = getReservaDate(r);
          if (rDate !== selectedDate) return false;
        }

        // Filtro por espacio
        if (filterSpaceId !== 'all' && r.espacio_id !== filterSpaceId) {
          return false;
        }

        // Filtro por búsqueda de texto
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const espacio = spacesMap.get(r.espacio_id);
          const espacioNombre = (espacio?.nombre || '').toLowerCase();
          const solicitante = (r.solicitante || '').toLowerCase();
          const motivo = (r.motivo || '').toLowerCase();
          const estado = (r.estado || '').toLowerCase();
          if (
            !espacioNombre.includes(query) &&
            !solicitante.includes(query) &&
            !motivo.includes(query) &&
            !estado.includes(query)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_fin).getTime());
  }, [reservas, selectedDate, showAllDates, filterSpaceId, searchQuery, spacesMap]);

  // Estadísticas del día / selección actual
  const stats = useMemo(() => {
    const totalReservas = filteredReservas.length;
    const totalAsistentes = filteredReservas.reduce((acc, curr) => acc + (curr.asistentes || 0), 0);
    const uniqueSpaces = new Set(filteredReservas.map(r => r.espacio_id)).size;
    return { totalReservas, totalAsistentes, uniqueSpaces };
  }, [filteredReservas]);

  // Rango de horas para vista Timeline (07:00 a 21:00)
  const TIMELINE_START = 7;
  const TIMELINE_END = 21;
  const TIMELINE_HOURS_COUNT = TIMELINE_END - TIMELINE_START;
  const timelineHours = useMemo(() => {
    return Array.from({ length: TIMELINE_HOURS_COUNT }, (_, i) => TIMELINE_START + i);
  }, [TIMELINE_HOURS_COUNT]);

  const handleSyncGoogleCalendar = (reserva: Reserva) => {
    const espacio = spacesMap.get(reserva.espacio_id);
    const espacioNombre = espacio?.nombre || reserva.espacio_id;
    const url = generateGoogleCalendarUrl(reserva, espacioNombre);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = (reserva: Reserva) => {
    const espacio = spacesMap.get(reserva.espacio_id);
    const espacioNombre = espacio?.nombre || reserva.espacio_id;
    downloadIcsFile(reserva, espacioNombre);
  };

  // Cálculo de posicionamiento en el timeline
  const calculateTimelinePosition = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { left: '0%', width: '100%', isVisible: true };
    }
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    if (endHour <= TIMELINE_START || startHour >= TIMELINE_END) {
      return { left: '0%', width: '0%', isVisible: false };
    }

    const clampedStart = Math.max(TIMELINE_START, Math.min(TIMELINE_END, startHour));
    const clampedEnd = Math.max(TIMELINE_START, Math.min(TIMELINE_END, endHour));

    const leftPercent = ((clampedStart - TIMELINE_START) / TIMELINE_HOURS_COUNT) * 100;
    const widthPercent = Math.max(4, ((clampedEnd - clampedStart) / TIMELINE_HOURS_COUNT) * 100);

    return {
      left: `${leftPercent.toFixed(2)}%`,
      width: `${widthPercent.toFixed(2)}%`,
      isVisible: true
    };
  };

  // Espacios a mostrar en el timeline (Swimlanes por sala)
  const timelineSpaces = useMemo(() => {
    if (filterSpaceId !== 'all') {
      return espacios.filter(e => e.id === filterSpaceId);
    }
    if (onlyOccupiedInTimeline) {
      const occupiedIds = new Set(filteredReservas.map(r => r.espacio_id));
      const occupied = espacios.filter(e => occupiedIds.has(e.id));
      return occupied.length > 0 ? occupied : espacios;
    }
    return espacios;
  }, [espacios, filterSpaceId, onlyOccupiedInTimeline, filteredReservas]);

  // Marcador de hora actual en vivo si la fecha seleccionada es hoy
  const isSelectedToday = selectedDate === getTodayString() && !showAllDates;
  const now = new Date();
  const currentHourFloat = now.getHours() + now.getMinutes() / 60;
  const currentHourPercent = ((currentHourFloat - TIMELINE_START) / TIMELINE_HOURS_COUNT) * 100;

  // Badge de Estado con estilo cósmico
  const renderEstadoBadge = (estado: string) => {
    const est = (estado || '').toLowerCase();
    if (est.includes('aprob') || est.includes('confirm') || est.includes('activ') || est.includes('dispon')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {estado}
        </span>
      );
    }
    if (est.includes('pend')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {estado}
        </span>
      );
    }
    if (est.includes('cancel') || est.includes('rechaz') || est.includes('inhab')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          {estado}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-campus-cyan/15 text-campus-cyan border border-campus-cyan/30">
        {estado}
      </span>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Principal de Agenda & Métricas del Día */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-campus-teal/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-campus-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-campus-teal/20 via-campus-blue/20 to-campus-purple/20 border border-campus-teal/30 flex items-center justify-center shadow-lg shadow-campus-teal/10">
              <Calendar className="w-6 h-6 text-campus-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                  Agenda Operativa & Timeline
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-campus-teal/10 text-campus-teal border border-campus-teal/25 font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> Google Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Sincronización en tiempo real con Google Calendar, iCalendar (.ICS) y cronograma de salas
              </p>
            </div>
          </div>

          {/* Métricas Rápidas */}
          <div className="flex items-center gap-3">
            <div className="glass-panel px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Reservas</div>
                <div className="text-base font-bold font-mono text-campus-teal">{stats.totalReservas}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Asistentes</div>
                <div className="text-base font-bold font-mono text-campus-cyan">{stats.totalAsistentes}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Espacios</div>
                <div className="text-base font-bold font-mono text-campus-purple">{stats.uniqueSpaces}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Control de Fecha & Filtros */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          {/* Navegador de Fecha */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-[#030712] backdrop-blur-md rounded-xl border border-white/20 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => handleNavigateDay(-1)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-campus-teal transition active:scale-95"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToToday}
                title={selectedDate !== getTodayString() ? 'Clic para volver a Hoy' : 'Fecha actual'}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all min-w-[65px] text-center capitalize ${
                  selectedDate === getTodayString() && !showAllDates
                    ? 'bg-gradient-to-r from-campus-teal to-campus-blue text-white shadow-md shadow-campus-teal/20 font-bold'
                    : 'bg-white/10 text-campus-teal hover:bg-campus-teal/20 hover:text-white border border-campus-teal/30 font-bold'
                }`}
              >
                {getNavDayLabel()}
              </button>

              <button
                type="button"
                onClick={() => handleNavigateDay(1)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-campus-teal transition active:scale-95"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Acceso directo para volver a Hoy */}
            {selectedDate !== getTodayString() && !showAllDates && (
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono text-campus-teal bg-campus-teal/10 hover:bg-campus-teal/20 border border-campus-teal/30 transition flex items-center gap-1 shadow-sm font-semibold active:scale-95"
                title="Volver a la fecha de hoy"
              >
                ← Ir a Hoy
              </button>
            )}

            {/* Input Date Picker nativo con diseño oscuro */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setShowAllDates(false);
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-[#0c1830] border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30 transition shadow-inner cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAllDates(!showAllDates)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                showAllDates
                  ? 'bg-campus-purple/20 border-campus-purple text-purple-200 font-semibold'
                  : 'bg-[#081226]/90 border-white/20 text-white hover:text-campus-teal hover:bg-white/10'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 inline mr-1.5 text-campus-purple" />
              {showAllDates ? 'Mostrando Todas las Fechas' : 'Ver Todo'}
            </button>

            {/* Label de fecha en español */}
            {!showAllDates && (
              <span className="text-xs font-medium text-slate-300 ml-1 hidden md:inline">
                {formatDateSpanish(selectedDate)}
              </span>
            )}
          </div>

          {/* Switcher de Vista: Agenda vs Timeline */}
          <div className="flex items-center gap-2">
            <div className="bg-campus-deep/90 border border-white/10 p-1 rounded-xl flex items-center gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                  viewMode === 'agenda'
                    ? 'bg-gradient-to-r from-campus-teal to-campus-blue text-white shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Vista Agenda</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                  viewMode === 'timeline'
                    ? 'bg-gradient-to-r from-campus-purple to-pink-600 text-white shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline Diario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Acceso Rápido a Fechas con Reservas Registradas */}
        {datesWithReservations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 whitespace-nowrap flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-campus-teal" /> Fechas activas:
            </span>
            <div className="flex items-center gap-1.5">
              {datesWithReservations.map(([d, count]) => {
                const isSelected = selectedDate === d && !showAllDates;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d);
                      setShowAllDates(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition flex items-center gap-1.5 whitespace-nowrap border ${
                      isSelected
                        ? 'bg-campus-teal/20 border-campus-teal text-campus-teal font-bold'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span>{d}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Barra de Búsqueda y Filtro de Espacios */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por solicitante, motivo o sala..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30 transition shadow-inner font-sans"
            />
          </div>

          {/* Filtro de Espacio */}
          <div className="relative min-w-[190px]">
            <Filter className="w-3.5 h-3.5 text-campus-teal absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterSpaceId}
              onChange={e => setFilterSpaceId(e.target.value)}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl pl-9 pr-7 py-2 text-xs text-white focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/30 transition shadow-inner appearance-none cursor-pointer font-sans"
            >
              <option value="all">Todos los Espacios ({espacios.length})</option>
              {espacios.map(esp => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre} ({esp.capacidad}p)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Indicador de Resultados */}
        <div className="text-xs text-slate-400 font-mono">
          Mostrando <span className="text-campus-teal font-bold">{filteredReservas.length}</span> evento(s)
        </div>
      </div>

      {/* VISTA 1: TIMELINE DIARIO HORARIO (Grilla Horaria 07:00 a 21:00) */}
      {viewMode === 'timeline' && (
        <div className="glass-morphism-card p-6 border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Header del Timeline */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-campus-purple/20 border border-campus-purple/40 flex items-center justify-center text-purple-300 shadow-md">
                <Clock className="w-5 h-5 text-campus-purple" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  Línea de Tiempo Horaria
                  <span className="text-[10px] font-mono normal-case px-2.5 py-0.5 rounded-full bg-campus-teal/15 text-campus-teal border border-campus-teal/30 font-semibold">
                    07:00 — 21:00
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Cronograma horizontal de disponibilidad y aforos por sala en Zenith Tower (Piso 6)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro rápido: Todas vs Solo Ocupadas */}
              <button
                type="button"
                onClick={() => setOnlyOccupiedInTimeline(!onlyOccupiedInTimeline)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition ${
                  onlyOccupiedInTimeline
                    ? 'bg-campus-cyan/20 border-campus-cyan text-campus-cyan font-semibold'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {onlyOccupiedInTimeline ? 'Mostrando sólo ocupadas' : `Ver todas las salas (${espacios.length})`}
              </button>

              <span className="text-xs font-mono text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 font-semibold">
                📅 {showAllDates ? 'Todas las reservas' : formatDateSpanish(selectedDate)}
              </span>
            </div>
          </div>

          {/* Tablero Horario con Rieles Horizontales */}
          <div className="relative bg-[#02050e]/95 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                {/* Cabecera de Horas (07:00 a 21:00) */}
                <div
                  className="grid border-b border-white/15 bg-[#060c1a]"
                  style={{ gridTemplateColumns: '190px repeat(14, minmax(0, 1fr))' }}
                >
                  {/* Columna Izquierda: Sala */}
                  <div className="p-3 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 border-r border-white/10 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-campus-teal" />
                    <span>Sala / Espacio</span>
                  </div>

                  {/* 14 Columnas Horarias */}
                  {timelineHours.map(hour => {
                    return (
                      <div
                        key={hour}
                        className="py-2.5 px-1 text-center border-l border-white/10 first:border-l-0 text-[10.5px] font-mono text-slate-300 font-semibold bg-white/[0.01]"
                      >
                        {String(hour).padStart(2, '0')}:00
                      </div>
                    );
                  })}
                </div>

                {/* Filas por Sala (Swimlanes) */}
                <div className="divide-y divide-white/5">
                  {timelineSpaces.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-sans">
                      No hay espacios disponibles para mostrar con los filtros activos.
                    </div>
                  ) : (
                    timelineSpaces.map(space => {
                      const spaceReservas = filteredReservas.filter(r => r.espacio_id === space.id);
                      const isFree = spaceReservas.length === 0;

                      return (
                        <div
                          key={space.id}
                          className="grid hover:bg-white/[0.02] transition-colors group"
                          style={{ gridTemplateColumns: '190px repeat(14, minmax(0, 1fr))' }}
                        >
                          {/* Columna Izquierda: Información de la Sala */}
                          <div className="p-3 border-r border-white/10 flex flex-col justify-center bg-[#060c1a]/60 group-hover:bg-[#060c1a]/90 transition">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-bold text-xs text-white truncate group-hover:text-campus-teal transition-colors" title={space.nombre}>
                                {space.nombre}
                              </span>
                              <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-bold shrink-0">
                                {space.capacidad}p
                              </span>
                            </div>
                            <span className="text-[9.5px] font-mono text-slate-400 capitalize truncate mt-0.5">
                              {space.tipo.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Track Horario con Rejilla de Fondo */}
                          <div
                            className="relative h-14 w-full"
                            style={{ gridColumn: '2 / span 14' }}
                          >
                            {/* Rejilla de fondo de 14 horas */}
                            <div
                              className="absolute inset-0 grid pointer-events-none"
                              style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
                            >
                              {Array.from({ length: 14 }).map((_, i) => (
                                <div key={i} className="border-l border-white/5 first:border-l-0 h-full relative">
                                  <div className="absolute left-1/2 top-0 bottom-0 border-l border-white/[0.02]" />
                                </div>
                              ))}
                            </div>

                            {/* Marcador Láser de Hora Actual si es Hoy */}
                            {isSelectedToday && currentHourPercent >= 0 && currentHourPercent <= 100 && (
                              <div
                                style={{ left: `${currentHourPercent}%` }}
                                className="absolute top-0 bottom-0 w-0.5 bg-campus-teal shadow-[0_0_8px_rgba(84,198,170,0.9)] z-20 pointer-events-none"
                              >
                                <span className="absolute -top-1 -translate-x-1/2 bg-campus-teal text-black text-[8px] font-mono px-1 rounded font-extrabold shadow">
                                  AHORA
                                </span>
                              </div>
                            )}

                            {/* Bloques de Reserva */}
                            {spaceReservas.map(reserva => {
                              const pos = calculateTimelinePosition(reserva.fecha_inicio, reserva.fecha_fin);
                              const timeInfo = formatTimeRange(reserva.fecha_inicio, reserva.fecha_fin);
                              if (!pos.isVisible) return null;

                              return (
                                <div
                                  key={reserva.id}
                                  style={{ left: pos.left, width: pos.width }}
                                  className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-campus-teal/30 via-campus-blue/25 to-campus-purple/30 border border-campus-teal/70 hover:border-campus-teal shadow-lg shadow-black/40 hover:shadow-campus-teal/30 px-2.5 py-1 flex items-center justify-between gap-2 overflow-hidden z-10 transition-all group/block backdrop-blur-md cursor-pointer"
                                  title={`${reserva.motivo} (${timeInfo.timeText}) - Solicitado por ${reserva.solicitante}`}
                                >
                                  <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-campus-teal shadow-[0_0_6px_rgba(84,198,170,0.9)] shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-bold text-white truncate leading-tight">
                                        {reserva.motivo || 'Reserva Activa'}
                                      </p>
                                      <p className="text-[9.5px] font-mono text-campus-cyan truncate leading-tight">
                                        {timeInfo.timeText} • {reserva.solicitante}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Botones de Acción en el Bloque */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity shrink-0 bg-black/70 p-0.5 rounded-lg border border-white/10">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSyncGoogleCalendar(reserva);
                                      }}
                                      className="p-1 rounded hover:bg-campus-teal hover:text-black text-slate-200 transition"
                                      title="Sincronizar en Google Calendar"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadIcs(reserva);
                                      }}
                                      className="p-1 rounded hover:bg-campus-cyan hover:text-black text-slate-200 transition"
                                      title="Descargar archivo .ICS"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Placeholder si la sala está libre */}
                            {isFree && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  ✓ Disponible 07:00 — 21:00
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: LISTA DE TARJETAS DE AGENDA CON ACCIONES COMPLETAS */}
      <div className="space-y-4">
        {filteredReservas.length === 0 ? (
          /* Estado Vacío Elegante */
          <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No hay reservas programadas
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
              {showAllDates
                ? 'No se encontraron reservas con los filtros aplicados.'
                : `No existen eventos agendados para el ${formatDateSpanish(selectedDate)}.`}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-campus-teal text-slate-950 hover:bg-campus-teal/90 transition shadow-lg shadow-campus-teal/20"
              >
                Ir a Fecha de Hoy
              </button>
              <button
                type="button"
                onClick={() => setShowAllDates(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/15 transition border border-white/10"
              >
                Ver Todas las Fechas
              </button>
            </div>
          </div>
        ) : (
          /* Cuadrícula / Lista de Tarjetas de Reserva */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReservas.map(reserva => {
              const espacio = spacesMap.get(reserva.espacio_id);
              const espacioNombre = espacio?.nombre || reserva.espacio_id;
              const timeInfo = formatTimeRange(reserva.fecha_inicio, reserva.fecha_fin);
              const googleCalUrl = generateGoogleCalendarUrl(reserva, espacioNombre);

              return (
                <div
                  key={reserva.id}
                  className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 flex flex-col justify-between gap-4 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decoración sutil de fondo */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-campus-cyan/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Cabecera de la Tarjeta: Espacio + Estado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-campus-surface border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-campus-teal" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white font-sans tracking-tight">
                            {espacioNombre}
                          </h4>
                          {espacio?.tipo && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                              {espacio.tipo}
                            </span>
                          )}
                        </div>
                        {espacio?.ubicacion && (
                          <p className="text-[11px] text-slate-400 font-light">
                            {espacio.ubicacion}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>{renderEstadoBadge(reserva.estado)}</div>
                  </div>

                  {/* Cuerpo: Motivo del Evento */}
                  <div className="bg-campus-deep/60 rounded-xl p-3 border border-white/5 space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-campus-teal" /> Motivo de la Actividad:
                    </div>
                    <p className="text-xs font-semibold text-slate-100 font-sans leading-relaxed">
                      {reserva.motivo || 'Actividad general programada'}
                    </p>
                  </div>

                  {/* Metadatos: Horario, Solicitante, Asistentes y Recursos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Horario */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
                      <Clock className="w-3.5 h-3.5 text-campus-cyan shrink-0" />
                      <div className="truncate">
                        <div className="font-mono text-campus-cyan font-medium text-[11px]">
                          {timeInfo.timeText}
                        </div>
                        {timeInfo.duration && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Duración: {timeInfo.duration}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Asistentes & Capacidad */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
                      <Users className="w-3.5 h-3.5 text-campus-purple shrink-0" />
                      <div className="truncate">
                        <div className="font-mono text-white text-[11px]">
                          {reserva.asistentes} Asistentes
                        </div>
                        {espacio && (
                          <div className="text-[10px] text-slate-400">
                            Capacidad: {espacio.capacidad} max
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Solicitante */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 sm:col-span-2">
                      <span className="text-[11px] text-slate-400 font-light">Solicitado por:</span>
                      <span className="text-[11px] font-semibold text-slate-200 truncate">
                        {reserva.solicitante}
                      </span>
                      {reserva.recurso_id && (
                        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-campus-purple/20 text-campus-purple border border-campus-purple/30">
                          <Layers className="w-2.5 h-2.5 inline mr-1" />
                          {reserva.recurso_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botones de Acción Elegantes: Sincronizar Google Calendar & Descargar .ICS */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                    {/* Botón Google Calendar */}
                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[170px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-teal/20 to-campus-blue/20 hover:from-campus-teal/30 hover:to-campus-blue/30 text-campus-teal hover:text-white border border-campus-teal/40 hover:border-campus-teal transition-all shadow-sm hover:shadow-campus-teal/20 group cursor-pointer"
                      title="Sincronizar directamente con Google Calendar Web Intent"
                    >
                      <Calendar className="w-3.5 h-3.5 text-campus-teal group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Sincronizar con Google Calendar</span>
                      <ExternalLink className="w-3 h-3 text-campus-teal/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    </a>

                    {/* Botón Descargar .ICS */}
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(reserva, espacioNombre)}
                      className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-campus-surface hover:bg-white/10 text-slate-200 hover:text-white border border-white/15 hover:border-campus-purple/50 transition-all shadow-sm hover:shadow-campus-purple/10 group cursor-pointer"
                      title="Descargar archivo estándar .ICS compatible con Google Calendar, Apple Calendar y Outlook"
                    >
                      <Download className="w-3.5 h-3.5 text-campus-purple group-hover:scale-110 transition-transform shrink-0" />
                      <span>Descargar .ICS</span>
                    </button>
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

export default CalendarTimeline;
