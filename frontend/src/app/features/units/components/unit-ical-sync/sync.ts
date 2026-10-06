import { Component, input, output, inject, OnInit, signal, ChangeDetectionStrategy, WritableSignal, InputSignal, OutputEmitterRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Unit } from '../../models/unit';
import { UnitService } from '../../services/unit';
import { IcalService } from '../../services/ical';
import { IcalEvent } from '../../models/ical-event';
import { UiCardComponent } from '../../../../shared/components/ui-card/modal';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal';

/**
 * @file sync.ts
 * @module Features/Units/Components/UnitIcalSync
 * @description Composant de gestion, configuration et synchronisation des flux iCal.
 * @architecture Enterprise Pattern - Presentational / Form Component
 */
@Component({
  selector: 'app-unit-ical-sync',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiCardComponent,
    UiButtonComponent
  ],
  templateUrl: './sync.html',
  styleUrl: './sync.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitIcalSyncComponent implements OnInit {
  /* ==========================================================================
     1. INJECTION DES SERVICES
     ========================================================================== */

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly unitService: UnitService = inject(UnitService);
  private readonly icalService: IcalService = inject(IcalService);

  /* ==========================================================================
     2. ENTRÉES / SORTIES DU COMPOSANT
     ========================================================================== */

  /** Logement cible */
  readonly unit: InputSignal<Unit> = input.required<Unit>();

  /** Événement émis vers le parent après sauvegarde réussie */
  readonly updated: OutputEmitterRef<void> = output<void>();

  /* ==========================================================================
     3. ÉTATS ET FORMULAIRE
     ========================================================================== */

  syncForm!: FormGroup;
  readonly loading: WritableSignal<boolean> = signal<boolean>(false);
  readonly testingSync: WritableSignal<boolean> = signal<boolean>(false);
  readonly successMessage: WritableSignal<string | null> = signal<string | null>(null);
  readonly errorMessage: WritableSignal<string | null> = signal<string | null>(null);
  readonly fetchedEvents: WritableSignal<IcalEvent[]> = signal<IcalEvent[]>([]);

  constructor() {
    /**
     * Maintient le formulaire à jour automatiquement lorsque l'input `unit()` change
     * (par exemple lors du rechargement des données par le composant parent).
     */
    effect(() => {
      const currentUnit = this.unit();
      if (this.syncForm && currentUnit) {
        this.syncForm.patchValue({
          airbnb_ical_url: currentUnit.airbnb_ical_url || '',
          booking_ical_url: currentUnit.booking_ical_url || '',
          other_ical_url: currentUnit.other_ical_url || ''
        }, { emitEvent: false });
      }
    });
  }

  /* ==========================================================================
     4. CYCLE DE VIE
     ========================================================================== */

  /**
   * Construction initiale du formulaire réactif.
   * 
   * @returns {void}
   */
  ngOnInit(): void {
    const u = this.unit();
    this.syncForm = this.fb.group({
      airbnb_ical_url: [u?.airbnb_ical_url || '', [Validators.pattern('https?://.+')]],
      booking_ical_url: [u?.booking_ical_url || '', [Validators.pattern('https?://.+')]],
      other_ical_url: [u?.other_ical_url || '', [Validators.pattern('https?://.+')]]
    });
  }

  /* ==========================================================================
     5. GETTERS & MÉTHODES UTILITAIRES
     ========================================================================== */

  get exportIcalUrl(): string {
    const origin = window.location.origin;
    return `${origin}/api/ical/export/${this.unit().id}.ics`;
  }

  async copyExportUrl(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.exportIcalUrl);
      this.successMessage.set('Lien d\'exportation copié dans le presse-papier !');
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch {
      this.errorMessage.set('Impossible de copier le lien.');
    }
  }

  /* ==========================================================================
     6. SYNCHRONISATION & SOUMISSION
     ========================================================================== */

  async testSync(): Promise<void> {
    if (this.syncForm.invalid) return;

    this.testingSync.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.fetchedEvents.set([]);

    const airbnbUrl = this.syncForm.get('airbnb_ical_url')?.value;
    const bookingUrl = this.syncForm.get('booking_ical_url')?.value;
    const otherUrl = this.syncForm.get('other_ical_url')?.value;

    const allEvents: IcalEvent[] = [];

    try {
      if (airbnbUrl) {
        const events = await this.icalService.fetchAndParseIcal(airbnbUrl, 'airbnb');
        allEvents.push(...events);
      }
      if (bookingUrl) {
        const events = await this.icalService.fetchAndParseIcal(bookingUrl, 'booking');
        allEvents.push(...events);
      }
      if (otherUrl) {
        const events = await this.icalService.fetchAndParseIcal(otherUrl, 'other');
        allEvents.push(...events);
      }

      this.fetchedEvents.set(allEvents);
      this.successMessage.set(`Synchronisation réussie : ${allEvents.length} réservation(s) détectée(s).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la synchronisation des flux.';
      this.errorMessage.set(msg);
    } finally {
      this.testingSync.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.syncForm.invalid) return;

    this.loading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const formValues = this.syncForm.value;
      const payload = {
        ...formValues,
        last_sync_at: new Date().toISOString()
      };

      await this.unitService.updateUnit(this.unit().id, payload);
      this.successMessage.set('Configuration iCal enregistrée avec succès.');
      
      // Maintient la valeur en local immédiatement au lieu de vider les champs
      this.syncForm.patchValue(formValues, { emitEvent: false });
      
      this.updated.emit();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la configuration.';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}