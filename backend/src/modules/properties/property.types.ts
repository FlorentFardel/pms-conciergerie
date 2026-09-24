/**
 * @file property.types.ts
 * @description Interfaces, types et DTOs pour le module des propriétés côté backend.
 */

import { Unit } from '../unit/unit.types.js';

/**
 * @interface Property
 * @description Représente l'entité Property telle qu'enregistrée en base de données PostgreSQL.
 */
export interface Property {
  /** Identifiant unique (UUID v4) */
  id: string;

  /** Slug lisible pour la navigation et les URLs (ex: 'residence-les-fleurs') */
  slug: string;

  /** Nom du bâtiment ou du bien */
  name: string;

  /** Adresse postale principale */
  address: string;

  /** Ville de localisation */
  city: string;

  /** Code postal */
  postal_code: string;

  /** Statut d'activation dans le système PMS */
  is_active: boolean;

  /** Horodatage de création au format ISO ou Date */
  created_at: Date | string;

  /** Liste optionnelle des logements rattachés à cette propriété (issue des jointures) */
  units?: Unit[];
}

/**
 * @interface CreatePropertyInput
 * @description Structure des données requises pour la création d'une nouvelle propriété.
 */
export interface CreatePropertyInput {
  /** Nom du bâtiment ou du bien */
  name: string;

  /** 
   * Slug optionnel si pré-généré par le client, 
   * sinon calculé automatiquement par la fonction PostgreSQL `generate_slug()`
   */
  slug?: string;

  /** Adresse postale principale */
  address: string;

  /** Ville de localisation */
  city: string;

  /** Code postal */
  postal_code: string;
}

/**
 * @interface UpdatePropertyInput
 * @description Structure des données partielles autorisées pour la mise à jour d'une propriété.
 */
export interface UpdatePropertyInput {
  /** Nom du bâtiment ou du bien */
  name?: string;

  /** Slug optionnel recalculé en cas de changement de nom */
  slug?: string;

  /** Adresse postale principale */
  address?: string;

  /** Ville de localisation */
  city?: string;

  /** Code postal */
  postal_code?: string;

  /** Statut d'activation dans le système PMS */
  is_active?: boolean;
}