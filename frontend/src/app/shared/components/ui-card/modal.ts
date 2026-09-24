import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @component UiCardComponent
 * @description Conteneur de carte réutilisable garantissant la cohérence visuelle des cartes de l'application.
 */
@Component({
  selector: 'app-ui-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class UiCardComponent {
  /** Titre optionnel de la carte */
  @Input() title?: string;
}