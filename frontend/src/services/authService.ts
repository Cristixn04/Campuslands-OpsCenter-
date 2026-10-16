export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  cargo?: string;
  creado_en: string;
}

export interface StoredUser extends User {
  password?: string;
}

const SESSION_KEY = 'campus_user_session';
const REGISTERED_USERS_KEY = 'campus_registered_users';

class AuthService {
  private initStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      if (!stored) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.error('Error inicializando almacenamiento de usuarios:', e);
    }
  }

  constructor() {
    this.initStorage();
  }

  public getRegisteredUsers(): StoredUser[] {
    this.initStorage();
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as StoredUser[];
    } catch {
      return [];
    }
  }

  public getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch (err) {
      console.error('Error leyendo sesión activa:', err);
      return null;
    }
  }

  public async login(email: string, password: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Por favor ingresa tu correo electrónico.');
    }
    if (!password) {
      throw new Error('Por favor ingresa tu contraseña.');
    }

    const users = this.getRegisteredUsers();
    const user = users.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail && u.password === password
    );

    if (!user) {
      throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña, o regístrate si aún no tienes cuenta.');
    }

    const { password: _, ...sessionUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  }

  public async register(data: {
    nombre: string;
    email: string;
    password: string;
    role: UserRole;
    cargo?: string;
  }): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedName = data.nombre.trim();
    const normalizedEmail = data.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedName || normalizedName.length < 3) {
      throw new Error('El nombre completo debe tener al menos 3 caracteres.');
    }
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      throw new Error('Por favor ingresa un formato de correo electrónico válido.');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('La contraseña debe tener un mínimo de 6 caracteres.');
    }
    if (!data.role || (data.role !== 'client' && data.role !== 'admin')) {
      throw new Error('Debes seleccionar un rol válido (Cliente o Administrador).');
    }

    const users = this.getRegisteredUsers();
    const exists = users.some((u) => u.email.trim().toLowerCase() === normalizedEmail);
    if (exists) {
      throw new Error(`El correo ${data.email} ya se encuentra registrado. Inicia sesión o usa otro correo.`);
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nombre: normalizedName,
      email: normalizedEmail,
      password: data.password,
      role: data.role,
      cargo: data.cargo?.trim() || (data.role === 'admin' ? 'Administrador' : 'Camper'),
      creado_en: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));

    const { password: _, ...sessionUser } = newUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  }

  public logout(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Error cerrando sesión:', e);
    }
  }
}

export const authService = new AuthService();
