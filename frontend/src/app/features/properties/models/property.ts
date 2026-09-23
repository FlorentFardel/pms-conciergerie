import { Unit } from '../../units/models/unit';

/**
 * @interface Property
 * @description Modèle de données représentant une propriété immobilière côté frontend.
 */
export interface Property {
  /** Identifiant unique UUID en base de données */
  id: string;
  /** Slug lisible et sécurisé pour l'URL (ex: residence-les-fleurs) */
  slug: string;
  /** Nom du bâtiment ou de la résidence */
  name: string;
  /** Adresse postale physique */
  address: string;
  /** Ville d'implantation */
  city: string;
  /** Code postal */
  postal_code: string;
  /** Indique si le bien est actif et ouvert à la gestion */
  is_active: boolean;
  /** Date de création enregistrée au format ISO */
  created_at: string;
  /** Liste optionnelle des logements/chambres rattachés */
  units?: Unit[];
}

/**
 * @interface CreatePropertyDto
 * @description Structure des données requises pour créer un bien immobilier.
 */
export interface CreatePropertyDto {
  name: string;
  address: string;
  city: string;
  postal_code: string;
}

/**
 * @type UpdatePropertyDto
 * @description Structure partielle pour la mise à jour des informations d'une propriété.
 */
export type UpdatePropertyDto = Partial<CreatePropertyDto> & {
  is_active?: boolean;
};