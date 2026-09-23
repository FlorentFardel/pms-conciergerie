import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Property, CreatePropertyDto, UpdatePropertyDto } from '../models/property';

/**
 * @service PropertyService
 * @description Service Angular centralisé pour la gestion du parc immobilier (propriétés).
 * Assure la communication avec l'API HTTP REST et maintient l'état réactif global via les Signals Angular.
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  /** Client HTTP Angular pour les appels d'API */
  private readonly http = inject(HttpClient);

  /** Point d'entrée de l'API HTTP REST pour le module des propriétés */
  private readonly apiUrl = '/api/properties';

  /** 
   * Signal réactif contenant la liste complète des propriétés enregistrées.
   * Accessible en lecture seule par les composants abonnés.
   */
  readonly properties = signal<Property[]>([]);

  /** 
   * Signal réactif indiquant si une requête HTTP asynchrone est actuellement en cours d'exécution.
   */
  readonly loading = signal<boolean>(false);

  /** 
   * Signal réactif contenant le dernier message d'erreur HTTP ou réseau rencontré, ou `null` si aucune erreur.
   */
  readonly error = signal<string | null>(null);

  /**
   * @method loadProperties
   * @description Effectue une requête HTTP GET pour récupérer l'ensemble des propriétés et met à jour le signal `properties`.
   * @returns {Promise<void>} Promesse résolue une fois les données chargées et affectées au signal.
   */
  async loadProperties(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<Property[]>(this.apiUrl));
      this.properties.set(data);
    } catch (err: unknown) {
      const errorMsg = this.extractErrorMessage(err, 'Erreur lors du chargement des propriétés');
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method getPropertyBySlugOrId
   * @description Recherche une propriété dans l'état réactif local à partir de son slug URL ou de son UUID.
   * @param {string} identifier - Le slug (ex: 'residence-les-fleurs') ou l'UUID de la propriété recherchée.
   * @returns {Property | undefined} La propriété trouvée ou `undefined` si absente du signal.
   */
  getPropertyBySlugOrId(identifier: string): Property | undefined {
    return this.properties().find(
      (p: Property) => p.slug === identifier || p.id === identifier
    );
  }

  /**
   * @method createProperty
   * @description Soumet une requête HTTP POST pour enregistrer une nouvelle propriété, puis l'ajoute en tête du signal `properties`.
   * @param {CreatePropertyDto} property - DTO contenant les informations du bien à créer (nom, adresse, ville, code postal).
   * @returns {Promise<Property>} La propriété créée renvoyée par le serveur backend (avec son ID et son slug générés).
   * @throws {Error} Si l'API renvoie un code d'erreur HTTP.
   */
  async createProperty(property: CreatePropertyDto): Promise<Property> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const newProperty = await firstValueFrom(
        this.http.post<Property>(this.apiUrl, property)
      );
      this.properties.update(list => [newProperty, ...list]);
      return newProperty;
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la création de la propriété');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method updateProperty
   * @description Met à jour une propriété existante via une requête HTTP PUT et rafraîchit l'instance dans le signal local.
   * @param {string} id - Identifiant unique UUID de la propriété à modifier.
   * @param {UpdatePropertyDto} property - DTO contenant les champs modifiés de la propriété.
   * @returns {Promise<Property>} La propriété mise à jour retournée par le serveur backend.
   * @throws {Error} Si l'API renvoie une erreur lors de la modification.
   */
  async updateProperty(id: string, property: UpdatePropertyDto): Promise<Property> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(
        this.http.put<Property>(`${this.apiUrl}/${id}`, property)
      );
      this.properties.update(list => list.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la modification');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method deleteProperty
   * @description Envoie une requête HTTP DELETE pour supprimer une propriété en base et la retire du signal local `properties`.
   * @param {string} id - Identifiant unique UUID de la propriété à supprimer.
   * @returns {Promise<void>} Promesse résolue dès la confirmation de la suppression par l'API.
   * @throws {Error} Si la suppression échoue côté backend.
   */
  async deleteProperty(id: string): Promise<void> {
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
      this.properties.update(list => list.filter(p => p.id !== id));
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la suppression');
      this.error.set(msg);
      throw new Error(msg);
    }
  }

  /**
   * @method extractErrorMessage
   * @private
   * @description Analyse une exception ou une réponse d'erreur HTTP pour en extraire un message compréhensible par l'utilisateur.
   * @param {unknown} err - Objet d'erreur intercepté (Error Javascript, HttpErrorResponse, etc.).
   * @param {string} defaultMsg - Message de secours par défaut en cas d'erreur indéterminée.
   * @returns {string} Le message d'erreur formaté sous forme de chaîne de caractères.
   */
  private extractErrorMessage(err: unknown, defaultMsg: string): string {
    if (typeof err === 'object' && err !== null) {
      const apiErr = err as { error?: { message?: string }; message?: string };
      return apiErr.error?.message || apiErr.message || defaultMsg;
    }
    return defaultMsg;
  }
}