/**
 * @file booking-modal.ts
 * @description Composant autonome (Standalone) gérant la modale de création, consultation et modification des réservations.
 * Isole la logique des formulaires réactifs (ReactiveForms) et l'interaction utilisateur.
 */

import { Component, input, output, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { UiButtonComponent } from '../../../../shared/components/ui-button/modal';
import { UiModalComponent } from '../../../../shared/components/ui-modal/modal';

import { Booking, CreateBookingDto } from '../../models/timeline';

/**
 * Données d'initialisation pour la création d'une nouvelle réservation.
 */
export interface InitialBookingData {
  /** UUID du logement concerné */
  unitId: string;
  /** Date d'arrivée sous format YYYY-MM-DD */
  startDate: string;
  /** Date de départ sous format YYYY-MM-DD */
  endDate: string;
}

/**
 * @component BookingModalComponent
 * @description Modale réutilisable pour le CRUD des réservations et blocages manuels.
 */
@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiModalComponent
  ],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  // --- INPUTS (SIGNALS) ---
  
  /** Réservation existante sélectionnée (null si création) */
  readonly booking = input<Booking | null>(null);

  /** Données de pré-remplissage pour une création de réservation */
  readonly initialData = input<InitialBookingData | null>(null);

  // --- OUTPUTS (EVENTS) ---

  /** Événement émis lors de la fermeture de la modale */
  readonly close = output<void>();

  /** Événement émis lors de la sauvegarde (création ou mise à jour) */
  readonly save = output<CreateBookingDto & { id?: string }>();

  /** Événement émis lors de la suppression d'une réservation */
  readonly delete = output<string>();

  /** Indique si le formulaire est actuellement en mode édition active */
  isEditing = false;

  /** Formulaire réactif de saisie des détails de la réservation */
  readonly bookingForm: FormGroup = this.fb.group({
    id: [''],
    unit_id: ['', Validators.required],
    guestName: ['', Validators.required],
    check_in: ['', Validators.required],
    check_out: ['', Validators.required],
    channel: ['MANUAL', Validators.required],
    total_price: [0, [Validators.min(0)]],
    block_reason: ['']
  });

  /**
   * Initialise le formulaire en fonction du contexte (consultation ou création).
   */
  ngOnInit(): void {
    const b = this.booking();
    const init = this.initialData();

    if (b) {
      // Mode consultation d'une réservation existante
      this.isEditing = false;
      this.bookingForm.patchValue({
        id: b.id,
        unit_id: b.unit_id,
        guestName: b.guestName || b.block_reason || 'Réservation',
        check_in: b.check_in,
        check_out: b.check_out,
        channel: b.channel || 'MANUAL',
        total_price: b.total_price || 0,
        block_reason: b.block_reason || ''
      });
    } else if (init) {
      // Mode création d'une nouvelle réservation
      this.isEditing = true;
      this.bookingForm.patchValue({
        id: '',
        unit_id: init.unitId,
        guestName: '',
        check_in: init.startDate,
        check_out: init.endDate,
        channel: 'MANUAL',
        total_price: 0,
        block_reason: ''
      });
    }
  }

  /**
   * Bascule l'affichage du mode consultation vers le mode édition du formulaire.
   */
  startEdit(): void {
    this.isEditing = true;
  }

  /**
   * Valide et émet les données du formulaire vers le composant parent.
   */
  onSave(): void {
    if (this.bookingForm.invalid) return;

    const val = this.bookingForm.value;
    const dto: CreateBookingDto & { id?: string } = {
      id: val.id || undefined,
      unit_id: val.unit_id,
      guestName: val.guestName,
      check_in: val.check_in,
      check_out: val.check_out,
      channel: val.channel,
      total_price: val.total_price,
      is_manual_entry: val.channel === 'MANUAL' || val.channel === 'MANUAL_BLOCK',
      block_reason: (val.channel === 'MANUAL' || val.channel === 'MANUAL_BLOCK') ? val.guestName : null
    };

    this.save.emit(dto);
  }

  /**
   * Demande la suppression ou le déblocage de la réservation courante.
   */
  onDelete(): void {
    const b = this.booking();
    if (b) {
      this.delete.emit(b.id);
    }
  }
}