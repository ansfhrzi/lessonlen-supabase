"use client";

import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui";
import { useState } from "react";

export function SignOutButton() {
  const [pending, start] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        start(true);
        void signOut();
      }}
    >
      {pending ? "Keluar…" : "Keluar"}
    </Button>
  );
}
