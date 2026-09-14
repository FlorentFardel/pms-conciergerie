import { UnitRepository } from './unit.repository.js';
import { Unit, CreateUnitInput, UpdateUnitInput } from './unit.types.js';

/**
 * @class UnitService
 * @description Service métier gérant les règles de gestion et la validation des logements (Units).
 */
export class UnitService {
  /** Instance du repository pour l'accès aux données */
  private readonly repository = new UnitRepository();

  /**
   * @method getAllUnits
   * @description Récupère l'ensemble des logements.
   * @returns {Promise<Unit[]>} Liste de tous les logements.
   */
  async getAllUnits(): Promise<Unit[]> {
    return this.repository.findAll();
  }

  /**
   * @method getUnitsByPropertyId
   * @description Récupère les logements rattachés à une propriété.
   * @param {string} propertyId - Identifiant UUID de la propriété.
   * @returns {Promise<Unit[]>} Liste des logements filtrés.
   */
  async getUnitsByPropertyId(propertyId: string): Promise<Unit[]> {
    return this.repository.findByPropertyId(propertyId);
  }

  /**
   * @method getUnitById
   * @description Recherche un logement par son identifiant unique.
   * @param {string} id - Identifiant UUID du logement.
   * @returns {Promise<Unit>} Le logement trouvé.
   * @throws {Error} Si le logement n'existe pas.
   */
  async getUnitById(id: string): Promise<Unit> {
    const unit = await this.repository.findById(id);
    if (!unit) {
      throw new Error('Logement non trouvé');
    }
    return unit;
  }

  /**
   * @method createUnit
   * @description Valide et crée un nouveau logement pour une propriété donnée.
   * @param {CreateUnitInput} data - Données du logement à créer.
   * @returns {Promise<Unit>} Le logement créé.
   * @throws {Error} Si des données sont manquantes, si la capacité est invalide ou si le nom existe déjà.
   */
  async createUnit(data: CreateUnitInput): Promise<Unit> {
    if (!data.property_id || !data.name || !data.type || data.capacity === undefined) {
      throw new Error('Tous les champs (propriété, nom, type, capacité) sont obligatoires');
    }

    if (data.capacity <= 0) {
      throw new Error('La capacité doit être un nombre supérieur à zéro');
    }

    // Contrôle d'unicité du nom au sein de la même propriété
    const duplicate = await this.repository.findDuplicateByName(data.property_id, data.name);
    if (duplicate) {
      throw new Error(`Un logement nommé "${data.name}" existe déjà dans cette propriété.`);
    }

    return this.repository.create(data);
  }

  /**
   * @method updateUnit
   * @description Met à jour un logement existant avec contrôle d'unicité du nom.
   * @param {string} id - Identifiant du logement.
   * @param {UpdateUnitInput} data - Champs à mettre à jour.
   * @returns {Promise<Unit>} Le logement mis à jour.
   * @throws {Error} Si le logement est introuvable ou si le nouveau nom crée un doublon.
   */
  async updateUnit(id: string, data: UpdateUnitInput): Promise<Unit> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Logement non trouvé');
    }

    if (data.capacity !== undefined && data.capacity <= 0) {
      throw new Error('La capacité doit être un nombre supérieur à zéro');
    }

    // Si le nom est modifié, on vérifie l'unicité dans la même propriété
    const nameToCheck = data.name || existing.name;
    const duplicate = await this.repository.findDuplicateByName(existing.property_id, nameToCheck, id);
    if (duplicate) {
      throw new Error(`Un logement nommé "${nameToCheck}" existe déjà dans cette propriété.`);
    }

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new Error('Erreur lors de la mise à jour du logement');
    }

    return updated;
  }

  /**
   * @method deleteUnit
   * @description Supprime un logement par son identifiant.
   * @param {string} id - Identifiant du logement à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} Si le logement n'existe pas ou est déjà supprimé.
   */
  async deleteUnit(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error('Logement non trouvé ou déjà supprimé');
    }
  }
}