import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IcalEvent } from '../models/ical-event';
import { Unit } from '../models/unit';

/**
 * @file ical.ts
 * @module Features/Units/Services
 * @description Service métier responsable du téléchargement, du parsing et de la normalisation des flux iCal (.ics).
 * @architecture Enterprise Pattern - Infrastructure Service
 */
@Injectable({
  providedIn: 'root'
})
export class IcalService {
  /* ==========================================================================
     1. INJECTION DES SERVICES
     ========================================================================== */

  /**
   * Client HTTP Angular pour la récupération distante des flux ICS.
   * @private
   */
  private readonly http: HttpClient = inject(HttpClient);

  /* ==========================================================================
     2. PARSING ET DECODAGE DES FLUX ICAL
     ========================================================================== */

  /**
   * Parse une chaîne au format iCal (.ics) brut pour en extraire la liste des événements `VEVENT`.
   * 
   * @param {string} icalData - Contenu brut du fichier .ics.
   * @param {string} [source='other'] - Nom du canal d'origine pour l'étiquetage.
   * @returns {IcalEvent[]} Liste des événements d'occupation extraits.
   */
  parseIcalRaw(icalData: string, source: string = 'other'): IcalEvent[] {
    const events: IcalEvent[] = [];
    if (!icalData) return events;

    const eventBlocks = icalData.split('BEGIN:VEVENT');

    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i].split('END:VEVENT')[0];
      if (!block) continue;

      const uid = this.extractIcalProperty(block, 'UID') || `generated-${Math.random()}`;
      const summary = this.extractIcalProperty(block, 'SUMMARY') || 'Indisponible';
      const description = this.extractIcalProperty(block, 'DESCRIPTION');
      const rawStart = this.extractIcalProperty(block, 'DTSTART');
      const rawEnd = this.extractIcalProperty(block, 'DTEND');

      if (rawStart && rawEnd) {
        const startDate = this.parseIcalDate(rawStart);
        const endDate = this.parseIcalDate(rawEnd);

        if (startDate && endDate) {
          events.push({
            uid,
            summary,
            description,
            start_date: startDate,
            end_date: endDate,
            source
          });
        }
      }
    }

    return events;
  }

  /**
   * Télécharge un flux iCal distant via l'API backend et retourne les événements parsés.
   * 
   * @async
   * @param {string} url - URL publique du flux .ics.
   * @param {string} [source='other'] - Nom du canal (ex: 'airbnb', 'booking').
   * @returns {Promise<IcalEvent[]>} Promesse résolue avec la liste des événements.
   */
  async fetchAndParseIcal(url: string, source: string = 'other'): Promise<IcalEvent[]> {
    if (!url) return [];

    try {
      const proxyUrl = `/api/ical/fetch?url=${encodeURIComponent(url)}`;
      const rawText = await firstValueFrom(this.http.get(proxyUrl, { responseType: 'text' }));
      return this.parseIcalRaw(rawText, source);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de récupérer le flux iCal.';
      throw new Error(`[IcalService] ${msg}`);
    }
  }

  /**
   * Récupère et agrège en parallèle l'ensemble des événements iCal configurés pour un logement.
   * 
   * @async
   * @param {Unit} unit - Le logement contenant les URLs iCal à synchroniser.
   * @returns {Promise<IcalEvent[]>} Promesse résolue avec la liste unifiée de toutes les réservations.
   */
  async getUnitEvents(unit: Unit): Promise<IcalEvent[]> {
    const fetchPromises: Promise<IcalEvent[]>[] = [];

    if (unit.airbnb_ical_url) {
      fetchPromises.push(this.fetchAndParseIcal(unit.airbnb_ical_url, 'airbnb'));
    }
    if (unit.booking_ical_url) {
      fetchPromises.push(this.fetchAndParseIcal(unit.booking_ical_url, 'booking'));
    }
    if (unit.other_ical_url) {
      fetchPromises.push(this.fetchAndParseIcal(unit.other_ical_url, 'other'));
    }

    const results = await Promise.allSettled(fetchPromises);
    const events: IcalEvent[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        events.push(...result.value);
      }
    }

    return events;
  }

  /* ==========================================================================
     3. MÉTHODES PRIVÉES DE TRAITEMENT DES TEXTES ET DATES
     ========================================================================== */

  /**
   * Extrait la valeur d'une propriété spécifique dans un bloc VEVENT iCal.
   * 
   * @private
   * @param {string} block - Contenu textuel d'un bloc VEVENT.
   * @param {string} propertyName - Nom de la clé iCal (ex: 'SUMMARY', 'DTSTART').
   * @returns {string | undefined} Valeur de la propriété ou undefined si non trouvée.
   */
  private extractIcalProperty(block: string, propertyName: string): string | undefined {
    const regex = new RegExp(`(?:^|\\r?\\n)${propertyName}(?:;[^:]*)?:(.*)(?:\\r?\\n|$)`);
    const match = block.match(regex);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Convertit une chaîne de date au format ISO iCal (YYYYMMDD ou YYYYMMDDTHHMMSSZ) en objet Date JavaScript.
   * 
   * @private
   * @param {string} dateStr - Chaîne de date brute issue du fichier .ics.
   * @returns {Date | null} Objet Date ou null en cas de format invalide.
   */
  private parseIcalDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    if (dateStr.length === 8 && !dateStr.includes('T')) {
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      const day = parseInt(dateStr.substring(6, 8), 10);
      return new Date(year, month, day);
    }

    const formatted = dateStr.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, '$1-$2-$3T$4:$5:$6Z');
    const parsedDate = new Date(formatted);

    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
}