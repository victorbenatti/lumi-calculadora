import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async (currentSession: Session | null) => {
      setSession(currentSession);

      if (!currentSession) {
        setIsAdminSession(false);
        setLoading(false);
        return;
      }

      const role =
        currentSession.user.app_metadata?.role ||
        currentSession.user.user_metadata?.role;

      if (role === 'admin') {
        setIsAdminSession(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id')
          .eq('id', currentSession.user.id)
          .maybeSingle();

        if (error) throw error;
        setIsAdminSession(!data);
      } catch (error) {
        console.error('Erro ao verificar perfil de cliente:', error);
        setIsAdminSession(true);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void verifyAdminAccess(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void verifyAdminAccess(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown"></div>
        <p className="text-brand-brown font-medium animate-pulse">Verificando segurança...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminSession) {
    return <Navigate to="/catalogo" replace />;
  }

  return <>{children}</>;
}
