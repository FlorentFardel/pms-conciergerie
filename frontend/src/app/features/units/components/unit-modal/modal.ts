import { Component, input, output, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiModalComponent } from '../../../../shared/components/ui-modal/modal';
import { UiFormFieldComponent } from '../../../../shared/components/ui-form-field/modal';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal';
import { Unit } from '../../models/unit';
import { UnitService } from '../../services/unit';

/**
 * @file modal.ts
 * @module Features/Units/Components/UnitModal
 * @description Modale de création et d'édition d'un logement (Unit).
 * Encapsule l'appel au service backend et communique via ngModel simple.
 */
@Component({
  selector: 'app-unit-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiModalComponent,
    UiFormFieldComponent,
    UiButtonComponent
  ],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitModalComponent implements OnInit {
  private readonly unitService: UnitService = inject(UnitService);

  /** ID de la propriété parente */
  readonly propertyId = input.required<string | number>();

  /** Logement à modifier (undefined si création) */
  readonly unitToEdit = input<Unit | null | undefined>(undefined);

  /** Événement émis à la fermeture */
  readonly closed = output<void>();

  /** Événement émis après sauvegarde réussie */
  readonly saved = output<void>();

  /** Modèle de données simple pour [(ngModel)] */
  formData: Partial<Unit> = {
    unit_number: '',
    name: '',
    type: 'Studio',
    capacity: 1,
    floor: undefined,
    surface: undefined,
    rent_amount: undefined,
    charges_amount: undefined
  };

  /** Indique si une requête réseau est en cours */
  isSubmitting = false;

  /** Message d'erreur éventuel */
  errorMessage: string | null = null;

  ngOnInit(): void {
    const unit = this.unitToEdit();
    if (unit) {
      this.formData = { ...unit };
    }
  }

  /** Ferme la modale */
  onClose(): void {
    if (!this.isSubmitting) {
      this.closed.emit();
    }
  }

  /** Soumet le formulaire et effectue la requête HTTP vers le backend */
  async onSubmit(): Promise<void> {
    if (!this.formData.unit_number) {
      this.errorMessage = 'Le numéro ou la référence du logement est obligatoire.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    try {
      const currentUnit = this.unitToEdit();

      if (currentUnit && currentUnit.id) {
        // Mode Modification
        await this.unitService.updateUnit(currentUnit.id, this.formData);
      } else {
        // Mode Création (Cast explicite de property_id en string)
        const payload = {
          ...this.formData,
          property_id: String(this.propertyId())
        };
        await this.unitService.createUnit(payload as any);
      }

      // Notification au parent pour rafraîchir la liste
      this.saved.emit();
    } catch (err: unknown) {
      this.errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du logement.';
    } finally {
      this.isSubmitting = false;
    }
  }
}