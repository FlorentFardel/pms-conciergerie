export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  name: string;
  type: string;
  capacity?: number;
  floor: number | null;
  surface: number | null;
  rent_amount: number | null;
  charges_amount: number | null;
  is_occupied: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface CreateUnitInput {
  property_id: string;
  unit_number: string;
  name: string;
  type: string;
  capacity?: number;
  floor?: number;
  surface?: number;
  rent_amount?: number;
  charges_amount?: number;
  is_occupied?: boolean;
  is_active?: boolean;
}

export type UpdateUnitInput = Partial<CreateUnitInput>;