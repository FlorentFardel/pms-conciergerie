import { Router } from 'express';
import { PropertyController } from './property.controller.js';

/**
 * @file property.routes.ts
 * @description Déclaration des routes HTTP pour la gestion des propriétés immobilières.
 * Redirige les requêtes entrantes vers les méthodes correspondantes du PropertyController.
 */

const router = Router();
const controller = new PropertyController();

/**
 * @route GET /api/properties
 * @description Récupère la liste complète des propriétés.
 */
router.get('/', controller.getAll);

/**
 * @route GET /api/properties/:id
 * @description Récupère les détails d'une propriété par son identifiant UUID.
 */
router.get('/:id', controller.getById);

/**
 * @route POST /api/properties
 * @description Crée une nouvelle propriété.
 */
router.post('/', controller.create);

/**
 * @route PUT /api/properties/:id
 * @description Met à jour une propriété existante.
 */
router.put('/:id', controller.update);

/**
 * @route DELETE /api/properties/:id
 * @description Supprime une propriété par son identifiant UUID.
 */
router.delete('/:id', controller.delete);

export default router;