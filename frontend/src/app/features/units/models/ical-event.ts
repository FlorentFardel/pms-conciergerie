/**
 * @file ical-event.ts
 * @module Features/Units/Models
 * @description Modèle représentant un événement ou un créneau d'occupation extrait d'un flux iCal (.ics).
 */

/**
 * @interface IcalEvent
 * @description Représentation typée d'une réservation ou d'une indisponibilité issue d'un canal (Airbnb, Booking, etc.).
 */
export interface IcalEvent {
  /** Identifiant unique de l'événement dans le flux iCal (UID) */
  uid: string;
  /** Libellé ou résumé de l'événement (ex: "Reserved", "Airbnb (Not available)") */
  summary: string;
  /** Description optionnelle de l'événement */
  description?: string;
  /** Date et heure de début de l'occupation (DTSTART) */
  start_date: Date;
  /** Date et heure de fin de l'occupation (DTEND) */
  end_date: Date;
  /** Source du flux ('airbnb' | 'booking' | 'other') */
  source?: string;
}