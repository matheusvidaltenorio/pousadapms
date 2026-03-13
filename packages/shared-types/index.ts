/**
 * Tipos compartilhados entre frontend e backend.
 * Importe de: import { Property, Room } from '@pousada-pms/shared-types'
 */

export type PropertyRole = 'admin' | 'manager' | 'receptionist' | 'housekeeping';
export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type BookingSource = 'direct' | 'booking' | 'airbnb' | 'website' | 'other';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'other';
