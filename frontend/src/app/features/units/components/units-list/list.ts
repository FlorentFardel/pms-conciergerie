import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  computed, 
  Signal, 
  WritableSignal, 
  input, 
  effect, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Services & Modèles
import { UnitService } from '../../services/unit';
import { Unit } from '../../models/unit';

// Composants de vue & UI
import { UnitModalComponent } from '../unit-modal/modal';
import { UnitCardComponent } from '../unit-card/card';
import { UnitDetailComponent } from '../unit-detail/detail';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal'; 

/**
 * @file list.ts
 * @module Features/Units/Components/UnitsList
 * @description Composant conteneur d'affichage, de tri et de gestion globale des logements.
 * Orchestre les flux de données réseau et la gestion des modales/panneaux de détails.
 * @architecture Enterprise Pattern - Container Component (Smart)
 */
@Component({
  selector: 'app-units-list',
  standalone: true,
  imports: [
    CommonModule, 
    UnitModalComponent, 
    UnitCardComponent, 
    UnitDetailComponent, 
    UiButtonComponent
  ],
  templateUrl: './list.html',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitsListComponent implements OnInit {
  /* ==========================================================================
     1. INJECTION DES SERVICES
     ========================================================================== */

  /** Service métier d'accès aux données des logements */
  private readonly unitService: UnitService = inject(UnitService);

  /* ==========================================================================
     2. INPUTS RÉACTIFS (ANGULAR SIGNALS INPUTS)
     ========================================================================== */

  /** Identifiant optionnel de la propriété parente pour filtrage */
  readonly propertyId = input<string | undefined>(undefined);

  /* ==========================================================================
     3. SIGNAUX ET ÉTATS DU COMPOSANT
     ========================================================================== */

  /** Signal d'état contenant la liste des logements chargés */
  readonly units: WritableSignal<Unit[]> = signal<Unit[]>([]);

  /** Signal indiquant l'état de chargement réseau */
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);

  /** Signal contenant le message d'erreur réseau ou applicatif */
  readonly errorMessage: WritableSignal<string | null> = signal<string | null>(null);

  /** Signal gérant l'affichage des notifications temporaires (Toast) */
  readonly notificationMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  /** Signal de contrôle de la visibilité de la modale de création/édition */
  readonly showModal: WritableSignal<boolean> = signal<boolean>(false);

  /** Signal retenant le logement en cours de modification */
  readonly selectedUnit: WritableSignal<Unit | null> = signal<Unit | null>(null);

  /** Signal retenant le logement à afficher dans le panneau de détails */
  readonly activeUnitForDetail: WritableSignal<Unit | null> = signal<Unit | null>(null);

  /* ==========================================================================
     4. SIGNAUX CALCULÉS (COMPUTED)
     ========================================================================== */

  /** Indique si au moins un logement de la liste est actif */
  readonly hasActiveUnits: Signal<boolean> = computed<boolean>(() => {
    return this.units().some((u: Unit) => u.is_active);
  });

  /** Indique si la totalité des logements de la liste est active */
  readonly areAllUnitsActive: Signal<boolean> = computed<boolean>(() => {
    const list: Unit[] = this.units();
    return list.length > 0 && list.every((u: Unit) => u.is_active);
  });

  constructor() {
    // Rechargement automatique réactif dès que l'ID de la propriété change
    effect(() => {
      const propId = this.propertyId();
      if (propId) {
        this.loadUnits();
      }
    });
  }

  /* ==========================================================================
     5. CYCLE DE VIE
     ========================================================================== */

  /**
   * Initialisation du composant.
   * 
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    await this.loadUnits();
  }

  /* ==========================================================================
     6. CHARGEMENT ET TRAITEMENT DES DONNÉES
     ========================================================================== */

  /**
   * Récupère la liste des logements auprès du backend et applique le tri via le service.
   * 
   * @returns {Promise<void>}
   */
  async loadUnits(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const data: Unit[] = await this.unitService.getUnits(this.propertyId());
      const sortedUnits: Unit[] = this.unitService.sortUnits(data);
      this.units.set(sortedUnits);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : 'Erreur lors du chargement des logements.';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /* ==========================================================================
     7. SÉLECTION ET DÉTAILS
     ========================================================================== */

  /**
   * Sélectionne un logement pour l'afficher dans le panneau de détail.
   * 
   * @param {Unit | string} unitOrId - L'objet Unit ou son identifiant unique.
   * @returns {void}
   */
  onSelectUnit(unitOrId: Unit | string): void {
    if (typeof unitOrId === 'string') {
      const targetUnit = this.units().find((u: Unit) => u.id === unitOrId);
      if (targetUnit) this.activeUnitForDetail.set(targetUnit);
    } else {
      this.activeUnitForDetail.set(unitOrId);
    }
  }

  /**
   * Ferme le panneau de détail et rafraîchit la liste des logements.
   * 
   * @returns {Promise<void>}
   */
  async onCloseDetail(): Promise<void> {
    this.activeUnitForDetail.set(null);
    await this.loadUnits();
  }

  /* ==========================================================================
     8. GESTION DES MODALES
     ========================================================================== */

  /**
   * Ouvre la modale en mode création d'un nouveau logement.
   * 
   * @returns {void}
   */
  openCreateModal(): void {
    this.selectedUnit.set(null);
    this.showModal.set(true);
  }

  /**
   * Ouvre la modale en mode édition pour un logement existant.
   * 
   * @param {Unit} unit - Le logement à éditer.
   * @returns {void}
   */
  openEditModal(unit: Unit): void {
    this.selectedUnit.set(unit);
    this.showModal.set(true);
  }

  /**
   * Traite la fermeture de la modale et applique un rafraîchissement si nécessaire.
   * 
   * @param {boolean} [shouldRefresh=false] - Indique si un rechargement est requis.
   * @returns {Promise<void>}
   */
  async onModalClosed(shouldRefresh: boolean = false): Promise<void> {
    this.showModal.set(false);
    const wasEditing = !!this.selectedUnit();
    this.selectedUnit.set(null);

    if (shouldRefresh) {
      await this.loadUnits();
      const message = wasEditing ? 'Logement mis à jour avec succès.' : 'Nouveau logement créé avec succès.';
      this.showNotification(message, 'success');
    }
  }

  /* ==========================================================================
     9. ACTIONS MÉTIER SUR LES LOGEMENTS
     ========================================================================== */

  /**
   * Bascule le statut d'activité d'un logement individuel.
   * 
   * @param {Unit | { unit: Unit; active: boolean }} payload - Données du logement cible.
   * @returns {Promise<void>}
   */
  async toggleUnitStatus(payload: Unit | { unit: Unit; active: boolean }): Promise<void> {
    const targetUnit: Unit = 'unit' in payload ? payload.unit : payload;
    const newStatus: boolean = 'active' in payload ? payload.active : !targetUnit.is_active;

    try {
      await this.unitService.toggleUnitStatus(targetUnit.id, newStatus);
      await this.loadUnits();
      this.showNotification(`Statut du logement ${targetUnit.unit_number} mis à jour.`, 'success');
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : 'Erreur lors de la modification du statut.';
      this.errorMessage.set(msg);
      this.showNotification('Échec du changement de statut.', 'error');
    }
  }

  /**
   * Bascule simultanément le statut de l'ensemble des logements affichés.
   * 
   * @returns {Promise<void>}
   */
  async toggleAllUnits(): Promise<void> {
    const targetStatus: boolean = !this.areAllUnitsActive();
    const actionLabel: string = targetStatus ? 'activer' : 'désactiver';

    if (confirm(`Voulez-vous vraiment ${actionLabel} tous les logements ?`)) {
      try {
        await this.unitService.toggleAllUnitsStatus(this.units(), targetStatus);
        await this.loadUnits();
        this.showNotification('Statut global des logements mis à jour.', 'success');
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : 'Erreur lors du changement de statut global.';
        this.errorMessage.set(msg);
        this.showNotification('Échec du changement de statut global.', 'error');
      }
    }
  }

  /**
   * Supprime un logement après confirmation.
   * 
   * @param {string} id - Identifiant du logement à supprimer.
   * @returns {Promise<void>}
   */
  async deleteUnit(id: string): Promise<void> {
    if (confirm('Voulez-vous vraiment supprimer ce logement ?')) {
      try {
        await this.unitService.deleteUnit(id);
        await this.loadUnits();
        this.showNotification('Logement supprimé avec succès.', 'success');
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : 'Erreur lors de la suppression du logement.';
        this.errorMessage.set(msg);
        this.showNotification('Échec de la suppression.', 'error');
      }
    }
  }

  /**
   * Affiche un message de notification temporaire (Toast).
   * 
   * @param {string} text - Message à afficher.
   * @param {'success' | 'error'} type - Niveau de sévérité visuel.
   * @private
   * @returns {void}
   */
  private showNotification(text: string, type: 'success' | 'error'): void {
    this.notificationMessage.set({ text, type });
    setTimeout(() => {
      this.notificationMessage.set(null);
    }, 4000);
  }
}