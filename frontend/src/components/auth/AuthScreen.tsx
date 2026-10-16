import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  UserCheck, 
  Zap, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { authService, User, UserRole } from '../../services/authService';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

const CARGOS_DISPONIBLES = [
  'Camper',
  'Trainer',
  'Administrador',
  'Teacher de ingles',
  'Comerciales',
  'HUBUX'
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Estado formulario de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Estado formulario de Registro
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('client');
  const [regCargo, setRegCargo] = useState<string>('Camper');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Estados de control
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manejo de cambio de rol en registro para sugerir cargo coherente
  const handleSelectRole = (role: UserRole) => {
    setRegRole(role);
    if (role === 'admin' && regCargo === 'Camper') {
      setRegCargo('Administrador');
    } else if (role === 'client' && regCargo === 'Administrador') {
      setRegCargo('Camper');
    }
  };

  // Login normal
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await authService.login(loginEmail, loginPassword);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  // Registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regNombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Por favor ingresa tu correo institucional.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Verifícalas.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await authService.register({
        nombre: regNombre,
        email: regEmail,
        password: regPassword,
        role: regRole,
        cargo: regCargo
      });
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  // Acceso Rápido Demo (Jurado / Testing instantáneo)
  const handleQuickDemo = (role: UserRole) => {
    setErrorMsg(null);
    try {
      const user = authService.loginDemo(role);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg('Error al activar el acceso de prueba.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative z-10 selection:bg-campus-teal selection:text-black">
      {/* Contenedor Glassmorphism estilo Lente Cósmico */}
      <div className="w-full max-w-xl bg-[#060c1a]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 ring-1 ring-white/10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Resplandor radial cósmico superior */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-campus-teal/20 via-campus-cyan/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header con Logos Oficiales */}
        <div className="text-center relative z-10 mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-3 shadow-inner group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-campus-teal to-campus-purple rounded-xl blur opacity-40 group-hover:opacity-80 transition duration-300" />
              <img
                src="/casco_azul.svg"
                alt="Campuslands Helmet"
                className="relative w-12 h-12 object-contain animate-float"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src="/CampuslandsText.svg"
              alt="Campuslands"
              className="h-6 sm:h-7 w-auto object-contain brightness-110"
            />
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-campus-cyan/15 text-campus-cyan border border-campus-cyan/30 font-semibold tracking-wider">
              OpsCenter
            </span>
          </div>

          <p className="text-slate-400 text-xs sm:text-sm font-sans">
            Centro de Operaciones Cósmicas, Espacios e Inteligencia Artificial
          </p>
        </div>

        {/* Pestañas de Modo: Iniciar Sesión / Crear Cuenta */}
        <div className="flex p-1 bg-[#02050e]/90 border border-white/10 rounded-2xl mb-6 shadow-inner relative z-10">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              tab === 'login'
                ? 'bg-gradient-to-r from-campus-teal to-campus-blue text-white shadow-lg shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              tab === 'register'
                ? 'bg-gradient-to-r from-campus-purple to-pink-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Banner de Error */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* FORMULARIO: INICIAR SESIÓN */}
        {tab === 'login' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5 font-mono">
                  CORREO ELECTRÓNICO
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="camper@campuslands.com o admin@campuslands.com"
                    required
                    className="w-full bg-[#02050e]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5 font-mono">
                  CONTRASEÑA
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Contraseña de acceso"
                    required
                    className="w-full bg-[#02050e]/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-campus-teal to-campus-blue text-white shadow-lg shadow-teal-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AUTENTICANDO NODO...
                  </span>
                ) : (
                  <>
                    <span>Entrar al OpsCenter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Separador Cósmico */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 bg-[#060c1a] text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                ⚡ Accesos Demo Instantáneos (Jurado)
              </span>
            </div>

            {/* Botones de Acceso Rápido para Testing / Jurado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('client')}
                className="group p-3 rounded-xl bg-[#030712] hover:bg-campus-teal/10 border border-white/10 hover:border-campus-teal/40 text-left transition flex items-center justify-between shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-campus-teal/15 text-campus-teal flex items-center justify-center group-hover:scale-110 transition">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-campus-teal transition">
                      Camper / Trainer
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      camper@campuslands.com
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-campus-teal group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="group p-3 rounded-xl bg-[#030712] hover:bg-campus-purple/10 border border-white/10 hover:border-campus-purple/40 text-left transition flex items-center justify-between shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-campus-purple/15 text-campus-purple flex items-center justify-center group-hover:scale-110 transition">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-campus-purple transition">
                      Administrador
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      admin@campuslands.com
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-campus-purple group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        )}

        {/* FORMULARIO: CREAR CUENTA */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in duration-200">
            {/* Nombre Completo */}
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5 font-mono">
                NOMBRE COMPLETO
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Ej. Juan Carlos Pérez"
                  required
                  className="w-full bg-[#02050e]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal transition"
                />
              </div>
            </div>

            {/* Correo Electrónico Institucional */}
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5 font-mono">
                CORREO ELECTRÓNICO INSTITUCIONAL
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Ej. jc.perez@campuslands.com"
                  required
                  className="w-full bg-[#02050e]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal transition"
                />
              </div>
            </div>

            {/* Selector Visual de Rol */}
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-2 font-mono">
                ROL PRINCIPAL EN LA PLATAFORMA
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opción Cliente / Camper */}
                <div
                  onClick={() => handleSelectRole('client')}
                  className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                    regRole === 'client'
                      ? 'bg-campus-teal/15 border-campus-teal text-white shadow-md shadow-teal-500/10'
                      : 'bg-[#02050e]/70 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className={`w-4 h-4 ${regRole === 'client' ? 'text-campus-teal' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs text-white">Camper / Cliente</span>
                  </div>
                  <p className="text-[11px] leading-tight text-slate-400">
                    Reservas de salas, consulta de agenda, reportes de incidencias con IA.
                  </p>
                </div>

                {/* Opción Administrador Operativo */}
                <div
                  onClick={() => handleSelectRole('admin')}
                  className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                    regRole === 'admin'
                      ? 'bg-campus-purple/15 border-campus-purple text-white shadow-md shadow-purple-500/10'
                      : 'bg-[#02050e]/70 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className={`w-4 h-4 ${regRole === 'admin' ? 'text-campus-purple' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs text-white">Administrador Operativo</span>
                  </div>
                  <p className="text-[11px] leading-tight text-slate-400">
                    Control total, agregar salas y equipos, inhabilitar y resolver alertas.
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de Cargo (Chips interactivos) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase className="w-3.5 h-3.5 text-campus-teal" />
                <label className="text-slate-300 text-xs font-medium font-mono">
                  CARGO / ESPECIALIDAD
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CARGOS_DISPONIBLES.map((cargo) => {
                  const isSelected = regCargo === cargo;
                  return (
                    <button
                      key={cargo}
                      type="button"
                      onClick={() => setRegCargo(cargo)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-white/20 border border-campus-teal text-white shadow-sm ring-1 ring-campus-teal/50'
                          : 'bg-[#02050e]/80 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      {cargo}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contraseña y Confirmar Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1 font-mono">
                  CONTRASEÑA
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full bg-[#02050e]/80 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1 font-mono">
                  CONFIRMAR CONTRASEÑA
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    className="w-full bg-[#02050e]/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal transition"
                  />
                </div>
              </div>
            </div>

            {/* Botón de Enviar Registro */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-campus-purple to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  REGISTRANDO EN NODO...
                </span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrarme y Acceder</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer interior de la tarjeta */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10.5px] font-mono text-slate-500">
          CAMPUSLANDS OPS // CONEXIÓN SEGURA CIFRADA • v1.0
        </div>
      </div>
    </div>
  );
};
