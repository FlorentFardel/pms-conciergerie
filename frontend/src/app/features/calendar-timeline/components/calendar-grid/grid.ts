/**
 * @file grid.ts
 * @description Composant UI d'affichage de la grille temporelle (logements, en-têtes de dates et barres de réservation).
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyGroup, TimeColumn, ViewMode, RenderedBooking, Booking } from '../../models/timeline';

/**
 * Composant responsable du rendu visuel de la grille du calendrier.
 * Reçoit les données via Inputs et remonte les interactions utilisateur via Outputs.
 */
@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarGridComponent {
  /** Liste des propriétés groupées avec leurs logements respectifs. */
  readonly groupedProperties = input.required<PropertyGroup[]>();

  /** Colonnes représentant les dates affichées dans l'en-tête du tableau. */
  readonly timeColumns = input.required<TimeColumn[]>();

  /** Mode de vue temporel actuellement sélectionné. */
  readonly viewMode = input.required<ViewMode>();

  /** Fonction permettant de calculer les positions des réservations pour un logement donné. */
  readonly getUnitBookingsFn = input.required<(unitId: string) => RenderedBooking[]>();

  /** Événement déclenché lors du clic sur une case vide (création de réservation). */
  readonly slotClick = output<{ unitId: string; dateStr: string }>();

  /** Événement déclenché lors du clic sur une barre de réservation existante (consultation/édition). */
  readonly bookingClick = output<Booking>();

  /**
   * Gestionnaire de clic sur un créneau jour/logement.
   * 
   * @param unitId Identifiant du logement sélectionné
   * @param dateStr Date au format ISO ('YYYY-MM-DD')
   */
  onSlotClick(unitId: string, dateStr: string): void {
    this.slotClick.emit({ unitId, dateStr });
  }

  /**
   * Gestionnaire de clic sur une réservation.
   * Stoppe la propagation de l'événement pour éviter le déclenchement du clic sur la case parente.
   * 
   * @param event Événement DOM d'origine
   * @param booking Objet réservation cliqué
   */
  onBookingClick(event: Event, booking: Booking): void {
    event.stopPropagation();
    this.bookingClick.emit(booking);
  }
}