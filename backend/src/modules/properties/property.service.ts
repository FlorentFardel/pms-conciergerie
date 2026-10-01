import { PropertyRepository } from './property.repository.js';
import { Property, CreatePropertyInput, UpdatePropertyInput } from './property.types.js';

/** Expression régulière vérifiant la conformité d'un identifiant au format UUID v4 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @class PropertyService
 * @description Service métier centralisant les règles de gestion des propriétés.
 */
export class PropertyService {
  /** Instance du repository d'accès aux données */
  private readonly repository = new PropertyRepository();

  /**
   * Récupère la liste intégrale des propriétés.
   * 
   * @returns {Promise<Property[]>} Liste de l'ensemble des propriétés
   */
  async getAllProperties(): Promise<Property[]> {
    return this.repository.findAll();
  }

  /**
   * Recherche une propriété par son identifiant unique (UUID).
   * 
   * @param {string} id Identifiant UUID de la propriété
   * @returns {Promise<Property>} La propriété trouvée
   * @throws {Error} Si la propriété n'existe pas
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
   * 
   * @param {string} slug Slug unique de la propriété (ex: "residence-les-fleurs")
   * @returns {Promise<Property>} La propriété trouvée
   * @throws {Error} Si la propriété n'existe pas
   */
  async getPropertyBySlug(slug: string): Promise<Property> {
    const property = await this.repository.findBySlug(slug);
    if (!property) {
      throw new Error(`Propriété avec le slug "${slug}" introuvable.`);
    }
    return property;
  }

  /**
   * Recherche une propriété de manière agnostique en testant s'il s'agit d'un UUID ou d'un slug.
   * Permet à l'API de prendre en charge des URL lisibles (ex: /properties/residence-fleurs)
   * tout en restant compatible avec les accès par identifiant UUID.
   * 
   * @param {string} identifier UUID ou Slug de la propriété recherchée
   * @returns {Promise<Property>} La propriété correspondante
   * @throws {Error} Si l'entité n'est pas trouvée
   */
  async getPropertyByIdOrSlug(identifier: string): Promise<Property> {
    const isUuid = UUID_REGEX.test(identifier);

    if (isUuid) {
      return this.getPropertyById(identifier);
    }

    return this.getPropertyBySlug(identifier);
  }

  /**
   * Valide et crée une nouvelle propriété après contrôle d'unicité.
   * 
   * @param {CreatePropertyInput} data Données de création de la propriété
   * @returns {Promise<Property>} La propriété créée
   * @throws {Error} Si un champ est manquant ou si l'adresse est un doublon
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
   * 
   * @param {string} id Identifiant UUID de la propriété à modifier
   * @param {UpdatePropertyInput} data Données partielles de mise à jour
   * @returns {Promise<Property>} La propriété mise à jour
   * @throws {Error} Si la propriété n'existe pas ou en cas de conflit d'adresse
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
   * Supprime une propriété par son identifiant unique (UUID).
   * 
   * @param {string} id Identifiant UUID de la propriété à supprimer
   * @returns {Promise<void>}
   * @throws {Error} Si la propriété est introuvable ou déjà supprimée
   */
  async deleteProperty(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error('Propriété non trouvée ou déjà supprimée');
    }
  }
}