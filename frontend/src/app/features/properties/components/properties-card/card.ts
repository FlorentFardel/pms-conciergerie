import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../models/property';
import { UnitService } from '../../../units/services/unit';

/**
 * @component PropertyCardComponent
 * @description Composant d'affichage synthétique et compact d'une propriété.
 */
@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.scss'
})
export class PropertyCardComponent {
  private readonly unitService = inject(UnitService);

  /** Propriété affichée par la carte */
  @Input({ required: true }) property!: Property;

  /** Événements émis vers le composant parent */
  @Output() selectProperty = new EventEmitter<Property>();
  @Output() edit = new EventEmitter<Property>();
  @Output() delete = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();
  
  /** Événement demandant l'ouverture de la modale de création d'un logement complet */
  @Output() createUnit = new EventEmitter<Property>();

  /**
   * Calcule le ratio de logements actifs (ex: "6/9 logements actifs" ou "0 logement").
   */
  get activeUnitsRatio(): string {
    const units = this.property.units || [];
    const total = units.length;

    if (total === 0) {
      return '0 logement';
    }

    const activeCount = units.filter(u => u.is_active).length;
    return `${activeCount}/${total} logement${total > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}`;
  }

  /**
   * Indique si au moins un logement est inactif pour adapter la couleur du badge.
   */
  get hasInactiveUnits(): boolean {
    const units = this.property.units || [];
    if (units.length === 0) return false;
    return units.some(u => !u.is_active);
  }

  onCardClick(): void {
    this.selectProperty.emit(this.property);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.property);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.property.id);
  }

  /**
   * Demande au composant parent d'ouvrir la modale de création complète de logement.
   */
  onAddSingleUnit(event: Event): void {
    event.stopPropagation();
    this.createUnit.emit(this.property);
  }

  /**
   * Génère par lot des logements.
   */
  async onBulkCreateUnits(event: Event): Promise<void> {
    event.stopPropagation();
    const input = prompt('Combien de logements souhaitez-vous générer pour cet immeuble ?', '5');
    if (!input) return;

    const count = parseInt(input, 10);
    if (isNaN(count) || count <= 0) return;

    const existingCount = this.property.units?.length || 0;
    const startIndex = existingCount + 1;

    try {
      await this.unitService.bulkCreateUnits({
        property_id: this.property.id,
        count,
        prefix: `Logement`, 
        default_capacity: 2,
        ...(startIndex > 1 ? { start_index: startIndex } : {})
      });

      this.refresh.emit();
    } catch (err: unknown) {
      console.error('Erreur génération par lot :', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la génération par lot.');
    }
  }
}