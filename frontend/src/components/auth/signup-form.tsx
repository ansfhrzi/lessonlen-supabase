"use client";

import { useActionState } from "react";
import { signUpWithPassword, type AuthFormState } from "@/lib/actions/auth";
import { Alert, Button, Input, Label } from "@/components/ui";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpWithPassword, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
      <div>
        <Label htmlFor="full_name">Nama lengkap</Label>
        <Input id="full_name" name="full_name" autoComplete="name" required minLength={3} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <Label htmlFor="whatsapp_number">Nomor WhatsApp (opsional)</Label>
        <Input id="whatsapp_number" name="whatsapp_number" inputMode="tel" placeholder="08xxxxxxxxxx" />
      </div>

      <div>
        <Label htmlFor="password">Kata sandi</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="mt-1 text-xs text-ink-500">Minimal 8 karakter.</p>
      </div>

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Mendaftarkan…" : "Daftar"}
      </Button>
    </form>
  );
}
