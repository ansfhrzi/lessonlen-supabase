"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  message?: string;
  field?: string;
}

function safeRedirectTo(path: string): string {
  if (!path.startsWith("/")) return "/";
  return path;
}

async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectTo(String(formData.get("next") ?? "/"));

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const whatsapp = String(formData.get("whatsapp_number") ?? "").trim();
  const origin = await currentOrigin();

  if (fullName.length < 3) {
    return { error: "Nama lengkap minimal 3 karakter." };
  }
  if (password.length < 8) {
    return { error: "Kata sandi minimal 8 karakter." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, whatsapp_number: whatsapp || null },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // Bila konfirmasi email dimatikan, session langsung tersedia.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  return {
    message:
      "Pendaftaran berhasil. Cek email Anda untuk konfirmasi akun, lalu masuk kembali.",
  };
}

export async function signInWithGoogle(next: string = "/"): Promise<AuthFormState> {
  const supabase = await createClient();
  const origin = await currentOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin || ""}/auth/callback?next=${encodeURIComponent(safeRedirectTo(next))}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    return { error: translateAuthError(error?.message ?? "Google SSO tidak tersedia.") };
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (lower.includes("already registered")) return "Email sudah terdaftar. Silakan masuk.";
  if (lower.includes("email not confirmed"))
    return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  if (lower.includes("rate limit")) return "Terlalu banyak percobaan. Coba lagi sebentar.";
  if (lower.includes("password")) return "Kata sandi tidak memenuhi syarat keamanan.";
  return message;
}
