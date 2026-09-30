/**
 * @file booking.route.ts
 * @description Déclaration des routes HTTP pour le module booking.
 */

import { Router } from 'express';
import {
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking
} from './booking.controller';

const router = Router();

router.get('/', getAllBookings);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;