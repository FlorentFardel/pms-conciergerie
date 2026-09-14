import { Unit, CreateUnitInput, UpdateUnitInput } from './unit.types.js';
import { db } from '../../config/database.js';
/**
 * @class UnitRepository
 * @description Couche d'accès aux données (DAL) pour la table `units`.
 * Exécute l'ensemble des requêtes SQL (PostgreSQL/Node-Postgres).
 */
export class UnitRepository {
  /**
   * @method findAll
   * @description Récupère l'intégralité des logements enregistrés.
   * @returns {Promise<Unit[]>} Liste des logements.
   */
  async findAll(): Promise<Unit[]> {
    const query = 'SELECT * FROM units ORDER BY created_at DESC';
    const { rows } = await db.query<Unit>(query);
    return rows;
  }

  /**
   * @method findByPropertyId
   * @description Récupère tous les logements rattachés à une propriété spécifique.
   * @param {string} propertyId - Identifiant UUID de la propriété parente.
   * @returns {Promise<Unit[]>} Liste des logements liés.
   */
  async findByPropertyId(propertyId: string): Promise<Unit[]> {
    const query = 'SELECT * FROM units WHERE property_id = $1 ORDER BY name ASC';
    const { rows } = await db.query<Unit>(query, [propertyId]);
    return rows;
  }

  /**
   * @method findById
   * @description Recherche un logement par son identifiant unique.
   * @param {string} id - Identifiant UUID du logement.
   * @returns {Promise<Unit | null>} Le logement trouvé ou `null`.
   */
  async findById(id: string): Promise<Unit | null> {
    const query = 'SELECT * FROM units WHERE id = $1';
    const { rows } = await db.query<Unit>(query, [id]);
    return rows[0] || null;
  }

  /**
   * @method findDuplicateByName
   * @description Vérifie si un logement porte déjà le même nom au sein d'une MÊME propriété.
   * @param {string} propertyId - Identifiant de la propriété.
   * @param {string} name - Nom du logement (ex: "Chambre 101").
   * @param {string} [excludeId] - Identifiant du logement à exclure en cas de mise à jour.
   * @returns {Promise<Unit | null>} Le logement trouvé en doublon ou `null`.
   */
  async findDuplicateByName(
    propertyId: string, 
    name: string, 
    excludeId?: string
  ): Promise<Unit | null> {
    let query = `
      SELECT * FROM units 
      WHERE property_id = $1 
        AND LOWER(TRIM(name)) = LOWER(TRIM($2))
    `;
    const values: unknown[] = [propertyId, name];

    if (excludeId) {
      query += ` AND id != $3`;
      values.push(excludeId);
    }

    const { rows } = await db.query<Unit>(query, values);
    return rows[0] || null;
  }

  /**
   * @method create
   * @description Insère un nouveau logement en base de données.
   * @param {CreateUnitInput} data - Données du logement à créer.
   * @returns {Promise<Unit>} Le logement créé.
   */
  async create(data: CreateUnitInput): Promise<Unit> {
    const query = `
      INSERT INTO units (property_id, name, type, capacity)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.property_id, data.name, data.type, data.capacity];
    const { rows } = await db.query<Unit>(query, values);
    return rows[0];
  }

  /**
   * @method update
   * @description Met à jour un logement existant.
   * @param {string} id - Identifiant du logement.
   * @param {UpdateUnitInput} data - Champs à modifier.
   * @returns {Promise<Unit | null>} Le logement mis à jour ou `null`.
   */
  async update(id: string, data: UpdateUnitInput): Promise<Unit | null> {
    const query = `
      UPDATE units
      SET name = COALESCE($1, name),
          type = COALESCE($2, type),
          capacity = COALESCE($3, capacity),
          is_active = COALESCE($4, is_active)
      WHERE id = $5
      RETURNING *
    `;
    const values = [data.name, data.type, data.capacity, data.is_active, id];
    const { rows } = await db.query<Unit>(query, values);
    return rows[0] || null;
  }

  /**
   * @method delete
   * @description Supprime un logement par son identifiant.
   * @param {string} id - Identifiant du logement.
   * @returns {Promise<boolean>} `true` si la suppression a été effectuée.
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM units WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}