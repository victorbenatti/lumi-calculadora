import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  CustomerContext,
  type ClienteProfile,
  type ClienteProfileInput,
} from './customer';

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ClienteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.user) {
      setProfile(null);
      return null;
    }

    setProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', activeSession.user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data ?? null);
      return data ?? null;
    } catch (error) {
      console.error('Erro ao carregar perfil do cliente:', error);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isActive) return;
      setSession(currentSession);
      setLoading(false);
      void loadProfile(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      void loadProfile(nextSession);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session), [loadProfile, session]);

  const saveProfile = useCallback(
    async (profileInput: ClienteProfileInput) => {
      if (!session?.user) return null;

      setProfileLoading(true);

      try {
        const { data, error } = await supabase
          .from('clientes')
          .upsert({
            id: session.user.id,
            ...profileInput,
            email: profileInput.email || session.user.email || '',
          })
          .select('*')
          .single();

        if (error) throw error;
        setProfile(data);
        return data;
      } catch (error) {
        console.error('Erro ao salvar perfil do cliente:', error);
        throw error;
      } finally {
        setProfileLoading(false);
      }
    },
    [session]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      refreshProfile,
      saveProfile,
      signOut,
    }),
    [loading, profile, profileLoading, refreshProfile, saveProfile, session, signOut]
  );

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}
