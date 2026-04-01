"use client";

import { useMutation } from "@tanstack/react-query";

async function requestNewLink(email: string): Promise<void> {
  await fetch("/api/auth/request-new-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function useRequestNewLink() {
  return useMutation({
    mutationFn: requestNewLink,
  });
}
