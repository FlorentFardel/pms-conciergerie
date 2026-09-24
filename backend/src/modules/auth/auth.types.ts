export type UserRole = 'admin' | 'cleaner' | 'calendar_manager' | 'concierge';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
}

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface RolePermission {
  role: UserRole;
  resource: string;
  tab_name?: string;
  can_read: boolean;
  can_write: boolean;
}