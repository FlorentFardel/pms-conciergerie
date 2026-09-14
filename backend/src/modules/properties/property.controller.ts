import { Request, Response } from 'express';
import { PropertyService } from './property.service.js';

/**
 * @class PropertyController
 * @description Contrôleur Express gérant les requêtes HTTP relatives aux propriétés immobilières.
 * Fait le lien entre les routes d'API HTTP et la couche de service métier.
 */
export class PropertyController {
  /** Service métier gérant la logique des propriétés et l'accès à la base de données */
  private readonly service = new PropertyService();

  /**
   * @method getAll
   * @description Récupère la liste intégrale des propriétés.
   * @route GET /api/properties
   * @param {_req} _req - Objet requête Express (inutilisé).
   * @param {Response} res - Objet réponse Express pour retourner la liste en JSON.
   * @returns {Promise<void>}
   */
  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const properties = await this.service.getAllProperties();
      res.json(properties);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur serveur lors de la récupération des propriétés.';
      res.status(500).json({ message });
    }
  };

  /**
   * @method getById
   * @description Récupère les détails d'une propriété spécifique à partir de son identifiant.
   * @route GET /api/properties/:id
   * @param {Request<{ id: string }>} req - Requête contenant le paramètre d'URL `id`.
   * @param {Response} res - Objet réponse Express.
   * @returns {Promise<void>}
   */
  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const property = await this.service.getPropertyById(req.params.id);
      res.json(property);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Propriété introuvable.';
      res.status(404).json({ message });
    }
  };

  /**
   * @method create
   * @description Crée une nouvelle propriété immobilière dans la base de données.
   * @route POST /api/properties
   * @param {Request} req - Requête Express contenant le DTO de création dans `body`.
   * @param {Response} res - Objet réponse Express retournant la propriété créée (Status 201).
   * @returns {Promise<void>}
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const property = await this.service.createProperty(req.body);
      res.status(201).json(property);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Données invalides pour la création de la propriété.';
      res.status(400).json({ message });
    }
  };

  /**
   * @method update
   * @description Met à jour les informations d'une propriété existante.
   * @route PUT /api/properties/:id
   * @param {Request<{ id: string }>} req - Requête Express avec le paramètre `id` et les données modifiées dans `body`.
   * @param {Response} res - Objet réponse Express retournant la propriété mise à jour.
   * @returns {Promise<void>}
   */
  update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const property = await this.service.updateProperty(req.params.id, req.body);
      res.json(property);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la propriété.';
      res.status(400).json({ message });
    }
  };

  /**
   * @method delete
   * @description Supprime définitivement une propriété à partir de son identifiant.
   * @route DELETE /api/properties/:id
   * @param {Request<{ id: string }>} req - Requête Express contenant le paramètre `id`.
   * @param {Response} res - Objet réponse Express (Status 204 No Content).
   * @returns {Promise<void>}
   */
  delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      await this.service.deleteProperty(req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de la propriété.';
      res.status(404).json({ message });
    }
  };
}