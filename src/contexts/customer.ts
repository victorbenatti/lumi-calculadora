import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

export type ClienteProfile = Database['public']['Tables']['clientes']['Row'];
export type ClienteProfileInput = Omit<
  Database['public']['Tables']['clientes']['Update'],
  'id' | 'created_at' | 'updated_at'
>;

export type CustomerContextValue = {
  session: Session | null;
  user: User | null;
  profile: ClienteProfile | null;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<ClienteProfile | null>;
  saveProfile: (profile: ClienteProfileInput) => Promise<ClienteProfile | null>;
  signOut: () => Promise<void>;
};

export const CustomerContext = createContext<CustomerContextValue | null>(null);

export function useCustomer() {
  const context = useContext(CustomerContext);

  if (!context) {
    throw new Error('useCustomer deve ser usado dentro de CustomerProvider');
  }

  return context;
}
