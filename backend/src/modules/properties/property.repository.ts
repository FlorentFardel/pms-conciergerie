import { db } from '../../config/database.js';
import { Property, CreatePropertyInput, UpdatePropertyInput } from './property.types.js';

/**
 * @class PropertyRepository
 * @description Couche d'accès aux données (DAL) pour la table `properties`.
 */
export class PropertyRepository {
  /**
   * Récupère la liste complète des propriétés avec leurs logements rattachés.
   */
  async findAll(): Promise<Property[]> {
    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            u.* 
            ORDER BY 
              u.created_at ASC,
              CAST(NULLIF(regexp_replace(u.unit_number, '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST
          ) FILTER (WHERE u.id IS NOT NULL), 
          '[]'
        ) AS units
      FROM properties p
      LEFT JOIN units u ON u.property_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;
    const { rows } = await db.query<Property>(query);
    return rows;
  }

  /**
   * Recherche une propriété par son identifiant unique UUID.
   */
  async findById(id: string): Promise<Property | null> {
    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            u.* 
            ORDER BY 
              u.created_at ASC,
              CAST(NULLIF(regexp_replace(u.unit_number, '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST
          ) FILTER (WHERE u.id IS NOT NULL), 
          '[]'
        ) AS units
      FROM properties p
      LEFT JOIN units u ON u.property_id = p.id
      WHERE p.id = $1
      GROUP BY p.id;
    `;
    const { rows } = await db.query<Property>(query, [id]);
    return rows[0] || null;
  }

  /**
   * Recherche une propriété par son slug lisible.
   */
  async findBySlug(slug: string): Promise<Property | null> {
    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            u.* 
            ORDER BY 
              u.created_at ASC,
              CAST(NULLIF(regexp_replace(u.unit_number, '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST
          ) FILTER (WHERE u.id IS NOT NULL), 
          '[]'
        ) AS units
      FROM properties p
      LEFT JOIN units u ON u.property_id = p.id
      WHERE p.slug = $1
      GROUP BY p.id;
    `;
    const { rows } = await db.query<Property>(query, [slug]);
    return rows[0] || null;
  }

  /**
   * Vérifie l'existence d'un doublon sur l'ensemble adresse / code postal / ville.
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
   * Insère une nouvelle propriété en générant automatiquement son slug.
   */
  async create(data: CreatePropertyInput): Promise<Property> {
    const query = `
      INSERT INTO properties (name, slug, address, city, postal_code)
      VALUES (
        $1::text, 
        COALESCE($2::text, generate_slug($1::text)), 
        $3::text, 
        $4::text, 
        $5::text
      )
      RETURNING *, '[]'::json AS units
    `;
    const values = [data.name, data.slug ?? null, data.address, data.city, data.postal_code];
    const { rows } = await db.query<Property>(query, values);
    return rows[0];
  }

  /**
   * Met à jour une propriété existante et recalcule le slug si le nom change.
   */
  async update(id: string, data: UpdatePropertyInput): Promise<Property | null> {
    const query = `
      UPDATE properties
      SET name = COALESCE($1::text, name),
          slug = CASE 
            WHEN $1::text IS NOT NULL THEN generate_slug($1::text)
            ELSE COALESCE($2::text, slug)
          END,
          address = COALESCE($3::text, address),
          city = COALESCE($4::text, city),
          postal_code = COALESCE($5::text, postal_code),
          is_active = COALESCE($6::boolean, is_active)
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      data.name ?? null, 
      data.slug ?? null, 
      data.address ?? null, 
      data.city ?? null, 
      data.postal_code ?? null, 
      data.is_active ?? null, 
      id
    ];
    
    const { rows } = await db.query<Property>(query, values);
    if (!rows[0]) return null;

    return this.findById(id);
  }

  /**
   * Supprime une propriété par son identifiant.
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM properties WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}