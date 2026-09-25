import { Component, input, InputSignal, output, OutputEmitterRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Type restreint pour les variantes de boutons */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

/** Type restreint pour les tailles de boutons */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Type restreint pour les types HTML natifs du bouton */
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * @file modal.ts
 * @module Shared/Components/UiButton
 * @description Composant UI atomique du Design System encapsulant les boutons de l'application.
 */
@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiButtonComponent {
  /** Variante visuelle du bouton */
  readonly variant: InputSignal<ButtonVariant> = input<ButtonVariant>('primary');

  /** Taille du bouton ('sm', 'md', 'lg') */
  readonly size: InputSignal<ButtonSize> = input<ButtonSize>('md');

  /** Type HTML natif du bouton */
  readonly type: InputSignal<ButtonType> = input<ButtonType>('button');

  /** Indique si le bouton est désactivé */
  readonly disabled: InputSignal<boolean> = input<boolean>(false);

  /** Indique si le bouton est en état de chargement */
  readonly loading: InputSignal<boolean> = input<boolean>(false);

  /** ID du formulaire rattaché */
  readonly form: InputSignal<string | undefined> = input<string | undefined>(undefined);

  /** Événement émis lors du clic */
  readonly clicked: OutputEmitterRef<MouseEvent> = output<MouseEvent>();

  /** Gestionnaire de clic interne */
  handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}