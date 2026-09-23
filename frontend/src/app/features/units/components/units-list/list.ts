import { Component, OnInit, Input, inject, signal, computed, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnitService } from '../../services/unit';
import { Unit } from '../../models/unit';
import { UnitModalComponent } from '../unit-modal/modal';
import { UnitCardComponent } from '../unit-card/card';
import { UnitDetailComponent } from '../unit-detail/detail';

/**
 * @component UnitsListComponent
 * @description Composant autonome d'affichage, de gestion et d'actions globales sur les logements.
 */
@Component({
  selector: 'app-units-list',
  standalone: true,
  imports: [CommonModule, UnitModalComponent, UnitCardComponent, UnitDetailComponent],
  templateUrl: './list.html',
  styleUrl: './list.scss'
})
export class UnitsListComponent implements OnInit {
  private readonly unitService: UnitService = inject(UnitService);

  @Input() propertyId?: string;

  readonly units: WritableSignal<Unit[]> = signal<Unit[]>([]);
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);
  readonly errorMessage: WritableSignal<string | null> = signal<string | null>(null);
  readonly notificationMessage: WritableSignal<{ text: string; type: 'success' | 'error' } | null> = signal(null);

  readonly showModal: WritableSignal<boolean> = signal<boolean>(false);
  readonly selectedUnit: WritableSignal<Unit | null> = signal<Unit | null>(null);
  readonly activeUnitForDetail: WritableSignal<Unit | null> = signal<Unit | null>(null);

  readonly hasActiveUnits: Signal<boolean> = computed<boolean>(() => {
    return this.units().some((u: Unit) => u.is_active);
  });

  readonly areAllUnitsActive: Signal<boolean> = computed<boolean>(() => {
    const list: Unit[] = this.units();
    return list.length > 0 && list.every((u: Unit) => u.is_active);
  });

  get isLoading(): boolean {
    return this.loading();
  }

  async ngOnInit(): Promise<void> {
    await this.loadUnits();
  }

  async loadUnits(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const data: Unit[] = await this.unitService.getUnits(this.propertyId);
      this.units.set(data);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : 'Erreur lors du chargement des logements.';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

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

  async onCloseDetail(): Promise<void> {
    this.activeUnitForDetail.set(null);
    await this.loadUnits();
  }

  openCreateModal(): void {
    this.selectedUnit.set(null);
    this.showModal.set(true);
  }

  openEditModal(unit: Unit): void {
    this.selectedUnit.set(unit);
    this.showModal.set(true);
  }

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

  private showNotification(text: string, type: 'success' | 'error'): void {
    this.notificationMessage.set({ text, type });
    setTimeout(() => {
      this.notificationMessage.set(null);
    }, 4000);
  }

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