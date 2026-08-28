"use client";

import { useActionState, useState, useTransition } from "react";
import { signInWithGoogle, signInWithPassword, type AuthFormState } from "@/lib/actions/auth";
import { Alert, Button, Input, Label } from "@/components/ui";

const initialState: AuthFormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);
  const [oauthBusy, startOauth] = useTransition();
  const [oauthError, setOauthError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div>
          <Label htmlFor="password">Kata sandi</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Memeriksa…" : "Masuk"}
        </Button>
      </form>

      <div className="relative py-2 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-ink-200" />
        <span className="relative bg-ink-50 px-3 text-xs uppercase tracking-wide text-ink-400">atau</span>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={oauthBusy || pending}
        onClick={() => {
          setOauthError(null);
          startOauth(async () => {
            const result = await signInWithGoogle(next);
            if (result?.error) setOauthError(result.error);
          });
        }}
      >
        {oauthBusy ? "Menghubungkan…" : "Masuk dengan Google"}
      </Button>

      {oauthError ? <Alert tone="error">{oauthError}</Alert> : null}
    </div>
  );
}
