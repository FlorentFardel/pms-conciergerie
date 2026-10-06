import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Unit } from '../../models/unit';
import { UiButtonComponent } from '../../../../shared';

/**
 * @file card.ts
 * @module Features/Units/Components/UnitCard
 * @description Composant d'affichage synthétique d'un logement sous forme de carte interactive.
 * @architecture Enterprise Pattern - Presentational Component (Dumb)
 */
@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitCardComponent {
  /** Logement à afficher dans la carte */
  @Input({ required: true }) unit!: Unit;

  /** Événement émis lors de la sélection du logement (ID du logement) */
  @Output() selectUnit = new EventEmitter<string>();

  /** Événement émis pour basculer le statut actif/inactif */
  @Output() toggleStatus = new EventEmitter<{ unit: Unit; active: boolean }>();

  /**
   * Déclenche la sélection du logement.
   * 
   * @param {MouseEvent | Event} event - Événement DOM du clic.
   * @returns {void}
   */
  onSelect(event: MouseEvent | Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.selectUnit.emit(this.unit.id);
  }

  /**
   * Modifie le statut d'activation.
   * 
   * @param {MouseEvent | Event} event - Événement DOM du clic.
   * @returns {void}
   */
  onToggleStatus(event: MouseEvent | Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.toggleStatus.emit({
      unit: this.unit,
      active: !this.unit.is_active
    });
  }
}