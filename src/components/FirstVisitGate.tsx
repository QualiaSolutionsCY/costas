"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Renders nothing. On a first-ever visit (no "costas_onboarded" flag in
 * localStorage) it redirects to the /welcome onboarding intro. Returning
 * visitors fall straight through to the app. localStorage is only touched
 * inside the effect so the component is SSR-safe.
 */
export function FirstVisitGate() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("costas_onboarded") === null) {
      router.replace("/welcome");
    }
  }, [router]);

  return null;
}
