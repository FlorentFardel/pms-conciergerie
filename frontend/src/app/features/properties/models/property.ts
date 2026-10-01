/**
 * @file property.ts
 * @module Features/Properties/Models
 * @description Définitions des interfaces et types DTO pour la gestion des propriétés immobilières (bâtiments).
 */

import { Unit } from '../../units/models/unit';

/**
 * Représente une propriété immobilière (bâtiment, résidence) en base de données PostgreSQL.
 */
export interface Property {
  /** Identifiant unique UUID généré par PostgreSQL */
  id: string;

  /** Slug lisible et sécurisé généré pour les URL (ex: "residence-les-fleurs" ou "nain") */
  slug: string;

  /** Nom d'usage du bâtiment ou de la résidence */
  name: string;

  /** Adresse postale physique */
  address: string;

  /** Ville d'implantation */
  city: string;

  /** Code postal français (5 chiffres) */
  postal_code: string;

  /** Indique si la propriété est active et disponible à la location */
  is_active: boolean;

  /** Horodatage de création au format ISO 8601 UTC */
  created_at: string;

  /** Liste optionnelle des logements/chambres rattachés à cette propriété */
  units?: Unit[];
}

/**
 * Données requises pour l'émission d'une requête POST de création de propriété.
 */
export interface CreatePropertyDto {
  /** Nom d'usage du bâtiment */
  name: string;

  /** Adresse postale physique */
  address: string;

  /** Ville d'implantation */
  city: string;

  /** Code postal (5 chiffres) */
  postal_code: string;
}

/**
 * Structure partielle pour la mise à jour des informations d'une propriété via l'API (PATCH/PUT).
 */
export type UpdatePropertyDto = Partial<CreatePropertyDto> & {
  /** Statut d'activation de la propriété (optionnel) */
  is_active?: boolean;
};