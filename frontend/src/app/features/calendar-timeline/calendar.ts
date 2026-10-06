/**
 * @file calendar.ts
 * @module Features/CalendarTimeline
 * @description Smart Component orchestrateur de la vue planning (gestion de l'état local, synchronisation iCal et modales).
 */

import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../shared/components/ui-card/modal';
import { BookingModalComponent } from './components/booking-modal/modal';
import { CalendarToolbarComponent } from './components/calendar-toolbar/toolbar';
import { CalendarGridComponent } from './components/calendar-grid/grid';
import { CalendarService } from './services/calendar';
import { IcalService } from '../units/services/ical';
import { IcalEvent } from '../units/models/ical-event';
import { Unit } from '../units/models/unit';
import { ViewMode, Booking, RenderedBooking, TimeColumn, BookingChannel } from './models/timeline';
import { buildTimeColumns, formatDateToIso, shiftDate } from '../../shared/utils/date';

/**
 * Composant conteneur principal du calendrier.
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
  /* ==========================================================================
     1. INJECTION DES SERVICES
     ========================================================================== */

  private readonly calendarService = inject(CalendarService);
  private readonly icalService = inject(IcalService);

  /* ==========================================================================
     2. ÉTATS ET SIGNALS
     ========================================================================== */

  readonly viewMode = signal<ViewMode>('week');
  readonly currentDate = signal<Date>(new Date());
  readonly selectedBooking = signal<Booking | null>(null);
  readonly newBookingSelection = signal<{ unitId: string; startDate: string; endDate: string } | null>(null);
  readonly icalBookings = signal<Booking[]>([]);

  readonly groupedProperties = this.calendarService.properties;
  private readonly dbBookings = this.calendarService.bookings;

  readonly bookings = computed<Booking[]>(() => {
    return [...this.dbBookings(), ...this.icalBookings()];
  });

  readonly isLoading = this.calendarService.isLoading;

  /* ==========================================================================
     3. CALCULS COMPUTED
     ========================================================================== */

  readonly timeColumns = computed(() => {
    return buildTimeColumns(this.viewMode(), this.currentDate());
  });

  readonly currentRangeLabel = computed(() => {
    const cols = this.timeColumns();
    if (cols.length === 0) return '';
    const first = new Date(cols[0].dateStr);
    return first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  readonly getUnitBookingsBound = (unitId: string): RenderedBooking[] => {
    return this.getUnitBookings(unitId);
  };

  /* ==========================================================================
     4. CONSTRUCTEUR & CYCLE DE VIE
     ========================================================================== */

  constructor() {
    effect(() => {
      const properties = this.groupedProperties();
      if (properties && properties.length > 0) {
        this.syncIcalEvents(properties);
      }
    });
  }

  ngOnInit(): void {
    this.calendarService.loadCalendarData();
  }

  /* ==========================================================================
     5. NAVIGATION ET MODALES
     ========================================================================== */

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  navigateTime(direction: number): void {
    const updatedDate = shiftDate(this.currentDate(), this.viewMode(), direction);
    this.currentDate.set(updatedDate);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

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

  openBookingDetails(booking: Booking): void {
    this.newBookingSelection.set(null);
    this.selectedBooking.set(booking);
  }

  closeModals(): void {
    this.selectedBooking.set(null);
    this.newBookingSelection.set(null);
  }

  async handleSaveBooking(bookingData: Partial<Booking>): Promise<void> {
    if (bookingData.id) {
      await this.calendarService.updateBooking(bookingData as Booking);
    } else {
      await this.calendarService.createBooking(bookingData as Omit<Booking, 'id'>);
    }
    this.closeModals();
  }

  async handleDeleteBooking(bookingId: string): Promise<void> {
    await this.calendarService.deleteBooking(bookingId);
    this.closeModals();
  }

  /* ==========================================================================
     6. SYNCHRONISATION ICAL ET CALCULS VISUELS
     ========================================================================== */

  private async syncIcalEvents(properties: any[]): Promise<void> {
    const generatedBookings: Booking[] = [];

    for (const property of properties) {
      const units: Unit[] = property.units || [];
      
      for (const unit of units) {
        if (unit.airbnb_ical_url || unit.booking_ical_url || unit.other_ical_url) {
          try {
            const events: IcalEvent[] = await this.icalService.getUnitEvents(unit);

            for (const event of events) {
              const channelValue = (event.source as BookingChannel) || 'other';

              generatedBookings.push({
                id: `ical-${event.uid}`,
                unit_id: unit.id,
                guest_name: event.summary || 'Réservation iCal',
                check_in: formatDateToIso(event.start_date),
                check_out: formatDateToIso(event.end_date),
                status: 'confirmed',
                channel: channelValue,
                source: event.source || 'ical'
              } as unknown as Booking);
            }
          } catch (err: unknown) {
            console.error(`[CalendarTimeline] Erreur synchro iCal pour le logement ${unit.id}:`, err);
          }
        }
      }
    }

    this.icalBookings.set(generatedBookings);
  }

  /**
   * Calcule le positionnement relatif des réservations pour toutes les vues (Jour, Semaine, Mois).
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
      // Exclure si la réservation est strictement hors du champ de vision
      if (b.check_out <= rangeStart || b.check_in > rangeEnd) continue;

      const startIdx = cols.findIndex((c: TimeColumn) => c.dateStr === b.check_in);
      const endIdx = cols.findIndex((c: TimeColumn) => c.dateStr === b.check_out);

      // CAS SPÉCIAL : Vue 1 seul jour ("Jour")
      if (totalDays === 1) {
        const isCheckIn = b.check_in === rangeStart;
        const isCheckOut = b.check_out === rangeStart;

        let leftPercent = 0;
        let widthPercent = 100;

        if (isCheckIn && !isCheckOut) {
          leftPercent = 50;
          widthPercent = 50;
        } else if (isCheckOut && !isCheckIn) {
          leftPercent = 0;
          widthPercent = 50;
        }

        rendered.push({
          booking: b,
          leftPercent,
          widthPercent,
          startCol: 0,
          spanCols: 1
        });
        continue;
      }

      // CAS GÉNÉRAL : Vues multi-jours
      // 1. Début : +0.5 si le Check-in est dans le champ, sinon 0 (bords gauche)
      const startOffset = startIdx !== -1 ? startIdx + 0.5 : 0;

      // 2. Fin : +0.5 si le Check-out est dans le champ (départ à midi), sinon totalDays (bord droit)
      const endOffset = endIdx !== -1 ? endIdx + 0.5 : totalDays;

      const durationCols = Math.max(0.1, endOffset - startOffset);

      const leftPercent = (startOffset / totalDays) * 100;
      const widthPercent = (durationCols / totalDays) * 100;

      rendered.push({
        booking: b,
        leftPercent,
        widthPercent,
        startCol: startIdx !== -1 ? startIdx : 0,
        spanCols: Math.ceil(durationCols)
      });
    }

    return rendered;
  }
}