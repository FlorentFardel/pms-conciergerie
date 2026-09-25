import { Component, input, output, inject, OnInit, ChangeDetectionStrategy, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Unit } from '../../models/unit';
import { UnitService } from '../../services/unit';
import { UiCardComponent } from '../../../../shared/components/ui-card/modal';
import { UiInfoRowComponent } from '../../../../shared/components/ui-info-row/modal';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal';
import { UnitModalComponent } from '../unit-modal/modal';

/**
 * @file detail.ts
 * @module Features/Units/Components/UnitDetail
 * @description Vue détaillée d'un logement (Unit) avec navigation par onglets métiers et modale d'édition.
 */
@Component({
  selector: 'app-unit-detail',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    UiInfoRowComponent,
    UiButtonComponent,
    UnitModalComponent
  ],
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitDetailComponent implements OnInit {
  /** Service d'accès aux données des logements */
  private readonly unitService: UnitService = inject(UnitService);

  /** Identifiant du logement sélectionné (ou objet Unit) */
  readonly unitId = input<string | null>(null);

  /** Événement émis lors du retour à la liste */
  readonly back = output<void>();

  /** Signal d'état du logement chargé */
  readonly unit: WritableSignal<Unit | null> = signal<Unit | null>(null);

  /** Signal de chargement réseau */
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);

  /** Signal de message d'erreur */
  readonly error: WritableSignal<string | null> = signal<string | null>(null);

  /** Onglet actif ('overview' | 'sync' | 'checklists' | 'billing' | 'welcome') */
  readonly activeTab: WritableSignal<string> = signal<string>('overview');

  /** Contrôle de l'affichage de la modale d'édition */
  readonly showModal: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * Cycle de vie Angular : Initialisation et chargement des détails du logement.
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    await this.loadUnit();
  }

  /**
   * Recharge les données du logement depuis le backend.
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
   * Modifie l'onglet métier actif.
   * @param {string} tab - Identifiant de l'onglet.
   * @returns {void}
   */
  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  /**
   * Ouvre la modale d'édition.
   * @returns {void}
   */
  openEditModal(): void {
    this.showModal.set(true);
  }

  /**
   * Déclenche l'événement de retour vers la liste des logements.
   * @returns {void}
   */
  goBack(): void {
    this.back.emit();
  }

  /**
   * Gère la fermeture et le rafraîchissement après édition.
   * @param {boolean} shouldRefresh - Recharger les données si vrai.
   * @returns {Promise<void>}
   */
  async onModalClosed(shouldRefresh: boolean = false): Promise<void> {
    this.showModal.set(false);
    if (shouldRefresh) {
      await this.loadUnit();
    }
  }
}