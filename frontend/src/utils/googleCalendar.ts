import { Reserva } from '../types';

/**
 * Formatea una fecha a formato UTC compacto 'YYYYMMDDTHHmmssZ' requerido por
 * Google Calendar Web Intent y por el estándar iCalendar (RFC 5545).
 */
export function formatToUtcCompact(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${fallback.getUTCFullYear()}${pad(fallback.getUTCMonth() + 1)}${pad(fallback.getUTCDate())}T${pad(fallback.getUTCHours())}${pad(fallback.getUTCMinutes())}${pad(fallback.getUTCSeconds())}Z`;
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapa caracteres especiales según la especificación RFC 5545 para archivos iCalendar (.ics).
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Genera la URL directa de Web Intent para Google Calendar.
 * URL formato:
 * https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${inicioISO}/${finISO}&details=${encodeURIComponent(detalles)}&location=${encodeURIComponent(ubicacion)}
 */
export function generateGoogleCalendarUrl(reserva: Reserva, espacioNombre: string): string {
  const titulo = `Reserva ${espacioNombre}: ${reserva.motivo || 'Actividad en Campuslands'}`;
  const inicioISO = formatToUtcCompact(reserva.fecha_inicio);
  const finISO = formatToUtcCompact(reserva.fecha_fin);
  const ubicacion = `${espacioNombre} - Campuslands`;

  const detalles = [
    `🏢 Espacio: ${espacioNombre}`,
    `👤 Solicitante: ${reserva.solicitante}`,
    `👥 Asistentes: ${reserva.asistentes} personas`,
    `📌 Motivo: ${reserva.motivo || 'Sin especificar'}`,
    `⚡ Estado: ${reserva.estado.toUpperCase()}`,
    reserva.recurso_id ? `💻 Recurso Asignado: ${reserva.recurso_id}` : '',
    '',
    'Gestión automatizada por Campuslands OpsCenter'
  ]
    .filter(Boolean)
    .join('\n');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${inicioISO}/${finISO}&details=${encodeURIComponent(detalles)}&location=${encodeURIComponent(ubicacion)}`;
}

/**
 * Genera y descarga un archivo .ics estándar (RFC 5545) en el navegador del usuario
 * para sincronizar con Google Calendar, Apple Calendar, Microsoft Outlook, etc.
 */
export function downloadIcsFile(reserva: Reserva, espacioNombre: string): void {
  const titulo = `Reserva ${espacioNombre}: ${reserva.motivo || 'Actividad en Campuslands'}`;
  const inicioISO = formatToUtcCompact(reserva.fecha_inicio);
  const finISO = formatToUtcCompact(reserva.fecha_fin);
  const nowISO = formatToUtcCompact(new Date());
  const ubicacion = `${espacioNombre} - Campuslands`;

  const detalles = [
    `Espacio: ${espacioNombre}`,
    `Solicitante: ${reserva.solicitante}`,
    `Asistentes: ${reserva.asistentes} personas`,
    `Motivo: ${reserva.motivo || 'Sin especificar'}`,
    `Estado: ${reserva.estado}`,
    reserva.recurso_id ? `Recurso Asignado: ${reserva.recurso_id}` : '',
    '',
    'Campuslands OpsCenter - Nodo Central Operativo'
  ]
    .filter(Boolean)
    .join('\n');

  const safeUid = `campuslands-reserva-${reserva.id}-${inicioISO}@campuslands.com`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campuslands//OpsCenter Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${safeUid}`,
    `DTSTAMP:${nowISO}`,
    `DTSTART:${inicioISO}`,
    `DTEND:${finISO}`,
    `SUMMARY:${escapeIcsText(titulo)}`,
    `DESCRIPTION:${escapeIcsText(detalles)}`,
    `LOCATION:${escapeIcsText(ubicacion)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const safeFileName = `reserva-${reserva.id}-${espacioNombre.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
  link.setAttribute('download', safeFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
