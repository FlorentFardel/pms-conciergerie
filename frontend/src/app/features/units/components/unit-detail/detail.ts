import { Component, input, output, inject, OnInit, ChangeDetectionStrategy, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Unit } from '../../models/unit';
import { UnitService } from '../../services/unit';
import { UiCardComponent } from '../../../../shared/components/ui-card/modal';
import { UiInfoRowComponent } from '../../../../shared/components/ui-info-row/modal';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal';
import { UnitModalComponent } from '../unit-modal/modal';
import { UnitIcalSyncComponent } from '../unit-ical-sync/sync';

/**
 * @file detail.ts
 * @module Features/Units/Components/UnitDetail
 * @description Vue détaillée d'un logement (Unit) avec navigation par onglets métiers, modale d'édition, synchronisation iCal et suppression sécurisée.
 * @architecture Enterprise Pattern - Smart Detail View Container
 */
@Component({
  selector: 'app-unit-detail',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    UiInfoRowComponent,
    UiButtonComponent,
    UnitModalComponent,
    UnitIcalSyncComponent
  ],
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitDetailComponent implements OnInit {
  /* ==========================================================================
     1. INJECTION DES SERVICES
     ========================================================================== */

  /**
   * Service métier centralisé pour la gestion des logements.
   * @private
   */
  private readonly unitService: UnitService = inject(UnitService);

  /* ==========================================================================
     2. ENTRÉES / SORTIES DU COMPOSANT (SIGNALS & OUTPUTS)
     ========================================================================== */

  /**
   * Identifiant UUID du logement sélectionné.
   * @input
   */
  readonly unitId = input<string | null>(null);

  /**
   * Événement émis lors du clic sur le bouton de retour à la liste.
   * @output
   */
  readonly back = output<void>();

  /**
   * Événement émis après la suppression réussie du logement.
   * @output
   */
  readonly deleted = output<void>();

  /* ==========================================================================
     3. ÉTATS ET SIGNAUX REACTIFS
     ========================================================================== */

  /**
   * Signal réactif hébergeant l'objet logement actuellement chargé.
   */
  readonly unit: WritableSignal<Unit | null> = signal<Unit | null>(null);

  /**
   * Signal de chargement indiquant si une requête HTTP est en cours.
   */
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);

  /**
   * Signal contenant le message d'erreur éventuel à afficher.
   */
  readonly error: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * Onglet métier actuellement actif ('overview' | 'sync' | 'checklists' | 'billing' | 'welcome').
   */
  readonly activeTab: WritableSignal<string> = signal<string>('overview');

  /**
   * Signal contrôlant l'ouverture et la fermeture de la modale d'édition.
   */
  readonly showModal: WritableSignal<boolean> = signal<boolean>(false);

  /* ==========================================================================
     4. CYCLE DE VIE
     ========================================================================== */

  /**
   * Initialise le composant et déclenche le chargement des détails du logement.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    await this.loadUnit();
  }

  /* ==========================================================================
     5. MÉTHODES ET GESTION DES DONNÉES
     ========================================================================== */

  /**
   * Récupère les données à jour du logement depuis le service.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async loadUnit(): Promise<void> {
    const id = this.unitId();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.unitService.getUnitById(id);
      this.unit.set(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement du logement.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Modifie l'onglet métier affiché dans le panneau de détail.
   * 
   * @param {string} tab - Identifiant de l'onglet cible.
   * @returns {void}
   */
  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  /**
   * Déclenche l'ouverture de la modale d'édition du logement.
   * 
   * @returns {void}
   */
  openEditModal(): void {
    this.showModal.set(true);
  }

  /**
   * Déclenche le retour vers la liste globale des logements.
   * 
   * @returns {void}
   */
  goBack(): void {
    this.back.emit();
  }

  /**
   * Exécute la suppression définitive du logement après confirmation utilisateur.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async deleteUnit(): Promise<void> {
    const currentUnit = this.unit();
    if (!currentUnit) return;

    const confirmation = confirm(`Voulez-vous vraiment supprimer définitivement le logement ${currentUnit.unit_number} ?`);
    if (!confirmation) return;

    try {
      await this.unitService.deleteUnit(currentUnit.id);
      this.deleted.emit();
      this.goBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression du logement.';
      this.error.set(msg);
    }
  }

  /**
   * Ferme la modale d'édition et recharge les informations du logement si nécessaire.
   * 
   * @async
   * @param {boolean} [shouldRefresh=false] - Indique si un rafraîchissement des données est requis.
   * @returns {Promise<void>}
   */
  async onModalClosed(shouldRefresh: boolean = false): Promise<void> {
    this.showModal.set(false);
    if (shouldRefresh) {
      await this.loadUnit();
    }
  }
}