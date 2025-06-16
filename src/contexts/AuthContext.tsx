import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Profile = {
  id: string;
  full_name?: string;
  role: 'admin' | 'tech' | 'manager';
  created_at?: string;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single<Profile>();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      const isAdmin = data?.role === 'admin';
      setIsAdmin(isAdmin);
      return isAdmin;
    } catch (err) {
      console.error('Failed to check admin status:', err);
      return false;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        checkAdminStatus(newSession.user.id).then((isAdmin) => {
          setTimeout(() => {
            navigate(isAdmin ? '/admin-dashboard' : '/');
          }, 0);
        });
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        navigate('/login');
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        checkAdminStatus(currentSession.user.id);
      }

      setLoading(false);

      if (!currentSession) {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      cleanupAuthState();

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch {}

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      cleanupAuthState();

      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        throw error;
      }

      toast({
        title: "Account created",
        description: "Please check your email to confirm your account",
      });
    } catch (error: any) {
      toast({
        title: "Registration error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/login';
    } catch (error: any) {
      toast({
        title: "Sign out error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
