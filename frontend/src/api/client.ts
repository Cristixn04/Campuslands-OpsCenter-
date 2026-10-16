import axios from 'axios';
import { Espacio, Recurso, Reserva, Incidencia } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSpaces = async (): Promise<Espacio[]> => {
  const { data } = await api.get('/spaces');
  return data;
};

export const getResources = async (): Promise<Recurso[]> => {
  const { data } = await api.get('/resources');
  return data;
};

export const getReservations = async (): Promise<Reserva[]> => {
  const { data } = await api.get('/reservations');
  return data;
};

export const createReservation = async (reserva: Omit<Reserva, 'id' | 'estado'>): Promise<Reserva> => {
  const { data } = await api.post('/reservations', reserva);
  return data;
};

export const getIncidents = async (): Promise<Incidencia[]> => {
  const { data } = await api.get('/incidents');
  return data;
};

export const reportIncident = async (descripcion: string, espacio_id_manual?: string): Promise<Incidencia> => {
  const { data } = await api.post('/incidents', { descripcion, espacio_id_manual });
  return data;
};

export const resolveIncident = async (id: number): Promise<Incidencia> => {
  const { data } = await api.patch(`/incidents/${id}/resolve`);
  return data;
};

export const getQrUrl = async (tipo: string, id_item: string): Promise<{ payload: string; qr_url: string }> => {
  const { data } = await api.get('/external/qr-url', { params: { tipo, id_item } });
  return data;
};

export default api;

export const updateSpaceStatus = async (id: string, estado: string): Promise<Espacio> => {
  const { data } = await api.patch(`/spaces/${id}/status`, { estado });
  return data;
};

export const createSpace = async (space: { nombre: string; tipo: string; capacidad: number; ubicacion: string }): Promise<Espacio> => {
  const { data } = await api.post('/spaces', space);
  return data;
};

export const createResource = async (resource: { nombre: string; categoria: string; serial: string; ubicacion_actual: string }): Promise<Recurso> => {
  const { data } = await api.post('/resources', resource);
  return data;
};

export const cancelReservation = async (id: number): Promise<Reserva> => {
  const { data } = await api.patch(`/reservations/${id}/cancel`);
  return data;
};

export const deleteReservation = async (id: number): Promise<void> => {
  await api.delete(`/reservations/${id}`);
};
