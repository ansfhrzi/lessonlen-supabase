// CORS headers standar untuk Supabase Edge Functions.
// Selama development ini menggunakan "*" agar mudah dicoba dari frontend lokal.
// Untuk production, ganti "*" dengan domain frontend kamu (mis. https://lessonlen.id).

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function handleCors(req: Request): Response {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}
