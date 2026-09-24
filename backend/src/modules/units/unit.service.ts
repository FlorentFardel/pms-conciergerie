import { UnitRepository } from './unit.repository.js';
import { Unit, CreateUnitInput, UpdateUnitInput } from './unit.types.js';

/**
 * @class UnitService
 * @description Service métier backend pour la gestion des logements (Units).
 */
export class UnitService {
  private readonly repository = new UnitRepository();

  /**
   * Récupère tous les logements enregistrés.
   */
  async getAllUnits(): Promise<Unit[]> {
    return await this.repository.findAll();
  }

  /**
   * Récupère la liste des logements rattachés à une propriété spécifique.
   */
  async getUnitsByPropertyId(propertyId: string): Promise<Unit[]> {
    return await this.repository.findByPropertyId(propertyId);
  }

  /**
   * Récupère un logement par son identifiant unique.
   */
  async getUnitById(id: string): Promise<Unit> {
    const unit = await this.repository.findById(id);
    if (!unit) {
      throw new Error(`Logement avec l'ID ${id} introuvable.`);
    }
    return unit;
  }

  /**
   * Crée un nouveau logement dans la base de données.
   */
  async createUnit(data: CreateUnitInput): Promise<Unit> {
    return await this.repository.create(data);
  }

  /**
   * Met à jour un logement existant.
   */
  async updateUnit(id: string, data: UpdateUnitInput): Promise<Unit> {
    await this.getUnitById(id); // Vérifie que le logement existe
    const updatedUnit = await this.repository.update(id, data);
    
    if (!updatedUnit) {
      throw new Error(`Échec de la mise à jour du logement ${id}.`);
    }

    return updatedUnit;
  }

  /**
   * Supprime un logement par son identifiant.
   */
  async deleteUnit(id: string): Promise<void> {
    await this.getUnitById(id);
    await this.repository.delete(id);
  }
}