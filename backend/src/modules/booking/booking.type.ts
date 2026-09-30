/**
 * @file booking.type.ts
 * @description Interfaces et types TypeScript pour le module booking.
 */

export type BookingChannel = 'AIRBNB' | 'BOOKING' | 'DIRECT' | 'MANUAL';
export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

export interface Booking {
  id: string;
  unit_id: string;
  guest_id?: string | null;
  guestName?: string;
  channel: BookingChannel;
  status: BookingStatus;
  check_in: string;
  check_out: string;
  nightly_price?: number | null;
  total_price?: number | null;
  channel_commission?: number | null;
  is_manual_entry?: boolean;
  block_reason?: string | null;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateBookingDto {
  unit_id: string;
  guestName?: string;
  check_in: string;
  check_out: string;
  channel: BookingChannel;
  status?: BookingStatus;
  total_price?: number;
  is_manual_entry?: boolean;
  block_reason?: string | null;
  notes?: string | null;
}