import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UnitService } from '../../services/unit';
import { Unit, CreateUnitDto } from '../../models/unit';

/**
 * @component UnitModalComponent
 * @description Modale de création / édition de logement avec validation et émission d'événements.
 */
@Component({
  selector: 'app-unit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class UnitModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly unitService = inject(UnitService);

  @Input({ required: true }) propertyId!: string;
  @Input() unitToEdit: Unit | null = null;

  /** Événement transmis au parent pour fermer la modale */
  @Output() closed = new EventEmitter<void>();

  /** Événement transmis au parent après enregistrement réussi */
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      unit_number: [this.unitToEdit?.unit_number || '', [Validators.required]],
      name: [this.unitToEdit?.name || ''],
      type: [this.unitToEdit?.type || 'Studio', [Validators.required]],
      capacity: [this.unitToEdit?.capacity || 1, [Validators.required, Validators.min(1)]],
      floor: [this.unitToEdit?.floor ?? null],
      surface: [this.unitToEdit?.surface ?? null],
      rent_amount: [this.unitToEdit?.rent_amount ?? null],
      charges_amount: [this.unitToEdit?.charges_amount ?? null]
    });
  }

  /**
   * @method onClose
   * @description Méthode appelée lors du clic sur Annuler, la croix ou l'overlay.
   */
  onClose(): void {
    this.errorMessage.set(null);
    this.closed.emit();
  }

  /**
   * @method submit
   * @description Soumission du formulaire et création / mise à jour du logement.
   */
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;
    const payload: CreateUnitDto = {
      property_id: this.propertyId,
      unit_number: val.unit_number.trim(),
      name: val.name ? val.name.trim() : undefined,
      type: val.type,
      capacity: Number(val.capacity),
      floor: val.floor !== null && val.floor !== '' ? Number(val.floor) : undefined,
      surface: val.surface !== null && val.surface !== '' ? Number(val.surface) : undefined,
      rent_amount: val.rent_amount !== null && val.rent_amount !== '' ? Number(val.rent_amount) : undefined,
      charges_amount: val.charges_amount !== null && val.charges_amount !== '' ? Number(val.charges_amount) : undefined,
      is_active: true
    };

    try {
      if (this.unitToEdit) {
        await this.unitService.updateUnit(this.unitToEdit.id, payload);
      } else {
        await this.unitService.createUnit(payload);
      }

      // Émet la réussite pour que le parent recharge ET ferme la modale
      this.saved.emit();
      this.closed.emit();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.';
      this.errorMessage.set(msg);
      this.isSubmitting.set(false);
    }
  }
}