import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Property, CreatePropertyDto } from '../../../../core/models/property';

/**
 * @component PropertyModalComponent
 * @description Modale autonome de création et de modification d'une propriété.
 */
@Component({
  selector: 'app-property-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class PropertyModalComponent implements OnChanges {
  /** Propriété en cours de modification (null en cas de création) */
  @Input() propertyToEdit: Property | null = null;

  /** Message d'erreur local (ex: doublon de nom) */
  @Input() errorMessage: string | null = null;

  /** Notification de fermeture */
  @Output() close = new EventEmitter<void>();

  /** Émission des données lors de la soumission du formulaire */
  @Output() save = new EventEmitter<CreatePropertyDto>();

  /** Modèle de données pour les champs du formulaire */
  formData: CreatePropertyDto = {
    name: '',
    address: '',
    postal_code: '',
    city: ''
  };

  /**
   * Met à jour le formulaire selon que l'on est en création ou en édition.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyToEdit']) {
      if (this.propertyToEdit) {
        this.formData = {
          name: this.propertyToEdit.name,
          address: this.propertyToEdit.address,
          postal_code: this.propertyToEdit.postal_code,
          city: this.propertyToEdit.city
        };
      } else {
        this.resetForm();
      }
    }
  }

  /** Transmet les données saisies */
  onSubmit(): void {
    this.save.emit(this.formData);
  }

  /** Ferme la modale */
  onClose(): void {
    this.close.emit();
  }

  /** Réinitialise le formulaire */
  private resetForm(): void {
    this.formData = {
      name: '',
      address: '',
      postal_code: '',
      city: ''
    };
  }
}