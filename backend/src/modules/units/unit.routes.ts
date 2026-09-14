import { Router } from 'express';
import { UnitController } from './unit.controller.js';

/**
 * @file unit.routes.ts
 * @description Déclaration des routes HTTP pour la gestion des logements (Units).
 * Redirige les requêtes vers le UnitController.
 */

const router = Router();
const controller = new UnitController();

/**
 * @route GET /api/units
 * @description Récupère tous les logements (supporte le paramètre de requête `?propertyId=xxx`).
 */
router.get('/', controller.getAll);

/**
 * @route GET /api/units/:id
 * @description Récupère les détails d'un logement par son identifiant UUID.
 */
router.get('/:id', controller.getById);

/**
 * @route POST /api/units
 * @description Crée un nouveau logement.
 */
router.post('/', controller.create);

/**
 * @route PUT /api/units/:id
 * @description Met à jour un logement existant.
 */
router.put('/:id', controller.update);

/**
 * @route DELETE /api/units/:id
 * @description Supprime un logement par son identifiant.
 */
router.delete('/:id', controller.delete);

export default router;