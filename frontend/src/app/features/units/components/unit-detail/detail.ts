import { Component, Input, Output, EventEmitter, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnitService } from '../../services/unit';
import { Unit } from '../../models/unit';
import { UnitModalComponent } from '../unit-modal/modal';

/**
 * @component UnitDetailComponent
 * @description Composant gérant l'affichage détaillé d'un logement et sa navigation par onglets métiers.
 */
@Component({
  selector: 'app-unit-detail',
  standalone: true,
  imports: [CommonModule, UnitModalComponent],
  templateUrl: './detail.html',
  styleUrl: './detail.scss'
})
export class UnitDetailComponent implements OnInit {
  private readonly unitService: UnitService = inject(UnitService);

  /** Identifiant unique du logement à consulter */
  @Input({ required: true }) unitId!: string;

  /** Événement émis pour revenir à la vue précédente */
  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  /** Événement émis lorsque des modifications sont enregistrées */
  @Output() saved: EventEmitter<void> = new EventEmitter<void>();

  readonly unit: WritableSignal<Unit | null> = signal<Unit | null>(null);
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);
  readonly error: WritableSignal<string | null> = signal<string | null>(null);
  readonly activeTab: WritableSignal<'overview' | 'sync' | 'checklists' | 'billing' | 'welcome'> = signal('overview');
  readonly showModal: WritableSignal<boolean> = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    await this.loadUnit();
  }

  async loadUnit(): Promise<void> {
    if (!this.unitId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const data: Unit | undefined = await this.unitService.getUnitById(this.unitId);
      if (data) {
        this.unit.set(data);
      } else {
        this.error.set('Logement introuvable.');
      }
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : 'Erreur lors du chargement des détails.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  setTab(tab: 'overview' | 'sync' | 'checklists' | 'billing' | 'welcome'): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.back.emit();
  }

  openEditModal(): void {
    this.showModal.set(true);
  }

  async onModalClosed(shouldRefresh: boolean = false): Promise<void> {
    this.showModal.set(false);
    if (shouldRefresh) {
      await this.loadUnit();
      this.saved.emit();
    }
  }
}