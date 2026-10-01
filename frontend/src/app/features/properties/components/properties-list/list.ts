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
 * @file list.ts
 * @module Features/Properties/Components/PropertiesList
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

  /** Service métier d'accès aux propriétés BDD */
  readonly propertyService: PropertyService = inject(PropertyService);
  
  /** Service d'accès aux paramètres de la route courante */
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  /** Service de navigation Angular Router */
  private readonly router: Router = inject(Router);

  /* ==========================================================================
     2. GESTION DES ÉTATS ET SIGNAUX (REACTIVITY)
     ========================================================================== */

  /** 
   * Visibilité de la modale de création/édition de propriété 
   * @type {WritableSignal<boolean>}
   */
  readonly showModal = signal<boolean>(false);

  /** 
   * Visibilité de la modale de création complète d'un logement 
   * @type {WritableSignal<boolean>}
   */
  readonly showUnitModal = signal<boolean>(false);

  /** 
   * Propriété actuellement sélectionnée pour édition 
   * @type {WritableSignal<Property | null>}
   */
  readonly selectedProperty = signal<Property | null>(null);

  /** 
   * Propriété cible pour la création d'un nouveau logement 
   * @type {WritableSignal<Property | null>}
   */
  readonly selectedPropertyForUnit = signal<Property | null>(null);

  /** 
   * Identifiant unique (UUID) de la propriété active extrait de l'URL 
   * @type {WritableSignal<string | null>}
   */
  readonly activePropertyId = signal<string | null>(null);

  /** 
   * Message d'erreur d'opération sur la modale de propriété 
   * @type {WritableSignal<string | null>}
   */
  readonly modalError = signal<string | null>(null);

  /* ==========================================================================
     3. CYCLE DE VIE ET INITIALISATION
     ========================================================================== */

  /**
   * Cycle de vie Angular : Initialisation du composant.
   * Charge la liste des propriétés et écoute l'identifiant dans la route.
   * 
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    await this.refreshProperties();

    this.route.paramMap.subscribe(params => {
      const propertyId = params.get('propertyId') || params.get('id');
      this.activePropertyId.set(propertyId);
    });
  }

  /**
   * Recharge la liste globale des propriétés depuis le backend PostgreSQL.
   * 
   * @returns {Promise<void>}
   */
  async refreshProperties(): Promise<void> {
    await this.propertyService.loadProperties();
  }

  /* ==========================================================================
     4. NAVIGATION ET SÉLECTION
     ========================================================================== */

  /**
 * Redirige l'utilisateur vers la vue détaillée d'une propriété en utilisant son slug (ou son UUID en secours).
 * 
 * @param {Property} prop Propriété cible sélectionnée.
 * @returns {void}
 */
  onSelectProperty(prop: Property): void {
    const target = prop.slug || prop.id;
    this.router.navigate(['/properties', target]);
  }

  /**
   * Ferme la vue détaillée d'une propriété et revient à la liste globale.
   * 
   * @returns {void}
   */
  closePropertyDetail(): void {
    this.router.navigate(['/properties']);
  }

  /* ==========================================================================
     5. MODALE DE CRÉATION / ÉDITION DE PROPRIÉTÉ
     ========================================================================== */

  /**
   * Ouvre la modale en mode création.
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
   * @param {Property} prop Propriété à éditer
   * @returns {void}
   */
  openEditModal(prop: Property): void {
    this.selectedProperty.set(prop);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  /**
   * Ferme la modale de propriété et réinitialise les erreurs.
   * 
   * @returns {void}
   */
  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty.set(null);
    this.modalError.set(null);
  }

  /**
   * Enregistre la création ou la modification d'une propriété en BDD.
   * 
   * @param {CreatePropertyDto} formData Données saisies dans le formulaire
   * @returns {Promise<void>}
   */
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

  /**
   * Supprime une propriété en base de données.
   * 
   * @param {string} id Identifiant UUID de la propriété
   * @returns {Promise<void>}
   */
  async deleteProperty(id: string): Promise<void> {
    if (confirm('Voulez-vous vraiment supprimer cette propriété ?')) {
      await this.propertyService.deleteProperty(id);
      await this.refreshProperties();
    }
  }

  /* ==========================================================================
     6. MODALE DE CRÉATION DE LOGEMENT
     ========================================================================== */

  /**
   * Ouvre la modale de création d'un logement rattaché à une propriété.
   * 
   * @param {Property} property Propriété cible
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
   * Rafraîchit les données après la création réussie d'un logement.
   * 
   * @returns {Promise<void>}
   */
  async onUnitSaved(): Promise<void> {
    this.closeUnitModal();
    await this.refreshProperties();
  }
}