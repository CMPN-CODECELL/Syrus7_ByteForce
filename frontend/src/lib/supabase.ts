import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from .env or secure app config
export function getStoredSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://ceiijirjiqjhqzhwacio.supabase.co').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2YkkOU5XyHnLVstDVQAyQw_AKe0Q0j0').trim();

  // If localStorage contains an old project URL, purge it cleanly
  try {
    const localUrl = localStorage.getItem('campusly_supabase_url');
    if (localUrl && localUrl !== envUrl) {
      localStorage.removeItem('campusly_supabase_url');
      localStorage.removeItem('campusly_supabase_anon_key');
    }
  } catch {}

  const url = envUrl;
  const anonKey = envKey;

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    url !== 'YOUR_SUPABASE_URL' &&
    anonKey !== 'YOUR_SUPABASE_ANON_KEY'
  );

  return { url, anonKey, isConfigured };
}

let activeClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.isConfigured) {
    activeClient = null;
    return null;
  }

  if (!activeClient) {
    activeClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return activeClient;
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    if (!cleanUrl.startsWith('http') || !cleanKey) {
      throw new Error('Please enter a valid Supabase Project URL (e.g. https://xxx.supabase.co) and Anon key');
    }
    localStorage.setItem('campusly_supabase_url', cleanUrl);
    localStorage.setItem('campusly_supabase_anon_key', cleanKey);
    activeClient = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return true;
  } catch (err) {
    console.error('Failed to save Supabase config:', err);
    throw err;
  }
}

export function clearSupabaseConfig() {
  try {
    localStorage.removeItem('campusly_supabase_url');
    localStorage.removeItem('campusly_supabase_anon_key');
  } catch {}
  activeClient = null;
}

export const isSupabaseConfigured = getStoredSupabaseConfig().isConfigured;

export const supabase: SupabaseClient | null = getSupabase();

export async function signUpUser(email: string, password: string, metadata: { name?: string; college?: string }) {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      // Check for Supabase free-tier email rate limit (3 emails/hour)
      if (
        error.status === 429 ||
        error.message.toLowerCase().includes('rate limit') ||
        (error as any).code === 'over_email_send_rate_limit'
      ) {
        // In case the user account was already registered, try signing in with password directly
        try {
          const signInRes = await client.auth.signInWithPassword({ email, password });
          if (signInRes.data?.user) {
            return { user: signInRes.data.user, session: signInRes.data.session, provider: 'supabase' };
          }
        } catch {}

        const err: any = new Error(
          'Supabase email rate limit exceeded (3/hr free limit). Turn off "Confirm email" in Supabase Dashboard (Authentication → Providers → Email) to remove this limit.'
        );
        err.isRateLimit = true;
        throw err;
      }
      throw error;
    }
    return { user: data.user, session: data.session, provider: 'supabase' };
  }

  // Local MongoDB bridge fallback when Supabase keys are pending
  return {
    user: { id: `local-${Date.now()}`, email, user_metadata: metadata },
    session: null,
    provider: 'local-bridge',
  };
}

export async function signInUser(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  const modAccounts: Record<string, { pass: string; id: string; name: string }> = {
    'jainilmutha2008@gmail.com': { pass: 'Jainil@5118', id: 'mod-jainilmutha2008', name: 'Jainil Mutha' },
    'ayushbsingh15@gmail.com': { pass: 'Ayush@2008', id: 'mod-ayushbsingh15', name: 'Ayush Singh' },
  };

  // Direct authentication for Moderator Accounts
  if (modAccounts[cleanEmail] && modAccounts[cleanEmail].pass === password) {
    const cred = modAccounts[cleanEmail];
    const client = getSupabase();
    if (client) {
      try {
        const { data } = await client.auth.signInWithPassword({ email: cleanEmail, password });
        if (data?.user) {
          return { user: data.user, session: data.session, provider: 'supabase' };
        }
      } catch {}
    }
    return {
      user: {
        id: cred.id,
        email: cleanEmail,
        user_metadata: { name: cred.name, college: 'Vesit', isModerator: true },
      },
      session: null,
      provider: 'moderator-auth',
    };
  }

  const client = getSupabase();
  if (client) {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        const err: any = new Error(
          'Email not confirmed yet. Fix: in Supabase Dashboard → Authentication → Providers → Email, turn OFF "Confirm email".'
        );
        err.isEmailUnconfirmed = true;
        throw err;
      }
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        const err: any = new Error(
          'Supabase email rate limit exceeded. Turn off "Confirm email" in Supabase Dashboard (Authentication → Providers → Email).'
        );
        err.isRateLimit = true;
        throw err;
      }
      throw error;
    }
    return { user: data.user, session: data.session, provider: 'supabase' };
  }

  // Local MongoDB bridge fallback
  return {
    user: { id: `local-${Date.now()}`, email },
    session: null,
    provider: 'local-bridge',
  };
}

export async function signOutUser() {
  const client = getSupabase();
  if (client) {
    await client.auth.signOut();
  }
}

export async function updateUserPassword(newPassword: string) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not initialized');
  const { data, error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}
