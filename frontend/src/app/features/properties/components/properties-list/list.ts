import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// Services
import { PropertyService } from '../../services/property';

// Modèles
import { Property, CreatePropertyDto } from '../../models/property';

// Composants de vue
import { PropertyModalComponent } from '../property-modal/modal';
import { PropertyCardComponent } from '../properties-card/card';
import { PropertyDetailComponent } from '../property-detail/detail';

// Modale de création / édition de logement
import { UnitModalComponent } from '../../../units/components/unit-modal/modal';

/**
 * @component PropertiesListComponent
 * @description Composant conteneur principal gérant l'affichage de la grille du parc immobilier,
 * la délégation vers le détail d'une propriété et la gestion des modales associées.
 */
@Component({
  selector: 'app-properties-list',
  standalone: true,
  imports: [
    CommonModule, 
    PropertyModalComponent, 
    PropertyCardComponent,
    PropertyDetailComponent,
    UnitModalComponent
  ],
  templateUrl: './list.html',
  styleUrl: './list.scss'
})
export class PropertiesListComponent implements OnInit {
  /* ==========================================================================
     1. INJECTION DES SERVICES ET ROUTAGE
     ========================================================================== */

  readonly propertyService: PropertyService = inject(PropertyService);
  
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);

  /* ==========================================================================
     2. GESTION DES ÉTATS ET SIGNAUX (REACTIVITY)
     ========================================================================== */

  /** Visibilité de la modale de création/édition de propriété */
  readonly showModal = signal<boolean>(false);

  /** Visibilité de la modale de création complète d'un logement */
  readonly showUnitModal = signal<boolean>(false);

  /** Propriété actuellement sélectionnée pour édition */
  readonly selectedProperty = signal<Property | null>(null);

  /** Propriété cible pour la création d'un nouveau logement */
  readonly selectedPropertyForUnit = signal<Property | null>(null);

  /** Identifiant ou slug de la propriété active dans l'URL */
  readonly activePropertyId = signal<string | null>(null);

  /** Message d'erreur d'opération sur la modale de propriété */
  readonly modalError = signal<string | null>(null);

  /* ==========================================================================
     3. CYCLE DE VIE ET INITIALISATION
     ========================================================================== */

  async ngOnInit(): Promise<void> {
    await this.refreshProperties();

    this.route.paramMap.subscribe(params => {
      const propertyId = params.get('propertyId');
      this.activePropertyId.set(propertyId);
    });
  }

  /**
   * Recharge la liste globale des propriétés depuis le backend.
   */
  async refreshProperties(): Promise<void> {
    await this.propertyService.loadProperties();
  }

  /* ==========================================================================
     4. NAVIGATION ET SÉLECTION
     ========================================================================== */

  /**
   * Redirige l'utilisateur vers la vue détaillée d'une propriété.
   * @param {Property} prop Propriété cible sélectionnée.
   */
  onSelectProperty(prop: Property): void {
    const target = prop.slug || prop.id;
    this.router.navigate(['/properties', target]);
  }

  /**
   * Ferme la vue détaillée d'une propriété et revient à la liste globale.
   */
  closePropertyDetail(): void {
    this.router.navigate(['/properties']);
  }

  /* ==========================================================================
     5. MODALE DE CRÉATION / ÉDITION DE PROPRIÉTÉ
     ========================================================================== */

  openCreateModal(): void {
    this.selectedProperty.set(null);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEditModal(prop: Property): void {
    this.selectedProperty.set(prop);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty.set(null);
    this.modalError.set(null);
  }

  async handleSaveProperty(formData: CreatePropertyDto): Promise<void> {
    this.modalError.set(null);
    const currentProp = this.selectedProperty();

    const isDuplicate = this.propertyService.properties().some(
      (p: Property) => p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && p.id !== currentProp?.id
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
      await this.refreshProperties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.';
      this.modalError.set(msg);
    }
  }

  async deleteProperty(id: string): Promise<void> {
    if (confirm('Voulez-vous vraiment supprimer cette propriété ?')) {
      await this.propertyService.deleteProperty(id);
      await this.refreshProperties();
    }
  }

  /* ==========================================================================
     6. MODALE DE CRÉATION DE LOGEMENT
     ========================================================================== */

  openUnitModalForProperty(property: Property): void {
    this.selectedPropertyForUnit.set(property);
    this.showUnitModal.set(true);
  }

  closeUnitModal(): void {
    this.showUnitModal.set(false);
    this.selectedPropertyForUnit.set(null);
  }

  async onUnitSaved(): Promise<void> {
    this.closeUnitModal();
    await this.refreshProperties();
  }
}