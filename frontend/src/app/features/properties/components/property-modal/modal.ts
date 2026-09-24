import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Property, CreatePropertyDto } from '../../models/property';
import { UiModalComponent } from '../../../../shared/components/ui-modal';

/**
 * @component PropertyModalComponent
 * @description Modale métier de création et édition d'une propriété, appuyée sur UiModalComponent.
 */
@Component({
  selector: 'app-property-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, UiModalComponent],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class PropertyModalComponent implements OnChanges {
  @Input() propertyToEdit: Property | null = null;
  @Input() errorMessage: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreatePropertyDto>();

  formData: CreatePropertyDto = {
    name: '',
    address: '',
    postal_code: '',
    city: ''
  };

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

  onSubmit(): void {
    this.save.emit(this.formData);
  }

  onClose(): void {
    this.close.emit();
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      address: '',
      postal_code: '',
      city: ''
    };
  }
}