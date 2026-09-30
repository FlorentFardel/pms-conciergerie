/**
 * @file booking.ts
 * @description Service Angular centralisé pour la gestion réactive des réservations.
 * Interagit directement avec l'API HTTP REST et la base de données backend.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Booking, CreateBookingDto } from '../models/timeline';

/**
 * @service BookingService
 * @description Service de production gérant la persistance des réservations en BDD.
 */
@Injectable({
  providedIn: 'root'
})
export class BookingService {
  /** Client HTTP Angular */
  private readonly http = inject(HttpClient);

  /** Endpoint API REST backend */
  private readonly apiUrl = '/api/bookings';

  /**
   * Signal réactif contenant l'état global des réservations.
   * @type {WritableSignal<Booking[]>}
   * @readonly
   */
  readonly bookings = signal<Booking[]>([]);

  /**
   * Signal réactif indiquant si une requête HTTP est en cours.
   * @type {WritableSignal<boolean>}
   * @readonly
   */
  readonly loading = signal<boolean>(false);

  /**
   * Signal réactif contenant le dernier message d'erreur HTTP.
   * @type {WritableSignal<string | null>}
   * @readonly
   */
  readonly error = signal<string | null>(null);

  /**
   * @method loadBookings
   * @description Récupère la liste complète des réservations depuis la BDD via l'API REST.
   * @returns {Promise<void>}
   */
  async loadBookings(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<Booking[]>(this.apiUrl));
      this.bookings.set(data);
    } catch (err: unknown) {
      this.error.set(this.extractErrorMessage(err, 'Erreur lors du chargement des réservations'));
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method createBooking
   * @description Persiste une nouvelle réservation en BDD via POST HTTP puis met à jour le Signal local.
   * @param {CreateBookingDto} dto - Données du séjour ou blocage.
   * @returns {Promise<Booking>} La réservation créée renvoyée par le serveur.
   */
  async createBooking(dto: CreateBookingDto): Promise<Booking> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const newBooking = await firstValueFrom(
        this.http.post<Booking>(this.apiUrl, dto)
      );
      this.bookings.update((list: Booking[]) => [...list, newBooking]);
      return newBooking;
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la création de la réservation');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * @method updateBooking
   * @description Met à jour une réservation existante en BDD via PUT HTTP.
   * @param {string} id - Identifiant UUID.
   * @param {CreateBookingDto} dto - Données modifiées.
   * @returns {Promise<Booking>}
   */
  async updateBooking(id: string, dto: CreateBookingDto): Promise<Booking> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(
        this.http.put<Booking>(`${this.apiUrl}/${id}`, dto)
      );
      this.bookings.update((list: Booking[]) =>
        list.map((b: Booking) => (b.id === id ? updated : b))
      );
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
   * @method cancelBooking
   * @description Supprime la réservation en base de données via DELETE HTTP.
   * @param {string} bookingId - Identifiant UUID.
   * @returns {Promise<void>}
   */
  async cancelBooking(bookingId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${bookingId}`));
      this.bookings.update((list: Booking[]) =>
        list.filter((b: Booking) => b.id !== bookingId)
      );
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Erreur lors de la suppression');
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Extraie un message d'erreur clair.
   * @private
   */
  private extractErrorMessage(err: unknown, defaultMsg: string): string {
    if (typeof err === 'object' && err !== null) {
      const apiErr = err as { error?: { message?: string }; message?: string };
      return apiErr.error?.message || apiErr.message || defaultMsg;
    }
    return defaultMsg;
  }
}