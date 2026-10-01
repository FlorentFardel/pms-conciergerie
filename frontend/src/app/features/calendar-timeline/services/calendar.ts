/**
 * @file calendar.ts
 * @module Features/CalendarTimeline/Services
 * @description Service de gestion de l'état réactif connecté à l'API backend PostgreSQL via HttpClient.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PropertyGroup, Booking } from '../models/timeline';

/**
 * Service centralisant l'état du calendrier et des propriétés.
 * Interroge l'API PostgreSQL via HttpClient et alimente les Signals réactifs.
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  /** Client HTTP Angular pour interroger l'API backend PostgreSQL. */
  private readonly http = inject(HttpClient);

  /** URL de base de l'API backend. */
  private readonly apiUrl = '/api';

  /** Signal privé stockant la liste des propriétés et leurs logements rattachés issus de la BDD. */
  private readonly propertiesSignal = signal<PropertyGroup[]>([]);

  /** Signal privé stockant la liste globale des réservations issues de la BDD. */
  private readonly bookingsSignal = signal<Booking[]>([]);

  /** Signal privé indiquant l'état de chargement des requêtes BDD. */
  private readonly isLoadingSignal = signal<boolean>(false);

  /** Signal privé conservant un éventuel message d'erreur d'exécution. */
  private readonly errorSignal = signal<string | null>(null);

  // --- SIGNALS PUBLICS (Lecture seule pour l'orchestrateur) ---

  /** Propriétés groupées accessibles en lecture seule. */
  readonly properties = computed(() => this.propertiesSignal());

  /** Réservations accessibles en lecture seule. */
  readonly bookings = computed(() => this.bookingsSignal());

  /** État de chargement accessible en lecture seule. */
  readonly isLoading = computed(() => this.isLoadingSignal());

  /** Message d'erreur courant (`null` si aucune erreur). */
  readonly error = computed(() => this.errorSignal());

  /**
   * Charge en parallèle les propriétés/logements et les réservations depuis l'API backend PostgreSQL.
   * Modifie les Signals `propertiesSignal`, `bookingsSignal` et `isLoadingSignal`.
   * 
   * @returns Promise résolue lorsque les données BDD sont chargées dans l'état réactif
   */
  async loadCalendarData(): Promise<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [fetchedProperties, fetchedBookings] = await Promise.all([
        this.fetchPropertiesFromDb(),
        this.fetchBookingsFromDb()
      ]);

      this.propertiesSignal.set(fetchedProperties);
      this.bookingsSignal.set(fetchedBookings);
    } catch (err: unknown) {
      this.errorSignal.set('Erreur lors du chargement des données depuis la base de données.');
      console.error('[CalendarService] Erreur BDD :', err);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Recherche une propriété chargée dans l'état réactif par son identifiant UUID.
   * Accepte la recherche aussi bien sur `propertyId` que sur `id`.
   * 
   * @param id Identifiant unique de la propriété (UUID)
   * @returns La propriété trouvée ou `undefined` si introuvable
   */
  getPropertyById(id: string): PropertyGroup | undefined {
    return this.propertiesSignal().find(
      (property) => property.propertyId === id || (property as { id?: string }).id === id
    );
  }

  /**
   * Effectue la requête HTTP vers l'API backend pour récupérer les propriétés et leurs logements joints.
   * Mappe les propriétés brutes issues de PostgreSQL vers le modèle `PropertyGroup`.
   * Assure la présence simultanée de `propertyId` et `id` pour éviter les erreurs de recherche dans la liste.
   * 
   * @returns Promise contenant le tableau des propriétés groupées
   */
  private async fetchPropertiesFromDb(): Promise<PropertyGroup[]> {
    const rawProperties = await firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/properties`)
    );

    return (rawProperties || []).map((property) => {
      const resolvedId = property.id || property.propertyId;
      const resolvedName = property.name || property.propertyName || 'Bâtiment sans nom';

      return {
        id: resolvedId,
        propertyId: resolvedId,
        propertyName: resolvedName,
        units: property.units || []
      } as PropertyGroup;
    });
  }

  /**
   * Effectue la requête HTTP vers l'API backend pour récupérer l'ensemble des réservations.
   * 
   * @returns Promise contenant le tableau des réservations
   */
  private async fetchBookingsFromDb(): Promise<Booking[]> {
    return firstValueFrom(
      this.http.get<Booking[]>(`${this.apiUrl}/bookings`)
    );
  }

  /**
   * Insère une nouvelle réservation en BDD via l'API, puis rafraîchit les données.
   * 
   * @param booking Objet réservation à insérer (sans l'identifiant UUID)
   * @returns Promise résolue après insertion BDD et rechargement des Signals
   */
  async createBooking(booking: Omit<Booking, 'id'>): Promise<void> {
    await firstValueFrom(
      this.http.post<Booking>(`${this.apiUrl}/bookings`, booking)
    );
    await this.loadCalendarData();
  }

  /**
   * Met à jour une réservation existante en BDD via l'API, puis rafraîchit les données.
   * 
   * @param updatedBooking La réservation contenant les modifications
   * @returns Promise résolue après mise à jour BDD et rechargement des Signals
   */
  async updateBooking(updatedBooking: Booking): Promise<void> {
    await firstValueFrom(
      this.http.put<Booking>(`${this.apiUrl}/bookings/${updatedBooking.id}`, updatedBooking)
    );
    await this.loadCalendarData();
  }

  /**
   * Supprime une réservation par son identifiant UUID en BDD via l'API, puis rafraîchit les données.
   * 
   * @param bookingId Identifiant unique de la réservation
   * @returns Promise résolue après suppression BDD et rechargement des Signals
   */
  async deleteBooking(bookingId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/bookings/${bookingId}`)
    );
    await this.loadCalendarData();
  }
}