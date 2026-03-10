import type { AppProps } from 'next/app';
import '../index.css';
import { User } from '../types';
import * as React from 'react';
import { Manrope } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/pages';
import { getSession, logout } from '../actions/users/actions';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const router = useRouter();

  const handleLogout = React.useCallback(async () => {
    await logout();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }, [router]);

  const fetchSession = React.useCallback(async () => {
    try {
      const session = await getSession();
      
      if (session?.supabaseAccessToken && session?.supabaseRefreshToken) {
        // Check if we already have a session in Supabase and if it matches
        const { data: { session: currentSupabaseSession } } = await supabase.auth.getSession();
        
        if (!currentSupabaseSession || currentSupabaseSession.access_token !== session.supabaseAccessToken) {
          console.log("[App] Syncing Supabase session...");
          const { error } = await supabase.auth.setSession({
            access_token: session.supabaseAccessToken,
            refresh_token: session.supabaseRefreshToken,
          });
          
          if (error) {
            console.error("[App] Supabase setSession error:", error);
            // If the refresh token is invalid or already used, we might have a stale session.
            if (error.message.includes("Refresh Token Not Found") || 
                error.message.includes("invalid_grant") || 
                error.message.includes("Already Used")) {
              console.warn("[App] Supabase session is invalid. Logging out...");
              handleLogout();
              return;
            }
          } else {
            console.log("[App] Supabase session synced successfully.");
          }
        }
      } else if (session) {
        console.warn("[App] Session found but Supabase tokens are missing. User might need to re-login.");
      }
      
      setUser(session);
    } catch (error) {
      console.error("[App] Failed to fetch session:", error);
    } finally {
      setIsInitializing(false);
    }
  }, [handleLogout]);

  React.useEffect(() => {
    fetchSession();
    // Only fetch session on mount and when explicitly needed, 
    // not on every route change to avoid redundant setSession calls.
  }, [fetchSession]);

  const handleLogin = React.useCallback(async (u: User) => {
    if (u.supabaseAccessToken && u.supabaseRefreshToken) {
      console.log("[App] Setting Supabase session on login...");
      const { error } = await supabase.auth.setSession({
        access_token: u.supabaseAccessToken,
        refresh_token: u.supabaseRefreshToken,
      });
      if (error) console.error("[App] Supabase login setSession error:", error);
      else console.log("[App] Supabase login session set successfully.");
    } else {
      console.warn("[App] Login successful but Supabase tokens are missing in user object.");
    }
    setUser(u);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-emerald-600 font-medium">Carregando...</div>
      </div>
    );
  }

  return (
    <NuqsAdapter>
      <div className={`${manrope.variable} font-sans`}>
        <Component 
          {...pageProps} 
          user={user} 
          onLogin={handleLogin} 
          onLogout={handleLogout} 
        />
      </div>
    </NuqsAdapter>
  );
}
