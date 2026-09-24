import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @component UiModalComponent
 * @description Composant générique de fenêtre modale (overlay, conteneur défilant et boutons d'action).
 */
@Component({
  selector: 'app-ui-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class UiModalComponent {
  /** Titre affiché dans l'en-tête de la modale */
  @Input({ required: true }) title!: string;

  /** Sous-titre optionnel sous le titre */
  @Input() subtitle?: string;
  
  /** Événement émis lors de la fermeture (croix, overlay ou bouton annuler) */
  @Output() close = new EventEmitter<void>();

  /**
   * @method onClose
   * @description Émet l'événement de fermeture.
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * @method onOverlayClick
   * @description Gère le clic sur le fond assombri pour fermer la modale.
   */
  onOverlayClick(): void {
    this.onClose();
  }
}