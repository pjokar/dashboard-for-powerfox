"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { usePowerfoxStore, handleSessionInvalid } from "@/lib/powerfox-store"

/**
 * Redirects to /login when the user has no credentials or das Auth-Cookie ungültig ist.
 * Prüft nach Rehydration des Stores zusätzlich per GET /api/powerfox/credentials,
 * ob das HttpOnly-Cookie noch vorhanden ist (sonst 401 → Weiterleitung zu /login).
 */
export function useRequireAuth() {
  const router = useRouter()
  const credentials = usePowerfoxStore((state) => state.credentials)

  useEffect(() => {
    const id = setTimeout(async () => {
      const creds = usePowerfoxStore.getState().credentials
      if (!creds) {
        router.replace("/login")
        return
      }
      const res = await fetch("/api/powerfox/credentials", { credentials: "include" })
      if (res.status === 401) {
        handleSessionInvalid()
      }
    }, 80)
    return () => clearTimeout(id)
  }, [router, credentials])

  return !!credentials
}
