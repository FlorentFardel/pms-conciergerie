import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Property, CreatePropertyDto, UpdatePropertyDto } from '../models/property';

/**
 * @service PropertyService
 * @description Service Angular centralisé pour la gestion du parc immobilier.
 * Assure la communication avec l'API HTTP et maintient l'état réactif de l'application via les Signals Angular.
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  /** Injection du client HTTP Angular */
  private readonly http = inject(HttpClient);

  /** Point d'entrée de l'API pour les propriétés */
  private readonly apiUrl = '/api/properties';

  /** Signal contenant la liste courante des propriétés */
  readonly properties = signal<Property[]>([]);

  /** Signal indiquant si une opération asynchrone est en cours */
  readonly loading = signal<boolean>(false);

  /** Signal stockant le dernier message d'erreur rencontré */
  readonly error = signal<string | null>(null);

  /**
   * @method loadProperties
   * @description Récupère la liste complète des propriétés depuis l'API et met à jour le signal `properties`.
   * @returns {Promise<void>}
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
   * @method createProperty
   * @description Envoie une requête de création et ajoute la nouvelle propriété en tête du signal.
   * @param {CreatePropertyDto} property - Données de la propriété à créer.
   * @returns {Promise<Property>} La propriété créée.
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
   * @description Met à jour une propriété sur l'API et rafraîchit l'état dans le signal local.
   * @param {string} id - Identifiant unique de la propriété.
   * @param {UpdatePropertyDto} property - Champs à modifier.
   * @returns {Promise<Property>} La propriété mise à jour.
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
   * @description Supprime une propriété via l'API et la retire du signal local.
   * @param {string} id - Identifiant de la propriété à supprimer.
   * @returns {Promise<void>}
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
   * @description Extrait le message d'erreur d'une exception HTTP ou JS.
   */
  private extractErrorMessage(err: unknown, defaultMsg: string): string {
    if (typeof err === 'object' && err !== null) {
      const apiErr = err as { error?: { message?: string }; message?: string };
      return apiErr.error?.message || apiErr.message || defaultMsg;
    }
    return defaultMsg;
  }
}