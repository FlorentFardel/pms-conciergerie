/**
 * @file date.ts
 * @description Utilitaire universel pour le calcul, le formatage des dates et les colonnes de timeline.
 */

import { ViewMode, TimeColumn } from '../../features/calendar-timeline/models/timeline';

/**
 * Formate une Date au format 'YYYY-MM-DD' (fuseau local).
 */
export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Incrémente ou décrémente une Date d'un nombre de jours.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Compare si deux dates correspondent au même jour.
 */
export function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Calcule le décalage de date pour la navigation du calendrier.
 */
export function shiftDate(date: Date, viewMode: ViewMode, direction: number): Date {
  const result = new Date(date);
  if (viewMode === 'month') {
    result.setMonth(result.getMonth() + direction);
  } else if (viewMode === 'day') {
    result.setDate(result.getDate() + direction);
  } else if (viewMode === 'week' || viewMode === '2weeks') {
    const days = viewMode === 'week' ? 7 : 14;
    result.setDate(result.getDate() + direction * days);
  }
  return result;
}

/**
 * Construit les colonnes de jours pour le tableau du calendrier.
 */
export function buildTimeColumns(viewMode: ViewMode, currentDate: Date): TimeColumn[] {
  const columns: TimeColumn[] = [];
  const today = new Date();
  
  let startDate: Date;
  let totalDays: number;

  switch (viewMode) {
    case 'day':
      startDate = new Date(currentDate);
      totalDays = 1;
      break;
    case 'week':
      startDate = new Date(currentDate);
      totalDays = 7;
      break;
    case '2weeks':
      startDate = new Date(currentDate);
      totalDays = 14;
      break;
    case 'month':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      break;
    default:
      startDate = new Date(currentDate);
      totalDays = 7;
  }

  for (let i = 0; i < totalDays; i++) {
    const dayDate = addDays(startDate, i);
    const dateStr = formatDateToIso(dayDate);
    
    const dayName = dayDate.toLocaleDateString('fr-FR', { weekday: 'short' });
    const dayNumber = dayDate.getDate().toString().padStart(2, '0');

    columns.push({
      date: dayDate,
      dateStr,
      dayName,
      dayNumber,
      isToday: isSameDay(dayDate, today),
      isFirstOfMonth: dayDate.getDate() === 1
    });
  }

  return columns;
}