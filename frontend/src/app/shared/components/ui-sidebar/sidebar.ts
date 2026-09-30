/**
 * @file sidebar.ts
 * @description Composant de navigation latérale réutilisable et rétractable (menu Hamburger).
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Élément de navigation pour la barre latérale.
 */
export interface NavItem {
  /** Label affiché */
  label: string;
  /** Route Angular */
  route: string;
  /** Icône ou emoji d'illustration */
  icon: string;
}

/**
 * @component UiSidebarComponent
 * @description Sidebar principale de l'application avec mode compact/déplié.
 */
@Component({
  selector: 'app-ui-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class UiSidebarComponent {
  /** État d'ouverture du volet latéral (vrai = ouvert, faux = réduit) */
  readonly isOpen = signal<boolean>(true);

  /** Liste des rubriques de navigation principales */
  readonly navItems: NavItem[] = [
    { label: 'Planning', route: '/calendar', icon: '📅' },
    { label: 'Propriétés', route: '/properties', icon: '🏢' },
    { label: 'Réservations', route: '/bookings', icon: '📖' },
    { label: 'Synchronisation', route: '/sync', icon: '🔄' },
    { label: 'Paramètres', route: '/settings', icon: '⚙️' }
  ];

  /**
   * Bascule l'état d'ouverture du menu latéral.
   */
  toggleSidebar(): void {
    this.isOpen.update(prev => !prev);
  }
}