/**
 * @file calendar.ts
 * @module Features/CalendarTimeline
 * @description Smart Component orchestrateur de la vue planning (gestion de l'état local et des modales).
 */

import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../shared/components/ui-card/modal';
import { BookingModalComponent } from './components/booking-modal/modal';
import { CalendarToolbarComponent } from './components/calendar-toolbar/toolbar';
import { CalendarGridComponent } from './components/calendar-grid/grid';
import { CalendarService } from './services/calendar';
import { ViewMode, Booking, RenderedBooking, TimeColumn } from './models/timeline';
import { buildTimeColumns, formatDateToIso, shiftDate } from '../../shared/utils/date';

/**
 * Composant conteneur principal du calendrier.
 * Reçoit les signaux du `CalendarService`, calcule les barres de réservation 
 * et gère le cycle de vie des modales.
 */
@Component({
  selector: 'app-calendar-timeline',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    BookingModalComponent,
    CalendarToolbarComponent,
    CalendarGridComponent
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarTimelineComponent implements OnInit {
  /** Service centralisé de données du planning */
  private readonly calendarService = inject(CalendarService);

  /** Mode d'affichage temporel actif */
  readonly viewMode = signal<ViewMode>('week');

  /** Date pivot pour la navigation temporelle */
  readonly currentDate = signal<Date>(new Date());

  /** Réservation ouverte dans la modale (`null` si fermeture) */
  readonly selectedBooking = signal<Booking | null>(null);

  /** Données de pré-remplissage pour une création via un clic sur un créneau */
  readonly newBookingSelection = signal<{ unitId: string; startDate: string; endDate: string } | null>(null);

  /** Liste des propriétés groupées transmise par le service */
  readonly groupedProperties = this.calendarService.properties;

  /** Liste des réservations transmise par le service */
  readonly bookings = this.calendarService.bookings;

  /** État de chargement du service */
  readonly isLoading = this.calendarService.isLoading;

  /**
   * Calcul des colonnes de dates (jours) à afficher selon le mode de vue et la date courante.
   */
  readonly timeColumns = computed(() => {
    return buildTimeColumns(this.viewMode(), this.currentDate());
  });

  /**
   * Libellé formaté du mois et de l'année de la période affichée.
   */
  readonly currentRangeLabel = computed(() => {
    const cols = this.timeColumns();
    if (cols.length === 0) return '';
    const first = new Date(cols[0].dateStr);
    return first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  /**
   * Liaison de méthode transmise en Input à `CalendarGridComponent`
   * pour calculer les segments visuels des réservations.
   */
  readonly getUnitBookingsBound = (unitId: string): RenderedBooking[] => {
    return this.getUnitBookings(unitId);
  };

  /**
   * Initialisation : déclenche la récupération des données en BDD.
   */
  ngOnInit(): void {
    this.calendarService.loadCalendarData();
  }

  /**
   * Modifie le mode de vue de la timeline.
   * 
   * @param mode Nouveau mode sélectionné ('day' | 'week' | '2weeks' | 'month' | 'quarter')
   */
  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  /**
   * Avance ou recule la vue temporelle.
   * 
   * @param direction -1 pour la période précédente, +1 pour la suivante
   */
  navigateTime(direction: number): void {
    const updatedDate = shiftDate(this.currentDate(), this.viewMode(), direction);
    this.currentDate.set(updatedDate);
  }

  /**
   * Repositionne le calendrier sur le jour actuel.
   */
  goToToday(): void {
    this.currentDate.set(new Date());
  }

  /**
   * Ouvre la modale de création sur un logement et une date spécifiés.
   * 
   * @param unitId Identifiant du logement
   * @param dateStr Date d'arrivée sélectionnée (format 'YYYY-MM-DD')
   */
  openCreateModal(unitId: string, dateStr: string): void {
    this.selectedBooking.set(null);

    const startDateObj = new Date(dateStr);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 1);

    this.newBookingSelection.set({
      unitId,
      startDate: dateStr,
      endDate: formatDateToIso(endDateObj)
    });
  }

  /**
   * Ouvre la modale de consultation/modification d'une réservation.
   * 
   * @param booking La réservation cliquée
   */
  openBookingDetails(booking: Booking): void {
    this.newBookingSelection.set(null);
    this.selectedBooking.set(booking);
  }

  /**
   * Ferme toutes les modales actives.
   */
  closeModals(): void {
    this.selectedBooking.set(null);
    this.newBookingSelection.set(null);
  }

  /**
   * Enregistre les modifications ou la création d'une réservation.
   * 
   * @param bookingData Les données de la réservation
   */
  async handleSaveBooking(bookingData: Partial<Booking>): Promise<void> {
    if (bookingData.id) {
      await this.calendarService.updateBooking(bookingData as Booking);
    } else {
      await this.calendarService.createBooking(bookingData as Omit<Booking, 'id'>);
    }
    this.closeModals();
  }

  /**
   * Supprime la réservation identifiée.
   * 
   * @param bookingId Identifiant UUID de la réservation
   */
  async handleDeleteBooking(bookingId: string): Promise<void> {
    await this.calendarService.deleteBooking(bookingId);
    this.closeModals();
  }

  /**
   * Calcule le positionnement relatif (% left/width et colonnes) 
   * des réservations d'un logement pour l'affichage visuel sur la grille.
   * 
   * @param unitId Identifiant du logement
   * @returns Liste des segments de réservations calculés
   */
  private getUnitBookings(unitId: string): RenderedBooking[] {
    const cols = this.timeColumns();
    if (cols.length === 0) return [];

    const rangeStart = cols[0].dateStr;
    const rangeEnd = cols[cols.length - 1].dateStr;
    const totalDays = cols.length;

    const unitBookings = this.bookings().filter((b: Booking) => b.unit_id === unitId);
    const rendered: RenderedBooking[] = [];

    for (const b of unitBookings) {
      if (b.check_out < rangeStart || b.check_in > rangeEnd) continue;

      const startIdx = cols.findIndex((c: TimeColumn) => c.dateStr === b.check_in);
      const effectiveStartIdx = startIdx !== -1 ? startIdx : 0;

      const endIdx = cols.findIndex((c: TimeColumn) => c.dateStr === b.check_out);
      const effectiveEndIdx = endIdx !== -1 ? endIdx : totalDays - 1;

      const durationDays = Math.max(1, effectiveEndIdx - effectiveStartIdx + 1);

      const leftPercent = (effectiveStartIdx / totalDays) * 100;
      const widthPercent = (durationDays / totalDays) * 100;

      rendered.push({
        booking: b,
        leftPercent,
        widthPercent,
        startCol: effectiveStartIdx,
        spanCols: durationDays
      });
    }

    return rendered;
  }
}