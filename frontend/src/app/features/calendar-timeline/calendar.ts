/**
 * @file calendar.ts
 * @description Composant Angular standalone de la vue Planning Timeline.
 * Gère le calcul réactif, la navigation temporelle, l'orchestration des modales et l'auto-scroll.
 */

import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  AfterViewInit,
  effect,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { UiButtonComponent } from '../../shared/components/ui-button/modal';
import { UiCardComponent } from '../../shared/components/ui-card/modal';

import { PropertyService } from '../properties/services/property';
import { Property } from '../properties/models/property';
import { BookingService } from './services/booking';
import {
  Booking,
  CreateBookingDto,
  NewBookingState,
  PropertyGroup,
  RenderedBooking,
  TimeColumn,
  ViewMode
} from './models/timeline';
import { 
  buildTimeColumns, 
  shiftDate 
} from '../../shared/utils/date';
import { BookingModalComponent } from './components/booking-modal/modal';

/**
 * @component CalendarTimelineComponent
 * @description Conteneur principal du planning multi-logements.
 */
@Component({
  selector: 'app-calendar-timeline',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
    UiCardComponent,
    BookingModalComponent
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarTimelineComponent implements OnInit, AfterViewInit {
  private readonly propertyService = inject(PropertyService);
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  /** Mode d'affichage actif ('day' | 'week' | 'month' | 'quarter') */
  readonly viewMode = signal<ViewMode>('month');

  /** Date pivot de la navigation */
  readonly currentDate = signal<Date>(new Date());

  /** Réservation sélectionnée pour affichage/édition */
  readonly selectedBooking = signal<Booking | null>(null);

  /** Sélection temporelle initiale pour une nouvelle réservation */
  readonly newBookingSelection = signal<NewBookingState | null>(null);

  /** Regroupement réactif des propriétés et logements */
  readonly groupedProperties = computed<PropertyGroup[]>(() => {
    return this.propertyService.properties().map((p: Property) => ({
      propertyId: p.id,
      propertyName: p.name || 'Propriété sans nom',
      units: (p.units || []).map((u) => ({
        id: u.id,
        name: u.name,
        unit_number: u.unit_number || u.id
      }))
    }));
  });

  /** Ensemble des réservations chargées */
  readonly bookings = computed<Booking[]>(() => this.bookingService.bookings());

  /** Colonnes temporelles générées selon le mode et la date pivot */
  readonly timeColumns = computed<TimeColumn[]>(() =>
    buildTimeColumns(this.viewMode(), this.currentDate())
  );

  /** Libellé du mois et de l'année pour l'en-tête de navigation */
  readonly currentRangeLabel = computed<string>(() => {
    return this.currentDate().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  constructor() {
    // Persistance dynamique dans l'URL (F5)
    effect(() => {
      const mode = this.viewMode();
      const dateStr = this.currentDate().toISOString().substring(0, 10);
      
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { date: dateStr, view: mode },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    });

    // Auto-scroll vers la cellule du jour dès que les colonnes changent
    effect(() => {
      this.timeColumns();
      queueMicrotask(() => this.scrollToToday());
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['date']) {
      const parsedDate = new Date(params['date']);
      if (!isNaN(parsedDate.getTime())) {
        this.currentDate.set(parsedDate);
      }
    }
    if (params['view']) {
      this.viewMode.set(params['view'] as ViewMode);
    }

    if (this.propertyService.properties().length === 0) {
      this.propertyService.loadProperties();
    }
    this.bookingService.loadBookings();
  }

  ngAfterViewInit(): void {
    this.scrollToToday();
  }

  /**
   * Replace le calendrier sur la date d'aujourd'hui et scroll dessus.
   */
  goToToday(): void {
    this.currentDate.set(new Date());
  }

  /**
   * Scrolle horizontalement jusqu'à l'élément '.is-today' en tenant compte de la colonne sticky.
   */
  private scrollToToday(): void {
    const hostEl = this.elementRef.nativeElement as HTMLElement;
    const wrapper = hostEl.querySelector('.timeline-grid-wrapper') as HTMLElement;
    const todayHeader = hostEl.querySelector('.col-day-header.is-today') as HTMLElement;

    if (wrapper && todayHeader) {
      const isDesktop = window.innerWidth >= 768;
      const stickyOffset = isDesktop ? 200 : 130;
      
      const targetLeft = todayHeader.offsetLeft - stickyOffset;

      wrapper.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth'
      });
    }
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  navigateTime(direction: number): void {
    this.currentDate.set(shiftDate(this.currentDate(), this.viewMode(), direction));
  }

  openBookingDetails(booking: Booking): void {
    this.selectedBooking.set(booking);
  }

  openCreateModal(unit_id: string, startDateStr: string): void {
    const [year, month, day] = startDateStr.split('-').map(Number);
    const nextDayDate = new Date(year, month - 1, day + 1);

    const endYear = nextDayDate.getFullYear();
    const endMonth = String(nextDayDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(nextDayDate.getDate()).padStart(2, '0');
    const endDateStr = `${endYear}-${endMonth}-${endDay}`;

    this.newBookingSelection.set({ unitId: unit_id, startDate: startDateStr, endDate: endDateStr });
  }

  async handleSaveBooking(dto: CreateBookingDto & { id?: string }): Promise<void> {
    if (dto.id) {
      await this.bookingService.updateBooking(dto.id, dto);
    } else {
      await this.bookingService.createBooking(dto);
    }
    this.closeModals();
  }

  async handleDeleteBooking(id: string): Promise<void> {
    await this.bookingService.cancelBooking(id);
    this.closeModals();
  }

  closeModals(): void {
    this.selectedBooking.set(null);
    this.newBookingSelection.set(null);
  }

  getUnitBookings(unitId: string): RenderedBooking[] {
    const cols = this.timeColumns();
    const totalCols = cols.length;
    if (totalCols === 0) return [];

    const firstColDate = cols[0].dateStr;
    const lastColDate = cols[totalCols - 1].dateStr;

    return this.bookings()
      .filter((b: Booking) => {
        if (b.unit_id !== unitId) return false;

        const arrivesBeforeViewEnds = b.check_in <= lastColDate;
        const departsAfterViewStarts = b.check_out >= firstColDate;

        return arrivesBeforeViewEnds && departsAfterViewStarts;
      })
      .map((booking: Booking) => {
        let startPos = 0;
        let endPos = totalCols;

        if (booking.check_in >= firstColDate) {
          const idx = cols.findIndex((c: TimeColumn) => c.dateStr === booking.check_in);
          if (idx !== -1) {
            startPos = idx + 0.5;
          }
        }

        if (booking.check_out <= lastColDate) {
          const idx = cols.findIndex((c: TimeColumn) => c.dateStr === booking.check_out);
          if (idx !== -1) {
            endPos = idx + 0.5;
          }
        }

        const span = Math.max(0.5, endPos - startPos);

        const leftPercent = (startPos / totalCols) * 100;
        const widthPercent = (span / totalCols) * 100;

        return {
          booking,
          startCol: Math.floor(startPos),
          spanCols: Math.ceil(span),
          leftPercent,
          widthPercent
        };
      });
  }
}