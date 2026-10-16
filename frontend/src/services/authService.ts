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

export const DEMO_ACCOUNTS: { admin: StoredUser; camper: StoredUser } = {
  admin: {
    id: 'user-demo-admin',
    email: 'admin@campuslands.com',
    password: 'admin123',
    role: 'admin',
    cargo: 'Administrador',
    nombre: 'Administrador Campuslands',
    creado_en: '2026-01-01T00:00:00.000Z',
  },
  camper: {
    id: 'user-demo-camper',
    email: 'camper@campuslands.com',
    password: 'camper123',
    role: 'client',
    cargo: 'Trainer',
    nombre: 'Camper Juan Pérez',
    creado_en: '2026-01-01T00:00:00.000Z',
  },
};

class AuthService {
  private initStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      if (!stored) {
        const initialUsers: StoredUser[] = [DEMO_ACCOUNTS.admin, DEMO_ACCOUNTS.camper];
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(initialUsers));
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
      if (!raw) return [DEMO_ACCOUNTS.admin, DEMO_ACCOUNTS.camper];
      return JSON.parse(raw) as StoredUser[];
    } catch {
      return [DEMO_ACCOUNTS.admin, DEMO_ACCOUNTS.camper];
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
    const users = this.getRegisteredUsers();

    const user = users.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail && u.password === password
    );

    if (!user) {
      throw new Error('Credenciales incorrectas. Verifica tu correo institucional y contraseña.');
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
    await new Promise((resolve) => setTimeout(resolve, 400));

    const normalizedEmail = data.email.trim().toLowerCase();
    const users = this.getRegisteredUsers();

    const exists = users.some((u) => u.email.trim().toLowerCase() === normalizedEmail);
    if (exists) {
      throw new Error(`El correo ${data.email} ya se encuentra registrado.`);
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nombre: data.nombre.trim(),
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

  public loginDemo(role: UserRole): User {
    const demo = role === 'admin' ? DEMO_ACCOUNTS.admin : DEMO_ACCOUNTS.camper;
    const { password: _, ...sessionUser } = demo;
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
