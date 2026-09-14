import { db } from '../../config/database.js';
import { Property, CreatePropertyInput, UpdatePropertyInput } from './property.types.js';

/**
 * @class PropertyRepository
 * @description Couche d'accès aux données (DAL) pour la table `properties`.
 * Exécute l'ensemble des requêtes SQL (PostgreSQL/Node-Postgres).
 */
export class PropertyRepository {
  /**
   * @method findAll
   * @description Récupère la liste complète des propriétés triées par date de création descendante.
   * @returns {Promise<Property[]>} Liste des propriétés enregistrées.
   */
  async findAll(): Promise<Property[]> {
    const query = 'SELECT * FROM properties ORDER BY created_at DESC';
    const { rows } = await db.query<Property>(query);
    return rows;
  }

  /**
   * @method findById
   * @description Recherche une propriété par son identifiant unique.
   * @param {string} id - Identifiant UUID de la propriété.
   * @returns {Promise<Property | null>} La propriété correspondante ou `null` si introuvable.
   */
  async findById(id: string): Promise<Property | null> {
    const query = 'SELECT * FROM properties WHERE id = $1';
    const { rows } = await db.query<Property>(query, [id]);
    return rows[0] || null;
  }

  /**
   * @method findDuplicate
   * @description Vérifie l'existence d'un doublon sur l'ensemble adresse / code postal / ville (insensible à la casse et aux espaces).
   * @param {string} address - Adresse de la propriété.
   * @param {string} postal_code - Code postal.
   * @param {string} city - Ville.
   * @param {string} [excludeId] - Identifiant de la propriété à exclure du contrôle (en cas de mise à jour).
   * @returns {Promise<Property | null>} La propriété en doublon si elle existe, sinon `null`.
   */
  async findDuplicate(
    address: string, 
    postal_code: string, 
    city: string, 
    excludeId?: string
  ): Promise<Property | null> {
    let query = `
      SELECT * FROM properties 
      WHERE LOWER(TRIM(address)) = LOWER(TRIM($1)) 
        AND LOWER(TRIM(postal_code)) = LOWER(TRIM($2)) 
        AND LOWER(TRIM(city)) = LOWER(TRIM($3))
    `;
    const values: unknown[] = [address, postal_code, city];

    if (excludeId) {
      query += ` AND id != $4`;
      values.push(excludeId);
    }

    const { rows } = await db.query<Property>(query, values);
    return rows[0] || null;
  }

  /**
   * @method create
   * @description Insère une nouvelle propriété en base de données.
   * @param {CreatePropertyInput} data - Données du formulaire de création.
   * @returns {Promise<Property>} La propriété fraîchement créée.
   */
  async create(data: CreatePropertyInput): Promise<Property> {
    const query = `
      INSERT INTO properties (name, address, city, postal_code)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.name, data.address, data.city, data.postal_code];
    const { rows } = await db.query<Property>(query, values);
    return rows[0];
  }

  /**
   * @method update
   * @description Met à jour partiellement les informations d'une propriété existante.
   * @param {string} id - Identifiant de la propriété à modifier.
   * @param {UpdatePropertyInput} data - Champs à mettre à jour.
   * @returns {Promise<Property | null>} La propriété mise à jour ou `null` si non trouvée.
   */
  async update(id: string, data: UpdatePropertyInput): Promise<Property | null> {
    const query = `
      UPDATE properties
      SET name = COALESCE($1, name),
          address = COALESCE($2, address),
          city = COALESCE($3, city),
          postal_code = COALESCE($4, postal_code),
          is_active = COALESCE($5, is_active)
      WHERE id = $6
      RETURNING *
    `;
    const values = [data.name, data.address, data.city, data.postal_code, data.is_active, id];
    const { rows } = await db.query<Property>(query, values);
    return rows[0] || null;
  }

  /**
   * @method delete
   * @description Supprime la ligne correspondant à l'identifiant en base.
   * @param {string} id - Identifiant de la propriété.
   * @returns {Promise<boolean>} `true` si la suppression a affecté une ligne, sinon `false`.
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM properties WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}