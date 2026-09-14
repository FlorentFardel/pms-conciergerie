/**
 * @file property.types.ts
 * @description Interfaces, types et DTOs pour le module des propriétés côté backend.
 */

/**
 * Représente l'entité Property telle qu'enregistrée en base de données.
 */
export interface Property {
  /** Identifiant unique (UUID) */
  id: string;
  /** Nom du bâtiment ou du bien */
  name: string;
  /** Adresse postale */
  address: string;
  /** Ville */
  city: string;
  /** Code postal */
  postal_code: string;
  /** Statut d'activation dans le système */
  is_active: boolean;
  /** Horodatage de création */
  created_at: Date | string;
}

/**
 * Structure des données requises pour la création d'une propriété.
 */
export interface CreatePropertyInput {
  name: string;
  address: string;
  city: string;
  postal_code: string;
}

/**
 * Structure des données partielles pour la mise à jour d'une propriété.
 */
export interface UpdatePropertyInput {
  name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  is_active?: boolean; /* <-- Champ ajouté ici */
}