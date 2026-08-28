import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string | null; anonKey: string | null } {
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
    };
  }

  // Check localStorage for custom override
  const customUrl = localStorage.getItem('lessonlen_supabase_url');
  const customKey = localStorage.getItem('lessonlen_supabase_anon_key');

  return {
    url: customUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    anonKey: customKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return cachedClient;
}

export function setCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lessonlen_supabase_url', url.trim());
    localStorage.setItem('lessonlen_supabase_anon_key', anonKey.trim());
    cachedClient = null; // reset client cache
  }
}

export function clearCustomSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lessonlen_supabase_url');
    localStorage.removeItem('lessonlen_supabase_anon_key');
    cachedClient = null;
  }
}
