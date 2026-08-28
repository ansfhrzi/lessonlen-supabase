// Pusat pembacaan environment variable.
// Frontend hanya boleh memakai key publik; secret Gemini & service role tetap
// berada di Supabase Secrets (lihat supabase/functions/README-TAHAP-4.md).

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseUrl = url.replace(/\/$/, "");
export const supabaseAnonKey = anonKey;

export const functionsBaseUrl =
  (process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ?? "").replace(/\/$/, "") ||
  (supabaseUrl ? `${supabaseUrl}/functions/v1` : "");

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith("http") && supabaseAnonKey.length > 10,
);

export const missingEnvVars = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", value: supabaseUrl },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: supabaseAnonKey },
].filter((item) => !item.value);
