/**
 * @file unit.types.ts
 * @description Interfaces et DTOs pour la gestion des logements/chambres (Units).
 */

/**
 * Représente un logement (Unit) en base de données.
 */
export interface Unit {
  /** Identifiant unique (UUID) */
  id: string;
  /** Identifiant de la propriété rattachée */
  property_id: string;
  /** Nom du logement (ex: "Chambre 101", "Appartement A") */
  name: string;
  /** Type de logement (ex: "Chambre", "Appartement", "Studio") */
  type: string;
  /** Capacité maximale d'occupants */
  capacity: number;
  /** Statut d'activation dans le système */
  is_active: boolean;
  /** Date de création */
  created_at: Date | string;
}

/**
 * Structure des données requises pour créer un logement.
 */
export interface CreateUnitInput {
  property_id: string;
  name: string;
  type: string;
  capacity: number;
}

/**
 * Structure des données partielles pour modifier un logement.
 */
export interface UpdateUnitInput {
  name?: string;
  type?: string;
  capacity?: number;
  is_active?: boolean;
}