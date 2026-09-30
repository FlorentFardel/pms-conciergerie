/**
 * @file timeline.ts
 * @description Modèles de données et types pour la vue timeline et la gestion des réservations.
 * Aligné sur la structure réelle de la table BDD PostgreSQL et l'affichage fluide par pourcentage.
 */

/**
 * Modes d'affichage temporel supportés pour la timeline.
 */
export type ViewMode = 'day' | 'week' | '2weeks' | 'month' | 'quarter';

/**
 * Canaux de réservation supportés par le type ENUM PostgreSQL `booking_channel`.
 * Inclut `MANUAL_BLOCK` (valeur réelle BDD) et `MANUAL` (pour la saisie formulaire).
 */
export type BookingChannel = 'AIRBNB' | 'BOOKING' | 'DIRECT' | 'MANUAL' | 'MANUAL_BLOCK';

/**
 * Statuts d'une réservation supportés par le type ENUM PostgreSQL `booking_status`.
 */
export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

/**
 * Représente une réservation ou un blocage en base de données (table `bookings`).
 */
export interface Booking {
  /** Identifiant unique (UUID) */
  id: string;
  /** Identifiant du logement associé (UUID) */
  unit_id: string;
  /** Identifiant du client associé (UUID, optionnel) */
  guest_id?: string | null;
  /** Nom/Prénom affiché du client ou motif de blocage (champ virtuel ou dérivé) */
  guestName?: string;
  /** Canal d'origine */
  channel: BookingChannel;
  /** Statut de la réservation */
  status: BookingStatus;
  /** Date d'arrivée (Check-in) au format YYYY-MM-DD */
  check_in: string;
  /** Date de départ (Check-out) au format YYYY-MM-DD */
  check_out: string;
  /** Prix par nuitée (€) */
  nightly_price?: number | null;
  /** Prix total du séjour (€) */
  total_price?: number | null;
  /** Commission de la plateforme (€) */
  channel_commission?: number | null;
  /** Indique s'il s'agit d'une saisie manuelle / blocage */
  is_manual_entry?: boolean;
  /** Motif de blocage (ex: "Travaux", "Ménage") */
  block_reason?: string | null;
  /** Notes internes */
  notes?: string | null;
  /** Date de création en BDD */
  created_at?: string;
  /** Date de mise à jour en BDD */
  updated_at?: string;
}

/**
 * DTO pour la création d'une nouvelle réservation ou d'un blocage manuel en BDD.
 */
export interface CreateBookingDto {
  /** Identifiant du logement (UUID) */
  unit_id: string;
  /** Identifiant du client (UUID, optionnel) */
  guest_id?: string | null;
  /** Nom du client si création directe */
  guestName?: string;
  /** Canal d'origine */
  channel: BookingChannel;
  /** Statut initial */
  status?: BookingStatus;
  /** Date d'arrivée (Check-in) au format YYYY-MM-DD */
  check_in: string;
  /** Date de départ (Check-out) au format YYYY-MM-DD */
  check_out: string;
  /** Prix total (€) */
  total_price?: number;
  /** Indique s'il s'agit d'un blocage manuel */
  is_manual_entry?: boolean;
  /** Motif du blocage */
  block_reason?: string | null;
  /** Notes facultatives */
  notes?: string | null;
}

/**
 * Logement affiché dans la timeline.
 */
export interface TimelineUnit {
  /** Identifiant unique du logement (UUID) */
  id: string;
  /** Nom personnalisé du logement */
  name?: string;
  /** Numéro ou référence unique du logement */
  unit_number: string;
}

/**
 * Groupe de logements rattachés à une propriété.
 */
export interface PropertyGroup {
  /** Identifiant unique de la propriété (UUID) */
  propertyId: string;
  /** Nom de la propriété */
  propertyName: string;
  /** Liste des logements rattachés */
  units: TimelineUnit[];
}

/**
 * Colonne représentant une journée dans le calendrier.
 */
export interface TimeColumn {
  /** Date brute Javascript */
  date: Date;
  /** Clé au format YYYY-MM-DD */
  dateStr: string;
  /** Nom court du jour (ex: "lun.") */
  dayName: string;
  /** Numéro du jour dans le mois (ex: "01", "12") */
  dayNumber: string;
  /** Vrai si le jour correspond à la date d'aujourd'hui */
  isToday: boolean;
  /** Vrai s'il s'agit du premier jour du mois */
  isFirstOfMonth: boolean;
}

/**
 * Représentation calculée d'un segment de réservation pour le rendu CSS sur la grille.
 */
export interface RenderedBooking {
  /** Données brutes de la réservation */
  booking: Booking;
  /** Offset de colonne de départ (0-indexed) */
  startCol: number;
  /** Nombre de colonnes (jours) occupées par la réservation */
  spanCols: number;
  /** Position horizontale de départ en pourcentage (%) */
  leftPercent: number;
  /** Largeur de la barre en pourcentage (%) */
  widthPercent: number;
}

/**
 * État de sélection temporaire lors du clic sur une cellule vide de la timeline.
 */
export interface NewBookingState {
  /** Identifiant UUID du logement sélectionné */
  unitId: string;
  /** Date de début sélectionnée (YYYY-MM-DD) */
  startDate: string;
  /** Date de fin par défaut (YYYY-MM-DD), ex: lendemain */
  endDate: string;
}