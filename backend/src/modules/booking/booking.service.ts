/**
 * @file booking.service.ts
 * @description Logique métier pour le module booking.
 */

import { BookingRepository } from './booking.repository';
import { Booking, CreateBookingDto } from './booking.type';

export class BookingService {
  private repository = new BookingRepository();

  async getAllBookings(): Promise<Booking[]> {
    return this.repository.findAll();
  }

  async createBooking(dto: CreateBookingDto): Promise<Booking> {
    return this.repository.create(dto);
  }

  async updateBooking(id: string, dto: Partial<CreateBookingDto>): Promise<Booking | null> {
    return this.repository.update(id, dto);
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}