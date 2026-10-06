import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Unit, CreateUnitDto, BulkCreateUnitsDto, UpdateUnitDto } from '../models/unit';

/**
 * @file unit.ts
 * @module Features/Units/Services/UnitService
 * @description Service Angular centralisé pour la gestion des logements (Units).
 * Assure la communication avec l'API REST HTTP, la manipulation métier des données et la gestion de l'état réactif via Signals.
 * @architecture Enterprise Pattern - Service Layer
 */
@Injectable({
  providedIn: 'root'
})
export class UnitService {
  /** Client HTTP Angular */
  private readonly http = inject(HttpClient);

  /** Point d'entrée de l'API REST pour les logements */
  private readonly apiUrl = '/api/units';

  /** Signal contenant la liste des logements chargés */
  readonly units = signal<Unit[]>([]);

  /** Signal d'état de chargement asynchrone */
  readonly loading = signal<boolean>(false);

  /** Signal contenant le dernier message d'erreur */
  readonly error = signal<string | null>(null);

  /**
   * @method sortUnits
   * @description Traitement métier : Applique un tri alphanumérique naturel sur le champ `unit_number`
   * (ex: 1, 2, 3... 10, 11, 101).
   * @param {Unit[]} unitsList - Liste brute de logements à ordonner.
   * @returns {Unit[]} Nouvelle liste de logements ordonnée.
   */
  sortUnits(unitsList: Unit[]): Unit[] {
    return [...unitsList].sort((a: Unit, b: Unit) => {
      const numA: string = a.unit_number ?? '';
      const numB: string = b.unit_number ?? '';

      return numA.localeCompare(numB, undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    });
  }

  /**
   * @method getUnits
   * @description Récupère la liste des logements, optionnellement filtrée par propriété.
   * @param {string} [propertyId] - Identifiant UUID optionnel de la propriété parente.
   * @returns {Promise<Unit[]>} Liste des logements récupérés et triés.
   */
  async getUnits(propertyId?: string): Promise<Unit[]> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const url = propertyId ? `${this.apiUrl}?propertyId=${propertyId}` : this.apiUrl;
      const data = await firstValueFrom(this.http.get<Unit[]>(url));
      const sortedData = this.sortUnits(data);
      this.units.set(sortedData);
      return sortedData;
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la récupération des logements.');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method getUnitById
   * @description Récupère les informations détaillées d'un logement par son ID.
   * @param {string} id - Identifiant UUID du logement.
   * @returns {Promise<Unit>}
   */
  async getUnitById(id: string): Promise<Unit> {
    this.loading.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(this.http.get<Unit>(`${this.apiUrl}/${id}`));
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la récupération du logement.');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method createUnit
   * @description Enregistre un nouveau logement individuel via l'API REST.
   * @param {CreateUnitDto} dto - Données de création du logement.
   * @returns {Promise<Unit>} Le logement créé.
   */
  async createUnit(dto: CreateUnitDto): Promise<Unit> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const newUnit = await firstValueFrom(this.http.post<Unit>(this.apiUrl, dto));
      this.units.update(list => this.sortUnits([...list, newUnit]));
      return newUnit;
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la création du logement.');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method bulkCreateUnits
   * @description Crée plusieurs logements pour un même bâtiment via des requêtes exécutées en parallèle.
   * @param {BulkCreateUnitsDto | any} dto - Données de création par lots.
   * @returns {Promise<Unit[]>} Liste des logements créés.
   */
  async bulkCreateUnits(dto: BulkCreateUnitsDto | any): Promise<Unit[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const rawDto = dto as Record<string, any>;
      const parentPropertyId: string = rawDto['property_id'] || rawDto['propertyId'];
      let unitsToCreate: CreateUnitDto[] = [];

      if (Array.isArray(rawDto['units'])) {
        unitsToCreate = rawDto['units'];
      } else if (Array.isArray(rawDto['items'])) {
        unitsToCreate = rawDto['items'];
      } else if (Array.isArray(dto)) {
        unitsToCreate = dto;
      } else if (typeof rawDto['count'] === 'number' && rawDto['count'] > 0) {
        const count: number = rawDto['count'];
        const prefix: string = rawDto['prefix'] || 'Logement';
        const startIndex: number = rawDto['start_index'] || rawDto['startIndex'] || 1;
        const defaultCapacity: number = rawDto['default_capacity'] || rawDto['defaultCapacity'] || 2;

        for (let i = 0; i < count; i++) {
          const numSeq = startIndex + i;
          const numStr = String(numSeq);
          unitsToCreate.push({
            property_id: parentPropertyId,
            unit_number: numStr,
            unitNumber: numStr,
            name: `${prefix} ${numSeq}`,
            type: 'Appartement',
            capacity: defaultCapacity,
            is_active: true,
            floor: 0,
            surface: 0,
            rent_amount: 0,
            charges_amount: 0,
            is_occupied: false
          } as CreateUnitDto);
        }
      }

      if (unitsToCreate.length === 0) {
        return [];
      }

      const promises = unitsToCreate.map((unitDto: CreateUnitDto) => {
        const payload = {
          ...unitDto,
          property_id: unitDto.property_id || parentPropertyId
        };
        return firstValueFrom(this.http.post<Unit>(this.apiUrl, payload));
      });

      const createdUnits: Unit[] = await Promise.all(promises);
      this.units.update(list => this.sortUnits([...list, ...createdUnits]));
      return createdUnits;

    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la création en masse des logements.');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method updateUnit
   * @description Met à jour partiellement les informations d'un logement.
   * @param {string} id - Identifiant UUID du logement.
   * @param {UpdateUnitDto} dto - Champs à modifier.
   * @returns {Promise<Unit>}
   */
  async updateUnit(id: string, dto: UpdateUnitDto): Promise<Unit> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(
        this.http.put<Unit>(`${this.apiUrl}/${id}`, dto)
      );
      this.units.update(list => this.sortUnits(list.map(u => u.id === id ? updated : u)));
      return updated;
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la mise à jour du logement.');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method deleteUnit
   * @description Supprime un logement spécifique en base de données.
   * @param {string} id - Identifiant UUID du logement à supprimer.
   * @returns {Promise<void>}
   */
  async deleteUnit(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
      this.units.update(list => list.filter(u => u.id !== id));
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la suppression du logement.');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method toggleUnitStatus
   * @description Modifie le statut d'activation d'un logement unique.
   * @param {string} unitId - Identifiant UUID du logement.
   * @param {boolean} isActive - Nouvel état souhaité.
   * @returns {Promise<Unit>}
   */
  async toggleUnitStatus(unitId: string, isActive: boolean): Promise<Unit> {
    return this.updateUnit(unitId, { is_active: isActive });
  }

  /**
   * @method toggleAllUnitsStatus
   * @description Active ou désactive l'ensemble des logements d'une liste en parallèle.
   * @param {Unit[]} unitsList - Liste des logements ciblés.
   * @param {boolean} targetStatus - Statut cible (true = tout activer, false = tout désactiver).
   * @returns {Promise<void>}
   */
  async toggleAllUnitsStatus(unitsList: Unit[], targetStatus: boolean): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const promises = unitsList.map(unit =>
        firstValueFrom(this.http.put<Unit>(`${this.apiUrl}/${unit.id}`, { is_active: targetStatus }))
      );
      await Promise.all(promises);
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors du changement de statut global.');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method extractErrorMessage
   * @private
   * @description Extrait le message d'erreur réseau ou serveur.
   */
  private extractErrorMessage(err: unknown, defaultMsg: string): string {
    if (typeof err === 'object' && err !== null) {
      const apiErr = err as { error?: { message?: string }; message?: string };
      return apiErr.error?.message || apiErr.message || defaultMsg;
    }
    return defaultMsg;
  }
}