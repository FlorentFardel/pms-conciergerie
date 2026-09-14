import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../../core/services/property';
import { Property, CreatePropertyDto } from '../../../core/models/property';
import { PropertyModalComponent } from '../components/property-modal/modal';

/**
 * @component PropertiesListComponent
 * @description Composant principal pour la gestion des propriétés immobilières.
 */
@Component({
  selector: 'app-properties-list',
  standalone: true,
  imports: [CommonModule, PropertyModalComponent],
  templateUrl: './list.html',
  styleUrl: './list.scss'
})
export class PropertiesListComponent implements OnInit {
  /** Service de gestion de l'état des propriétés */
  readonly propertyService = inject(PropertyService);

  /** Signal gérant l'ouverture / fermeture de la modale */
  readonly showModal = signal<boolean>(false);

  /** Signal contenant la propriété à éditer (null en cas de création) */
  readonly selectedProperty = signal<Property | null>(null);

  /** Signal d'erreur transmis à la modale */
  readonly modalError = signal<string | null>(null);

  /** Charge la liste des propriétés à l'initialisation */
  async ngOnInit(): Promise<void> {
    await this.propertyService.loadProperties();
  }

  /** Ouvre la modale pour une nouvelle création */
  openCreateModal(): void {
    this.selectedProperty.set(null);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  /** Ouvre la modale pour modifier une propriété existante */
  openEditModal(prop: Property): void {
    this.selectedProperty.set(prop);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  /** Ferme la modale */
  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty.set(null);
    this.modalError.set(null);
  }

  /** Soumission des données depuis la modale */
  async handleSaveProperty(formData: CreatePropertyDto): Promise<void> {
    this.modalError.set(null);
    const currentProp = this.selectedProperty();

    // Vérification locale des doublons sur le nom
    const isDuplicate = this.propertyService.properties().some(
      p => p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && p.id !== currentProp?.id
    );

    if (isDuplicate) {
      this.modalError.set('Une propriété portant ce nom existe déjà.');
      return;
    }

    try {
      if (currentProp) {
        await this.propertyService.updateProperty(currentProp.id, formData);
      } else {
        await this.propertyService.createProperty(formData);
      }
      this.closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.';
      this.modalError.set(msg);
    }
  }

  /** Supprime une propriété après confirmation */
  async deleteProperty(id: string): Promise<void> {
    if (confirm('Voulez-vous vraiment supprimer cette propriété ?')) {
      await this.propertyService.deleteProperty(id);
    }
  }
}