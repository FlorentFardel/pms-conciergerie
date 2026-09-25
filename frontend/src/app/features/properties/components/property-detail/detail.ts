import { Component, OnInit, Input, Output, EventEmitter, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property';
import { UnitsListComponent } from '../../../units/components/units-list/list';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal'; // Ajuste le chemin selon ton arborescence
/**
 * @component PropertyDetailComponent
 * @description Composant dédié à la consultation d'une propriété spécifique et à l'encapsulation de sa liste de logements.
 */
@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, UnitsListComponent,UiButtonComponent],
  templateUrl: './detail.html',
  styleUrl: './detail.scss'
})
export class PropertyDetailComponent implements OnInit {
  private readonly propertyService: PropertyService = inject(PropertyService);

  /** Identifiant ou slug de la propriété à afficher */
  @Input({ required: true }) propertyId!: string;

  /** Événement émis pour retourner à la liste globale des propriétés */
  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  /** Propriété active chargée */
  readonly property: WritableSignal<Property | null> = signal<Property | null>(null);

  /** État de chargement asynchrone */
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);

  /** Message d'erreur éventuel */
  readonly error: WritableSignal<string | null> = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadPropertyDetails();
  }

  /**
   * Charge les données de la propriété cible via le service.
   */
  async loadPropertyDetails(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const found: Property | undefined = this.propertyService.getPropertyBySlugOrId(this.propertyId);
      if (found) {
        this.property.set(found);
      } else {
        this.error.set('Propriété introuvable.');
      }
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : 'Erreur lors du chargement de la propriété.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Déclenche la remontée vers la vue liste des propriétés.
   */
  goBack(): void {
    this.back.emit();
  }
}