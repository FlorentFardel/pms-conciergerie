import { PropertyRepository } from './property.repository.js';
import { Property, CreatePropertyInput, UpdatePropertyInput } from './property.types.js';

/**
 * @class PropertyService
 * @description Service métier centralisant les règles de gestion des propriétés.
 */
export class PropertyService {
  /** Instance du repository d'accès aux données */
  private readonly repository = new PropertyRepository();

  /**
   * Récupère la liste intégrale des propriétés.
   */
  async getAllProperties(): Promise<Property[]> {
    return this.repository.findAll();
  }

  /**
   * Recherche une propriété par son identifiant unique (UUID).
   */
  async getPropertyById(id: string): Promise<Property> {
    const property = await this.repository.findById(id);
    if (!property) {
      throw new Error('Propriété non trouvée');
    }
    return property;
  }

  /**
   * Recherche une propriété par son slug lisible.
   */
  async getPropertyBySlug(slug: string): Promise<Property> {
    const property = await this.repository.findBySlug(slug);
    if (!property) {
      throw new Error(`Propriété avec le slug "${slug}" introuvable.`);
    }
    return property;
  }

  /**
   * Valide et crée une nouvelle propriété après contrôle d'unicité.
   */
  async createProperty(data: CreatePropertyInput): Promise<Property> {
    if (!data.name || !data.address || !data.city || !data.postal_code) {
      throw new Error('Tous les champs sont obligatoires');
    }

    const duplicate = await this.repository.findDuplicate(data.address, data.postal_code, data.city);
    if (duplicate) {
      throw new Error(`Une propriété existe déjà à l'adresse "${data.address}, ${data.postal_code} ${data.city}".`);
    }

    return this.repository.create(data);
  }

  /**
   * Met à jour une propriété avec contrôle d'unicité d'adresse.
   */
  async updateProperty(id: string, data: UpdatePropertyInput): Promise<Property> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Propriété non trouvée');
    }

    const address = data.address || existing.address;
    const postalCode = data.postal_code || existing.postal_code;
    const city = data.city || existing.city;

    const duplicate = await this.repository.findDuplicate(address, postalCode, city, id);
    if (duplicate) {
      throw new Error(`Une autre propriété existe déjà à l'adresse "${address}, ${postalCode} ${city}".`);
    }

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new Error('Erreur lors de la mise à jour de la propriété');
    }

    return updated;
  }

  /**
   * Supprime une propriété par son identifiant.
   */
  async deleteProperty(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error('Propriété non trouvée ou déjà supprimée');
    }
  }
}