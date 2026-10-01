/**
 * @file toolbar.ts
 * @description Barre d'outils et de navigation du planning (ViewMode, dates, aujourd'hui).
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewMode } from '../../models/timeline';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal';

@Component({
  selector: 'app-calendar-toolbar',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarToolbarComponent {
  /** Mode de vue actif ('day' | 'week' | '2weeks' | 'month' | 'quarter') */
  readonly viewMode = input.required<ViewMode>();

  /** Libellé de la période courante (ex: "Octobre 2026") */
  readonly currentRangeLabel = input.required<string>();

  /** Événement au changement de mode de vue */
  readonly viewModeChange = output<ViewMode>();

  /** Événement de navigation temporelle (-1 ou +1) */
  readonly navigate = output<number>();

  /** Événement de retour au jour courant */
  readonly today = output<void>();

  onSetViewMode(mode: ViewMode): void {
    this.viewModeChange.emit(mode);
  }

  onNavigate(direction: number): void {
    this.navigate.emit(direction);
  }

  onGoToToday(): void {
    this.today.emit();
  }
}