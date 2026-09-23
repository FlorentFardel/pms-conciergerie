import { Property } from '../../properties/models/property';

/**
 * @file unit.ts
 * @description Modèles de données, interfaces et DTOs pour le module des logements (Units).
 */

/**
 * @interface Unit
 * @description Représente l'entité Logement côté frontend avec l'ensemble de ses attributs.
 */
export interface Unit {
  /** Identifiant unique UUID du logement */
  id: string;
  /** Identifiant de la propriété parente */
  property_id: string;
  /** Libellé ou nom personnalisé du logement (optionnel) */
  name?: string;
  /** Numéro ou nom de référence du logement (ex: 'Apt 101') */
  unit_number: string;
  /** Étage du logement */
  floor?: number;
  /** Superficie du logement en m² */
  surface?: number;
  /** Montant du loyer de base */
  rent_amount?: number;
  /** Montant des charges mensuelles */
  charges_amount?: number;
  /** Montant du dépôt de garantie / caution */
  deposit_amount?: number;
  /** Capacité d'accueil / nombre de personnes */
  capacity?: number;
  /** Type de bien ou d'hébergement (ex: 'studio', 'T2', 'chambre') */
  type?: string;
  /** Statut d'activation dans le PMS */
  is_active: boolean;
  /** Statut d'occupation actuel */
  is_occupied?: boolean;
  /** Statut opérationnel (ex: 'available', 'occupied', 'maintenance') */
  status?: string;
  /** Notes internes ou consignes spécifiques */
  notes?: string;
  /** Propriété parente associée (si jointe) */
  property?: Property;
  /** Horodatage de création au format ISO */
  created_at: string;
}

/**
 * @interface CreateUnitDto
 * @description Structure des données requises pour la création d'un logement individuel.
 */
export interface CreateUnitDto {
  property_id: string;
  /** Numéro du logement (supporte le nommage en camelCase et snake_case) */
  unit_number?: string;
  unitNumber?: string;
  name?: string;
  floor?: number;
  surface?: number;
  rent_amount?: number;
  charges_amount?: number;
  deposit_amount?: number;
  capacity?: number;
  type?: string;
  is_active?: boolean;
  is_occupied?: boolean;
  status?: string;
  notes?: string;
  /** Signature d'index pour tolérer d'éventuels champs spécifiques du formulaire */
  [key: string]: unknown;
}

/**
 * @interface BulkCreateUnitsDto
 * @description Structure des données pour la création en masse de logements.
 */
export interface BulkCreateUnitsDto {
  property_id: string;
  count: number;
  start_number?: number;
  start_index?: number;
  prefix?: string;
  type?: string;
  default_capacity?: number;
  [key: string]: unknown;
}

/**
 * @type UpdateUnitDto
 * @description Structure partielle pour la mise à jour des informations d'un logement.
 */
export type UpdateUnitDto = Partial<Omit<CreateUnitDto, 'property_id'>> & {
  is_active?: boolean;
};