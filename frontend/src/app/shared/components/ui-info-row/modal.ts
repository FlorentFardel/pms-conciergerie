import { 
  Component, 
  ElementRef, 
  Input, 
  OnChanges, 
  SimpleChanges, 
  ViewEncapsulation 
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @file modal.ts
 * @module Shared/Components/UiInfoRow
 * @description Composant UI atomique d'affichage Clé / Valeur.
 * Utilise l'API ElementRef native pour forcer le rendu du libellé directement dans le DOM.
 */
@Component({
  selector: 'app-ui-info-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  encapsulation: ViewEncapsulation.None
})
export class UiInfoRowComponent implements OnChanges {
  /** Intitulé du champ (ex: "NUMÉRO / RÉF.") */
  @Input({ required: true }) label: string = '';

  constructor(private el: ElementRef) {}

  /**
   * Forçage natif du texte dès la réception de la propriété @Input
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['label']) {
      this.updateNativeLabel();
    }
  }

  private updateNativeLabel(): void {
    // Sélectionne le span interne et injecte le texte directement en HTML natif
    const spanEl = this.el.nativeElement.querySelector('.info-label');
    if (spanEl) {
      spanEl.textContent = this.label;
    }
  }
}