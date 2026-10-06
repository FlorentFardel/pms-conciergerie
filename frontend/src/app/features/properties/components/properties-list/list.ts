import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
 * @file list.ts
 * @module Features/Properties/Components/PropertiesList
 * @description Composant conteneur principal gérant l'affichage du parc immobilier,
 * la délégation vers le détail d'une propriété et l'orchestration des modales.
 * @architecture Enterprise Pattern - Container Component (Smart)
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
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertiesListComponent implements OnInit {
  /* ==========================================================================
     1. INJECTION DES SERVICES
     ========================================================================== */

  /** Service métier centralisé d'accès au parc immobilier */
  readonly propertyService: PropertyService = inject(PropertyService);
  
  /** Service d'accès à la route active */
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  /** Service de navigation Angular */
  private readonly router: Router = inject(Router);

  /* ==========================================================================
     2. SIGNAUX ET ÉTATS DU COMPOSANT
     ========================================================================== */

  /** Visibilité de la modale de création/édition de propriété */
  readonly showModal = signal<boolean>(false);

  /** Visibilité de la modale de création d'un logement */
  readonly showUnitModal = signal<boolean>(false);

  /** Propriété actuellement sélectionnée pour édition */
  readonly selectedProperty = signal<Property | null>(null);

  /** Propriété cible pour la création d'un nouveau logement */
  readonly selectedPropertyForUnit = signal<Property | null>(null);

  /** Identifiant unique (UUID) de la propriété active extrait de l'URL */
  readonly activePropertyId = signal<string | null>(null);

  /** Message d'erreur local à la modale de propriété */
  readonly modalError = signal<string | null>(null);

  /* ==========================================================================
     3. CYCLE DE VIE ET RAFRAÎCHISSEMENT
     ========================================================================== */

  /**
   * Initialise le composant en chargeant les propriétés et en observant l'URL.
   * 
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    await this.refreshProperties();

    this.route.paramMap.subscribe((params) => {
      this.activePropertyId.set(params.get('propertyId') || params.get('id'));
    });
  }

  /**
   * Recharge l'ensemble du parc immobilier depuis le backend.
   * Répond à l'événement (refresh) émis par le template HTML.
   * 
   * @returns {Promise<void>}
   */
  async refreshProperties(): Promise<void> {
    await this.propertyService.loadProperties();
  }

  /* ==========================================================================
     4. NAVIGATION
     ========================================================================== */

  /**
   * Redirige vers le détail d'une propriété via son slug ou son identifiant.
   * 
   * @param {Property} prop - Propriété cible.
   * @returns {void}
   */
  onSelectProperty(prop: Property): void {
    this.router.navigate(['/properties', prop.slug || prop.id]);
  }

  /**
   * Reviens à la vue liste globale des propriétés.
   * 
   * @returns {void}
   */
  closePropertyDetail(): void {
    this.router.navigate(['/properties']);
  }

  /* ==========================================================================
     5. GESTION DES MODALES PROPRIÉTÉ
     ========================================================================== */

  /**
   * Ouvre la modale en mode création d'une nouvelle propriété.
   * 
   * @returns {void}
   */
  openCreateModal(): void {
    this.selectedProperty.set(null);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  /**
   * Ouvre la modale en mode édition pour une propriété donnée.
   * 
   * @param {Property} prop - Propriété à modifier.
   * @returns {void}
   */
  openEditModal(prop: Property): void {
    this.selectedProperty.set(prop);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  /**
   * Ferme la modale de propriété et purge les messages d'erreur.
   * 
   * @returns {void}
   */
  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty.set(null);
    this.modalError.set(null);
  }

  /**
   * Valide et enregistre la création ou modification d'une propriété.
   * 
   * @param {CreatePropertyDto} formData - Données transmises par le formulaire.
   * @returns {Promise<void>}
   */
  async handleSaveProperty(formData: CreatePropertyDto): Promise<void> {
    this.modalError.set(null);
    const currentProp = this.selectedProperty();

    if (this.propertyService.isPropertyNameTaken(formData.name, currentProp?.id)) {
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

  /**
   * Supprime une propriété après confirmation.
   * 
   * @param {string} id - Identifiant UUID de la propriété.
   * @returns {Promise<void>}
   */
  async deleteProperty(id: string): Promise<void> {
    if (confirm('Voulez-vous vraiment supprimer cette propriété ?')) {
      await this.propertyService.deleteProperty(id);
      await this.refreshProperties();
    }
  }

  /* ==========================================================================
     6. GESTION DE LA MODALE LOGEMENT
     ========================================================================== */

  /**
   * Ouvre la modale pour ajouter un logement au sein d'une propriété.
   * 
   * @param {Property} property - Propriété rattachée.
   * @returns {void}
   */
  openUnitModalForProperty(property: Property): void {
    this.selectedPropertyForUnit.set(property);
    this.showUnitModal.set(true);
  }

  /**
   * Ferme la modale de création de logement.
   * 
   * @returns {void}
   */
  closeUnitModal(): void {
    this.showUnitModal.set(false);
    this.selectedPropertyForUnit.set(null);
  }

  /**
   * Traite la fin de sauvegarde d'un logement en rafraîchissant les données.
   * 
   * @returns {Promise<void>}
   */
  async onUnitSaved(): Promise<void> {
    this.closeUnitModal();
    await this.refreshProperties();
  }
}