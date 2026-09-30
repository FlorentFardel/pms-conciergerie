/**
 * @file booking.controller.ts
 * @description Contrôleur HTTP pour la gestion des réservations et blocages.
 * Sécurise l'extraction des paramètres de requête Express.
 */

import { Request, Response } from 'express';
import { BookingService } from './booking.service';

const bookingService = new BookingService();

/**
 * Récupère la liste de toutes les réservations.
 * @param {Request} req - Requête HTTP Express.
 * @param {Response} res - Réponse HTTP Express.
 * @returns {Promise<void>}
 */
export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await bookingService.getAllBookings();
    res.json(bookings);
  } catch (error: any) {
    console.error('❌ Erreur getAllBookings :', error.message || error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des réservations' });
  }
};

/**
 * Enregistre une nouvelle réservation ou un blocage en BDD.
 * @param {Request} req - Requête HTTP Express contenant le DTO dans le corps.
 * @param {Response} res - Réponse HTTP Express.
 * @returns {Promise<void>}
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const created = await bookingService.createBooking(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('❌ Erreur createBooking :', error.message || error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de la réservation' });
  }
};

/**
 * Mettre à jour une réservation existante.
 * @param {Request} req - Requête HTTP Express contenant l'UUID en paramètre.
 * @param {Response} res - Réponse HTTP Express.
 * @returns {Promise<void>}
 */
export const updateBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    // Cast strict ou vérification pour garantir le type string
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      res.status(400).json({ message: 'Identifiant invalide' });
      return;
    }

    const updated = await bookingService.updateBooking(id, req.body);

    if (!updated) {
      res.status(404).json({ message: 'Réservation introuvable' });
      return;
    }

    res.json(updated);
  } catch (error: any) {
    console.error('❌ Erreur updateBooking :', error.message || error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
  }
};

/**
 * Supprime une réservation en BDD.
 * @param {Request} req - Requête HTTP Express contenant l'UUID en paramètre.
 * @param {Response} res - Réponse HTTP Express.
 * @returns {Promise<void>}
 */
export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    // Cast strict ou vérification pour garantir le type string
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      res.status(400).json({ message: 'Identifiant invalide' });
      return;
    }

    const success = await bookingService.deleteBooking(id);

    if (!success) {
      res.status(404).json({ message: 'Réservation introuvable' });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('❌ Erreur deleteBooking :', error.message || error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
};