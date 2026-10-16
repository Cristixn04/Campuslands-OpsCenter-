export interface Espacio {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  ubicacion: string;
  estado: 'disponible' | 'ocupado' | 'inhabilitado';
  imagen_url?: string;
}

export interface Recurso {
  id: string;
  nombre: string;
  categoria: string;
  serial: string;
  estado: 'disponible' | 'en_uso' | 'en_mantenimiento' | 'inhabilitado';
  ubicacion_actual: string;
  imagen_url?: string;
}

export interface Reserva {
  id: number;
  espacio_id: string;
  recurso_id?: string;
  solicitante: string;
  motivo: string;
  fecha_inicio: string;
  fecha_fin: string;
  asistentes: number;
  estado: string;
}

export interface Incidencia {
  id: number;
  descripcion: string;
  categoria: string;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  espacio_id?: string;
  recurso_id?: string;
  accion_sugerida?: string;
  estado: 'ABIERTA' | 'RESUELTA';
  creada_en: string;
  resuelta_en?: string;
}
