import { Request, Response } from 'express';
import { UnitService } from './unit.service.js';

/**
 * @class UnitController
 * @description Contrôleur Express gérant les requêtes HTTP pour les logements (Units).
 */
export class UnitController {
  /** Service métier pour l'exécution des règles de gestion des logements */
  private readonly service = new UnitService();

  /**
   * @method getAll
   * @description Récupère la liste de tous les logements ou filtre par propriété si `propertyId` est fourni en query.
   * @route GET /api/units?propertyId=xxx
   * @param {Request} req - Requête Express.
   * @param {Response} res - Réponse Express.
   * @returns {Promise<void>}
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const propertyId = req.query['propertyId'] as string | undefined;
      const units = propertyId 
        ? await this.service.getUnitsByPropertyId(propertyId)
        : await this.service.getAllUnits();
      res.json(units);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des logements.';
      res.status(500).json({ message });
    }
  };

  /**
   * @method getById
   * @description Récupère un logement spécifique par son identifiant UUID.
   * @route GET /api/units/:id
   * @param {Request<{ id: string }>} req - Requête Express avec le paramètre `id`.
   * @param {Response} res - Réponse Express.
   * @returns {Promise<void>}
   */
  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const unit = await this.service.getUnitById(req.params.id);
      res.json(unit);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Logement introuvable.';
      res.status(404).json({ message });
    }
  };

  /**
   * @method create
   * @description Crée un nouveau logement pour une propriété.
   * @route POST /api/units
   * @param {Request} req - Requête Express avec les données du logement dans `body`.
   * @param {Response} res - Réponse Express avec le statut 201.
   * @returns {Promise<void>}
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const unit = await this.service.createUnit(req.body);
      res.status(201).json(unit);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Données invalides pour la création du logement.';
      res.status(400).json({ message });
    }
  };

  /**
   * @method update
   * @description Met à jour un logement existant.
   * @route PUT /api/units/:id
   * @param {Request<{ id: string }>} req - Requête Express avec le paramètre `id` et les données modifiées.
   * @param {Response} res - Réponse Express.
   * @returns {Promise<void>}
   */
  update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const unit = await this.service.updateUnit(req.params.id, req.body);
      res.json(unit);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du logement.';
      res.status(400).json({ message });
    }
  };

  /**
   * @method delete
   * @description Supprime définitivement un logement.
   * @route DELETE /api/units/:id
   * @param {Request<{ id: string }>} req - Requête Express avec le paramètre `id`.
   * @param {Response} res - Réponse Express avec le statut 204.
   * @returns {Promise<void>}
   */
  delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      await this.service.deleteUnit(req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du logement.';
      res.status(404).json({ message });
    }
  };
}