import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Unit } from '../../models/unit';
import { UiButtonComponent } from '../../../../shared';
/**
 * @component UnitCardComponent
 * @description Composant d'affichage synthétique d'un logement sous forme de carte interactive.
 */
@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './card.html',
  styleUrl: './card.scss'
})
export class UnitCardComponent {
  /**
   * Logement à afficher dans la carte.
   * @input
   * @required
   */
  @Input({ required: true }) unit!: Unit;

  /**
   * Événement émis lors de la sélection du logement (transmet l'ID du logement sous forme de string).
   * @output
   */
  @Output() selectUnit: EventEmitter<string> = new EventEmitter<string>();

  /**
   * Événement émis pour basculer le statut actif/inactif (transmet l'unité et le nouvel état désiré).
   * @output
   */
  @Output() toggleStatus: EventEmitter<{ unit: Unit; active: boolean }> = new EventEmitter<{ unit: Unit; active: boolean }>();

  /**
   * @method onSelect
   * @description Déclenche la sélection du logement et stoppe la propagation du clic vers le composant parent.
   * @param {MouseEvent | Event} event Événement DOM du clic.
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
   * @method onToggleStatus
   * @description Modifie le statut d'activation sans déclencher la sélection de la carte ni la propagation vers le parent.
   * @param {MouseEvent | Event} event Événement DOM du clic.
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