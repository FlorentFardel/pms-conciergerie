/**
 * @file property.model.ts
 * @description Modèles de données et DTOs pour le module des propriétés immobilières.
 */

/**
 * Représente l'entité complète d'une propriété immobilière.
 */
export interface Property {
  /** Identifiant unique (UUID) de la propriété */
  id: string;
  /** Nom du bâtiment ou de la résidence */
  name: string;
  /** Adresse postale (rue, numéro) */
  address: string;
  /** Ville */
  city: string;
  /** Code postal */
  postal_code: string;
  /** Indique si la propriété est active dans le système */
  is_active?: boolean;
  /** Date d'enregistrement de la propriété (format ISO) */
  created_at?: string;
}

/**
 * Données requises pour la création d'une nouvelle propriété.
 */
export interface CreatePropertyDto {
  /** Nom du bâtiment ou de la résidence */
  name: string;
  /** Adresse postale */
  address: string;
  /** Ville */
  city: string;
  /** Code postal */
  postal_code: string;
}

/**
 * Données partielles pour la mise à jour d'une propriété existante.
 */
export interface UpdatePropertyDto {
  /** Nom du bâtiment ou de la résidence */
  name?: string;
  /** Adresse postale */
  address?: string;
  /** Ville */
  city?: string;
  /** Code postal */
  postal_code?: string;
}