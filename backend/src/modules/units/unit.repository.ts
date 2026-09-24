import { Unit, CreateUnitInput, UpdateUnitInput } from './unit.types.js';
import { db } from '../../config/database.js';

/**
 * @class UnitRepository
 * @description Couche d'accès aux données (DAL) pour la table `units`.
 */
export class UnitRepository {
  /**
   * Récupère l'intégralité des logements enregistrés.
   */
  async findAll(): Promise<Unit[]> {
    const query = 'SELECT * FROM units ORDER BY created_at DESC';
    const { rows } = await db.query<Unit>(query);
    return rows;
  }

  /**
   * Récupère tous les logements rattachés à une propriété.
   */
  async findByPropertyId(propertyId: string): Promise<Unit[]> {
    const query = 'SELECT * FROM units WHERE property_id = $1 ORDER BY name ASC';
    const { rows } = await db.query<Unit>(query, [propertyId]);
    return rows;
  }

  /**
   * Recherche un logement par son identifiant unique.
   */
  async findById(id: string): Promise<Unit | null> {
    const query = 'SELECT * FROM units WHERE id = $1';
    const { rows } = await db.query<Unit>(query, [id]);
    return rows[0] || null;
  }

  /**
   * Vérifie les doublons de nom pour une même propriété.
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
      query += ' AND id != $3';
      values.push(excludeId);
    }

    const { rows } = await db.query<Unit>(query, values);
    return rows[0] || null;
  }

  /**
   * Insère un logement en base de données.
   */
  async create(data: CreateUnitInput): Promise<Unit> {
    const query = `
      INSERT INTO units (
        property_id, 
        unit_number, 
        name, 
        type, 
        capacity,
        floor, 
        surface, 
        rent_amount, 
        charges_amount, 
        is_occupied,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      data.property_id,
      data.unit_number,
      data.name,
      data.type,
      data.capacity ?? 2,
      data.floor ?? 0,
      data.surface ?? 0,
      data.rent_amount ?? 0,
      data.charges_amount ?? 0,
      data.is_occupied ?? false,
      data.is_active ?? true
    ];

    const { rows } = await db.query<Unit>(query, values);
    return rows[0];
  }

  /**
   * Met à jour un logement existant avec gestion de tous les champs (dont name, capacity et is_active).
   */
  async update(id: string, data: UpdateUnitInput): Promise<Unit | null> {
    const query = `
      UPDATE units
      SET name = COALESCE($1, name),
          type = COALESCE($2, type),
          unit_number = COALESCE($3, unit_number),
          capacity = COALESCE($4, capacity),
          floor = COALESCE($5, floor),
          surface = COALESCE($6, surface),
          rent_amount = COALESCE($7, rent_amount),
          charges_amount = COALESCE($8, charges_amount),
          is_occupied = COALESCE($9, is_occupied),
          is_active = COALESCE($10, is_active)
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      data.name ?? null,
      data.type ?? null,
      data.unit_number ?? null,
      data.capacity ?? null,
      data.floor ?? null,
      data.surface ?? null,
      data.rent_amount ?? null,
      data.charges_amount ?? null,
      data.is_occupied ?? null,
      data.is_active ?? null,
      id
    ];

    const { rows } = await db.query<Unit>(query, values);
    return rows[0] || null;
  }

  /**
   * Supprime un logement par son identifiant.
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM units WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}