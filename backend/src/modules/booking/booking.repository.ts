/**
 * @file booking.repository.ts
 * @description Repository gérant la persistance des réservations PostgreSQL.
 * Aligné sur la valeur réelle de l'ENUM : 'MANUAL_BLOCK'.
 */

import { db } from '../../config/database';
import { Booking, CreateBookingDto } from './booking.type';

/**
 * Repository pour les opérations de persistance de la table bookings.
 */
export class BookingRepository {
  /**
   * Récupère l'ensemble des réservations et blocages enregistrés.
   * @returns {Promise<Booking[]>} Liste des réservations formatées.
   */
  async findAll(): Promise<Booking[]> {
    const query = `
      SELECT 
        b.id,
        b.unit_id,
        b.guest_id,
        COALESCE(b.block_reason, 'Réservation') AS "guestName",
        b.channel::text AS channel,
        b.status::text AS status,
        TO_CHAR(b.check_in, 'YYYY-MM-DD') AS check_in,
        TO_CHAR(b.check_out, 'YYYY-MM-DD') AS check_out,
        b.nightly_price,
        b.total_price,
        b.is_manual_entry,
        b.block_reason,
        b.notes
      FROM bookings b
      ORDER BY b.check_in ASC;
    `;
    const { rows } = await db.query(query);
    return rows;
  }

  /**
   * Insère une nouvelle réservation ou un blocage dans la table PostgreSQL.
   * @param {CreateBookingDto} dto - Données de la réservation transmises par le service.
   * @returns {Promise<Booking>} Réservation créée.
   */
  async create(dto: CreateBookingDto): Promise<Booking> {
    const query = `
      INSERT INTO bookings (
        unit_id, channel, status, check_in, check_out, total_price, is_manual_entry, block_reason, notes
      )
      VALUES (
        $1, 
        $2::booking_channel, 
        $3::booking_status, 
        $4, $5, $6, $7, $8, $9
      )
      RETURNING 
        id, unit_id, channel::text AS channel, status::text AS status, 
        TO_CHAR(check_in, 'YYYY-MM-DD') AS check_in, 
        TO_CHAR(check_out, 'YYYY-MM-DD') AS check_out, 
        total_price, is_manual_entry, block_reason, notes;
    `;

    // Mapping correct de 'MANUAL' vers la valeur réelle 'MANUAL_BLOCK' de la BDD
    let rawChannel = (dto.channel || 'MANUAL_BLOCK').toUpperCase();
    if (rawChannel === 'MANUAL') rawChannel = 'MANUAL_BLOCK';

    const rawStatus = (dto.status || 'CONFIRMED').toUpperCase();

    const values = [
      dto.unit_id,
      rawChannel,
      rawStatus,
      dto.check_in,
      dto.check_out,
      dto.total_price || 0,
      dto.is_manual_entry ?? true,
      dto.block_reason || dto.guestName || null,
      dto.notes || null
    ];

    const { rows } = await db.query(query, values);
    const created = rows[0];
    created.guestName = dto.guestName || created.block_reason || 'Réservation';
    return created;
  }

  /**
   * Met à jour une réservation existante.
   * @param {string} id - UUID de la réservation.
   * @param {Partial<CreateBookingDto>} dto - Champs à mettre à jour.
   * @returns {Promise<Booking | null>} Réservation mise à jour ou null si absente.
   */
  async update(id: string, dto: Partial<CreateBookingDto>): Promise<Booking | null> {
    const query = `
      UPDATE bookings
      SET 
        check_in = $1,
        check_out = $2,
        channel = $3::booking_channel,
        total_price = $4,
        block_reason = $5,
        notes = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING 
        id, unit_id, channel::text AS channel, status::text AS status, 
        TO_CHAR(check_in, 'YYYY-MM-DD') AS check_in, 
        TO_CHAR(check_out, 'YYYY-MM-DD') AS check_out, 
        total_price, is_manual_entry, block_reason, notes;
    `;

    let rawChannel = (dto.channel || 'MANUAL_BLOCK').toUpperCase();
    if (rawChannel === 'MANUAL') rawChannel = 'MANUAL_BLOCK';

    const values = [
      dto.check_in,
      dto.check_out,
      rawChannel,
      dto.total_price,
      dto.block_reason || dto.guestName || null,
      dto.notes || null,
      id
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;
    const updated = rows[0];
    updated.guestName = dto.guestName || updated.block_reason || 'Réservation';
    return updated;
  }

  /**
   * Supprime une réservation en BDD par son UUID.
   * @param {string} id - UUID de la réservation.
   * @returns {Promise<boolean>} Vrai si la suppression est confirmée.
   */
  async delete(id: string): Promise<boolean> {
    const { rowCount } = await db.query('DELETE FROM bookings WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}