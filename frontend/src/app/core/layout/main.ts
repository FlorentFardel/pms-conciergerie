/**
 * @file main.ts
 * @module Core/Layout
 * @description Layout principal (Shell) gérant la navigation latérale et le squelette de l'application.
 * Contient la logique d'interaction du menu réactif (Mobile & Desktop) et la fermeture au clic extérieur.
 */

import { Component, signal, HostListener, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { UiSidebarComponent } from '../../shared/components/ui-sidebar/sidebar';

/**
 * Composant racine du layout d'entreprise (Main Layout).
 */
@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UiSidebarComponent],
  templateUrl: './main.html',
  styleUrl: './main.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  /** Référence vers le nœud DOM du composant */
  private readonly elementRef = inject(ElementRef);

  /** État d'ouverture du volet de navigation sur Mobile */
  readonly isSidebarOpen = signal<boolean>(false);

  /**
   * Bascule l'état d'ouverture du menu latéral sur mobile.
   * 
   * @returns {void}
   */
  toggleSidebar(): void {
    this.isSidebarOpen.update((v) => !v);
  }

  /**
   * Ferme le menu latéral sur mobile.
   * 
   * @returns {void}
   */
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  /**
   * Écoute l'ensemble des clics sur le document HTML.
   * Sur grand écran (Desktop ≥1024px), si l'utilisateur clique en dehors de la barre latérale
   * alors que celle-ci est dépliée, elle se replie automatiquement en mode icônes.
   * 
   * @param {MouseEvent} event - L'événement de clic utilisateur.
   * @returns {void}
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (window.innerWidth >= 1024) {
      const target = event.target as HTMLElement;
      const sidebarEl = this.elementRef.nativeElement.querySelector('app-ui-sidebar');
      
      if (sidebarEl && !sidebarEl.contains(target)) {
        const sidebarAside = sidebarEl.querySelector('.sidebar-container');
        
        if (sidebarAside && !sidebarAside.classList.contains('is-collapsed')) {
          const btn = sidebarAside.querySelector('.hamburger-btn') as HTMLButtonElement | null;
          if (btn) btn.click();
        }
      }
    }
  }
}