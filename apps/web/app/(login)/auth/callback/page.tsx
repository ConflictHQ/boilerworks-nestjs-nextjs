"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const token = searchParams.get("token"); // fallback for password login

    // If we already have a token (from password login), store it directly
    if (token) {
      localStorage.setItem("jwt", token);
      fetch("/api/auth/store-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).finally(() => {
        router.replace("/dashboard");
      });
      return;
    }

    // Auth0 callback: exchange code for token via our backend
    if (code) {
      const apiRoot = process.env.NEXT_PUBLIC_API_ROOT ?? "http://localhost:4000";
      fetch(
        `${apiRoot}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`,
        {
          credentials: "include",
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (!data.ok || !data.token) {
            setError(data.error || "Authentication failed");
            return;
          }

          localStorage.setItem("jwt", data.token);

          return fetch("/api/auth/store-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: data.token }),
          }).then(() => {
            router.replace(data.next || "/dashboard");
          });
        })
        .catch(() => {
          setError("Network error during authentication");
        });
      return;
    }

    // No code or token — redirect to login
    router.replace("/auth/login");
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <a href="/auth/login" className="text-primary text-sm underline">
            Try again
          </a>
        </div>
      </div>
    );
  }

  return <div className="text-muted-foreground text-sm">Completing login...</div>;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
      <CallbackInner />
    </Suspense>
  );
}
