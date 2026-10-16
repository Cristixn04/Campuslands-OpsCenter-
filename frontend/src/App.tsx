import { useState, useEffect } from 'react';
import { 
  Building2, 
  Laptop, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  ExternalLink
} from 'lucide-react';
import { Espacio, Recurso, Incidencia, Reserva } from './types';
import { 
  getSpaces, 
  getResources, 
  getIncidents, 
  getReservations, 
  reportIncident, 
  createReservation, 
  resolveIncident,
  updateSpaceStatus,
  createSpace,
  createResource
} from './api/client';
import { Navbar } from './components/layout/Navbar';
import { MetricsSummary } from './components/layout/MetricsSummary';
import { SpaceGrid } from './components/spaces/SpaceGrid';
import { CalendarTimeline } from './components/calendar/CalendarTimeline';
import { AITriageBox } from './components/incidents/AITriageBox';
import { ResourceList } from './components/resources/ResourceList';
import { ReservationForm } from './components/reservations/ReservationForm';
import { CosmicBackground } from './components/common/CosmicBackground';
import { CreateSpaceModal } from './components/admin/CreateSpaceModal';
import { CreateResourceModal } from './components/admin/CreateResourceModal';
import { authService, User, UserRole } from './services/authService';
import { AuthScreen } from './components/auth/AuthScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const user = authService.getCurrentUser();
    return user ? user.role : 'client';
  });
  const [activeTab, setActiveTab] = useState<'spaces' | 'agenda' | 'incidents' | 'resources'>('spaces');

  const [spaces, setSpaces] = useState<Espacio[]>([]);
  const [resources, setResources] = useState<Recurso[]>([]);
  const [incidents, setIncidents] = useState<Incidencia[]>([]);
  const [reservations, setReservations] = useState<Reserva[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; actionUrl?: string; actionLabel?: string } | null>(null);

  // Control de modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preselectedSpaceId, setPreselectedSpaceId] = useState<string>('');
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState<boolean>(false);
  const [isCreateResourceOpen, setIsCreateResourceOpen] = useState<boolean>(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [spData, resData, incData, revData] = await Promise.allSettled([
        getSpaces(),
        getResources(),
        getIncidents(),
        getReservations()
      ]);

      if (spData.status === 'fulfilled') setSpaces(spData.value);
      if (resData.status === 'fulfilled') setResources(resData.value);
      if (incData.status === 'fulfilled') setIncidents(incData.value);
      if (revData.status === 'fulfilled') setReservations(revData.value);
    } catch (err) {
      console.error('Error cargando datos del campus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  // Manejadores de Autenticación
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Manejo de Reporte de Incidencias con IA
  const handleReportIncident = async (descripcion: string) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const newInc = await reportIncident(descripcion);
      setFeedback({
        type: 'success',
        message: `Incidencia analizada con IA: [${newInc.severidad}] ${newInc.accion_sugerida || 'Registrada exitosamente.'}`
      });
      await loadAllData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Error al procesar la incidencia con el agente de IA.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Manejo de Creación de Reserva
  const handleCreateReservation = async (reservaData: Omit<Reserva, 'id' | 'estado'>) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const created = await createReservation(reservaData);
      const sp = spaces.find(s => s.id === created.espacio_id);
      const spaceName = sp ? sp.nombre : created.espacio_id;

      setFeedback({
        type: 'success',
        message: `¡Reserva aprobada con éxito para ${spaceName} (${created.asistentes} campers)!`
      });
      setIsModalOpen(false);
      await loadAllData();
      setActiveTab('agenda');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Conflicto al crear la reserva.'
      });
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Manejo de Resolución de Incidencias
  const handleResolveIncident = async (id: number) => {
    try {
      setActionLoading(true);
      await resolveIncident(id);
      setFeedback({
        type: 'success',
        message: `Incidencia #${id} resuelta. El espacio ha sido rehabilitado en todo el sistema.`
      });
      await loadAllData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'No se pudo resolver la incidencia.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Acción rápida de administrador para habilitar/inhabilitar sala
  const handleToggleSpaceStatus = async (spaceId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await updateSpaceStatus(spaceId, newStatus);
      setFeedback({
        type: 'success',
        message: `Estado de sala actualizado a: ${newStatus.toUpperCase()}`
      });
      await loadAllData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'No se pudo cambiar el estado de la sala.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Manejo de Creación de Espacio (Admin)
  const handleCreateSpace = async (spaceData: { nombre: string; tipo: string; capacidad: number; ubicacion: string }) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const created = await createSpace(spaceData);
      setFeedback({
        type: 'success',
        message: `¡Espacio '${created.nombre}' creado exitosamente con aforo de ${created.capacidad} campers!`
      });
      await loadAllData();
      setIsCreateSpaceOpen(false);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Error al registrar el nuevo espacio.'
      });
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Manejo de Creación de Recurso (Admin)
  const handleCreateResource = async (resourceData: { nombre: string; categoria: string; serial: string; ubicacion_actual: string }) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const created = await createResource(resourceData);
      setFeedback({
        type: 'success',
        message: `¡Equipo '${created.nombre}' [${created.serial}] registrado exitosamente en el inventario!`
      });
      await loadAllData();
      setIsCreateResourceOpen(false);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Error al registrar el nuevo equipo tecnológico.'
      });
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReserveForSpace = (spaceId: string) => {
    setPreselectedSpaceId(spaceId);
    setIsModalOpen(true);
  };

  // Si no hay sesión activa, muestra la pantalla cósmica de Login / Registro
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#010206] text-slate-100 flex flex-col font-sans selection:bg-campus-teal selection:text-black relative overflow-x-hidden">
        <CosmicBackground />
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010206] text-slate-100 flex flex-col font-sans selection:bg-campus-teal selection:text-black relative overflow-x-hidden">
      {/* Fondo Animado Cósmico con Estrellas Titilantes y Meteoros Diagonales */}
      <CosmicBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar Superior con Ticker, Role Switcher y User Chip */}
        <Navbar
          currentRole={currentRole}
          onRoleChange={(role) => setCurrentRole(role)}
          onSync={loadAllData}
          isLoading={loading}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Contenido Principal */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
          {/* Banner de Feedback Global */}
          {feedback && (
            <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' 
                : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <XCircle className="w-5 h-5 shrink-0 text-rose-400" />}
                <span className="font-medium">{feedback.message}</span>
              </div>
              <div className="flex items-center gap-3">
                {feedback.actionUrl && (
                  <a 
                    href={feedback.actionUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="underline font-semibold flex items-center gap-1 hover:text-white"
                  >
                    {feedback.actionLabel || 'Ver'} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button 
                  onClick={() => setFeedback(null)} 
                  className="text-slate-400 hover:text-white font-mono text-[11px] px-2 py-0.5 rounded hover:bg-white/10"
                >
                  CERRAR
                </button>
              </div>
            </div>
          )}

          {/* Barra de KPIs Operativos del Campus */}
          <MetricsSummary
            spaces={spaces}
            resources={resources}
            incidents={incidents}
          />

          {/* Navegación por Pestañas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 mb-6 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none touch-scroll pb-1.5 sm:pb-0 max-w-full -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
              {[
                { id: 'spaces', label: 'Espacios & Aforos', count: spaces.length, icon: Building2 },
                { id: 'agenda', label: 'Agenda & Google Calendar', count: reservations.length, icon: Calendar },
                { id: 'incidents', label: 'Triaje IA & Alertas', count: incidents.filter(i => i.estado === 'ABIERTA').length, icon: Sparkles },
                { id: 'resources', label: 'Recursos Tecnológicos', count: resources.length, icon: Laptop },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-white/10 text-white font-semibold border border-white/15 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-campus-teal' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-campus-teal/20 text-campus-teal' : 'bg-white/5 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Botones de Acción Rápida */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {currentRole === 'admin' && activeTab === 'spaces' && (
                <button
                  onClick={() => setIsCreateSpaceOpen(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-purple to-pink-600 text-white shadow-lg shadow-purple-500/20 hover:opacity-95 transition active:scale-95 whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>+ Nueva Sala</span>
                </button>
              )}

              {currentRole === 'admin' && activeTab === 'resources' && (
                <button
                  onClick={() => setIsCreateResourceOpen(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-teal to-campus-blue text-white shadow-lg shadow-teal-500/20 hover:opacity-95 transition active:scale-95 whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>+ Nuevo Equipo</span>
                </button>
              )}

              <button
                onClick={() => {
                  setPreselectedSpaceId('');
                  setIsModalOpen(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-teal to-campus-blue text-white shadow-lg shadow-campus-teal/20 hover:opacity-95 transition active:scale-95 whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>Crear Reserva</span>
              </button>
            </div>
          </div>

          {/* Vista Activa con animación de despliegue */}
          <div key={activeTab} className="animate-in fade-in duration-300 slide-in-from-bottom-2">
            {activeTab === 'spaces' && (
              <SpaceGrid
                spaces={spaces}
                role={currentRole}
                onSelectToReserve={handleOpenReserveForSpace}
                onToggleStatusAdmin={currentRole === 'admin' ? handleToggleSpaceStatus : undefined}
                onOpenCreateModal={() => setIsCreateSpaceOpen(true)}
              />
            )}

            {activeTab === 'agenda' && (
              <CalendarTimeline
                reservas={reservations}
                espacios={spaces}
              />
            )}

            {activeTab === 'incidents' && (
              <AITriageBox
                incidents={incidents}
                spaces={spaces}
                role={currentRole}
                onReportIncident={handleReportIncident}
                onResolveIncident={handleResolveIncident}
                isLoading={actionLoading}
              />
            )}

            {activeTab === 'resources' && (
              <ResourceList
                resources={resources}
                role={currentRole}
                onOpenCreateModal={() => setIsCreateResourceOpen(true)}
              />
            )}
          </div>
        </main>

        {/* Modal Emergente de Nueva Reserva */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="max-w-lg w-full animate-in zoom-in-95 duration-200 my-4 sm:my-8">
              <ReservationForm
                spaces={spaces}
                resources={resources}
                role={currentRole}
                preselectedSpaceId={preselectedSpaceId}
                onClose={() => setIsModalOpen(false)}
                onSubmitReservation={handleCreateReservation}
                isLoading={actionLoading}
              />
            </div>
          </div>
        )}

        {/* Modal Emergente de Administrador: Nueva Sala */}
        <CreateSpaceModal
          isOpen={isCreateSpaceOpen}
          onClose={() => setIsCreateSpaceOpen(false)}
          onCreateSpace={handleCreateSpace}
          isLoading={actionLoading}
        />

        {/* Modal Emergente de Administrador: Nuevo Equipo */}
        <CreateResourceModal
          isOpen={isCreateResourceOpen}
          onClose={() => setIsCreateResourceOpen(false)}
          onCreateResource={handleCreateResource}
          isLoading={actionLoading}
        />

        {/* Footer Cósmico Oficial */}
        <footer className="border-t border-white/5 bg-black/40 py-6 px-3.5 sm:px-6 mt-12 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <p>© 2026 CAMPUSLANDS // SISTEMA CENTRAL DE GESTIÓN OPERATIVA</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Desarrollado por Cristian (Frontend) y Samuel (Backend)</span>
              <span>•</span>
              <span className="text-campus-teal">#GoForIt</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
