import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @file modal.ts
 * @module Shared/Components/UiFormField
 * @description Composant UI atomique du Design System encapsulant un label 
 * et appliquant le style global (Slate) aux champs <input> projetés.
 */
@Component({
  selector: 'app-ui-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  encapsulation: ViewEncapsulation.None
})
export class UiFormFieldComponent {
  /** Intitulé du champ (ex: "Nom du bâtiment") */
  @Input({ required: true }) label: string = '';

  /** Affiche l'astérisque rouge si le champ est obligatoire */
  @Input() required: boolean = false;
}