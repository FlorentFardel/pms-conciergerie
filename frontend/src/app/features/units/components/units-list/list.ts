import { Component, OnInit, Input, inject, signal, computed, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnitService } from '../../services/unit';
import { Unit } from '../../models/unit';
import { UnitModalComponent } from '../unit-modal/modal';
import { UnitCardComponent } from '../unit-card/card';
import { UnitDetailComponent } from '../unit-detail/detail';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal'; 

/**
 * @file list.ts
 * @module Features/Units/Components/UnitsList
 * @description Composant conteneur autonome d'affichage, de tri et de gestion globale des logements (Units).
 * Orchestre les appels réseau via UnitService et pilote les modales de création/édition.
 */
@Component({
  selector: 'app-units-list',
  standalone: true,
  imports: [CommonModule, UnitModalComponent, UnitCardComponent, UnitDetailComponent, UiButtonComponent],
  templateUrl: './list.html',
  styleUrl: './list.scss'
})
export class UnitsListComponent implements OnInit {
  /** Service métier d'accès aux données des logements */
  private readonly unitService: UnitService = inject(UnitService);

  /**
   * ID optionnel de la propriété parente pour filtrer les logements.
   * @type {string | undefined}
   */
  @Input() propertyId?: string;

  /**
   * Signal d'état contenant la liste des logements chargés et triés.
   * @type {WritableSignal<Unit[]>}
   */
  readonly units: WritableSignal<Unit[]> = signal<Unit[]>([]);

  /**
   * Signal indiquant l'état de chargement réseau.
   * @type {WritableSignal<boolean>}
   */
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);

  /**
   * Signal contenant le message d'erreur réseau ou applicatif.
   * @type {WritableSignal<string | null>}
   */
  readonly errorMessage: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * Signal gérant l'affichage des notifications temporaires (Toast).
   * @type {WritableSignal<{ text: string; type: 'success' | 'error' } | null>}
   */
  readonly notificationMessage: WritableSignal<{ text: string; type: 'success' | 'error' } | null> = signal(null);

  /**
   * Signal de contrôle de la visibilité de la modale de création/édition.
   * @type {WritableSignal<boolean>}
   */
  readonly showModal: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * Signal retenant le logement en cours de modification (null en création).
   * @type {WritableSignal<Unit | null>}
   */
  readonly selectedUnit: WritableSignal<Unit | null> = signal<Unit | null>(null);

  /**
   * Signal retenant le logement à afficher dans le panneau de détails.
   * @type {WritableSignal<Unit | null>}
   */
  readonly activeUnitForDetail: WritableSignal<Unit | null> = signal<Unit | null>(null);

  /**
   * Signal calculé : Indique si au moins un logement de la liste est actif.
   * @type {Signal<boolean>}
   */
  readonly hasActiveUnits: Signal<boolean> = computed<boolean>(() => {
    return this.units().some((u: Unit) => u.is_active);
  });

  /**
   * Signal calculé : Indique si la totalité des logements de la liste est active.
   * @type {Signal<boolean>}
   */
  readonly areAllUnitsActive: Signal<boolean> = computed<boolean>(() => {
    const list: Unit[] = this.units();
    return list.length > 0 && list.every((u: Unit) => u.is_active);
  });

  /**
   * Getter de commodité pour vérifier l'état de chargement.
   * @returns {boolean} État de chargement.
   */
  get isLoading(): boolean {
    return this.loading();
  }

  /**
   * Cycle de vie Angular : Initialisation du composant et chargement initial.
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    await this.loadUnits();
  }

  /**
   * Récupère la liste des logements auprès du backend et applique un tri naturel
   * alphanumérique sur le champ `unit_number` (ex: 1, 2, 3... 101, 102).
   * @returns {Promise<void>}
   */
  async loadUnits(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const data: Unit[] = await this.unitService.getUnits(this.propertyId);

      // Tri naturel sur 'unit_number'
      const sortedUnits: Unit[] = [...data].sort((a: Unit, b: Unit) => {
        const numA: string = a.unit_number ?? '';
        const numB: string = b.unit_number ?? '';

        return numA.localeCompare(numB, undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      });

      this.units.set(sortedUnits);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : 'Erreur lors du chargement des logements.';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Sélectionne un logement pour en afficher la vue détaillée.
   * @param {Unit | string} unitOrId - L'objet Unit ou l'identifiant unique du logement.
   * @returns {void}
   */
  onSelectUnit(unitOrId: Unit | string): void {
    if (typeof unitOrId === 'string') {
      const targetUnit: Unit | undefined = this.units().find((u: Unit) => u.id === unitOrId);
      if (targetUnit) {
        this.activeUnitForDetail.set(targetUnit);
      }
    } else {
      this.activeUnitForDetail.set(unitOrId);
    }
  }

  /**
   * Ferme le panneau de détail et rafraîchit la liste des logements.
   * @returns {Promise<void>}
   */
  async onCloseDetail(): Promise<void> {
    this.activeUnitForDetail.set(null);
    await this.loadUnits();
  }

  /**
   * Ouvre la modale en mode création d'un nouveau logement.
   * @returns {void}
   */
  openCreateModal(): void {
    this.selectedUnit.set(null);
    this.showModal.set(true);
  }

  /**
   * Ouvre la modale en mode édition pour un logement existant.
   * @param {Unit} unit - Le logement à éditer.
   * @returns {void}
   */
  openEditModal(unit: Unit): void {
    this.selectedUnit.set(unit);
    this.showModal.set(true);
  }

  /**
   * Gère la fermeture de la modale et déclenche le rafraîchissement si nécessaire.
   * @param {boolean} [shouldRefresh=false] - Indique si une modification nécessite un rechargement.
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

  /**
   * Affiche un message de notification temporaire (Toast) à l'écran.
   * @param {string} text - Contenu du message.
   * @param {'success' | 'error'} type - Type visuel de la notification.
   * @private
   * @returns {void}
   */
  private showNotification(text: string, type: 'success' | 'error'): void {
    this.notificationMessage.set({ text, type });
    setTimeout(() => {
      this.notificationMessage.set(null);
    }, 4000);
  }

  /**
   * Bascule le statut d'activité (actif/inactif) d'un logement individuel.
   * @param {Unit | { unit: Unit; active: boolean }} payload - Objet Unit ou événement contenant le nouveau statut.
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
   * Supprime un logement après confirmation de l'utilisateur.
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
}