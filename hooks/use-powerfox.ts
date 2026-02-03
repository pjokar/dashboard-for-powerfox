import useSWR from "swr"
import { usePowerfoxStore } from "@/lib/powerfox-store"

/**
 * HYBRID-MODUS: Dashboard nutzt primär API (live), kann aber auf DB umgestellt werden
 * 
 * Um auf DB umzustellen:
 * 1. Ändere USE_DATABASE = true
 * 2. Stelle sicher dass Daten in DB sind (via /sync Seite)
 */
const USE_DATABASE = false // Auf true setzen für DB-Modus

interface FetchParams {
  endpoint: string
  params?: Record<string, string | number>
}

// API-Fetcher (direkt von Powerfox)
async function apiFetcher({
  endpoint,
  params,
  email,
  password,
}: FetchParams & { email: string; password: string }) {
  const response = await fetch("/api/powerfox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, endpoint, params }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch" }))
    throw new Error(error.error || "Failed to fetch data")
  }

  return response.json()
}

// DB-Fetcher (aus lokaler Datenbank)
async function dbFetcher(url: string) {
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch" }))
    throw new Error(error.error || "Failed to fetch data from database")
  }

  return response.json()
}

export function useDevices() {
  const credentials = usePowerfoxStore((state) => state.credentials)

  // DB-Modus
  if (USE_DATABASE) {
    return useSWR(
      "/api/powerfox/save",
      () => dbFetcher("/api/powerfox/save"),
      { revalidateOnFocus: false }
    )
  }

  // API-Modus (Standard)
  return useSWR(
    credentials ? ["devices", credentials] : null,
    () =>
      apiFetcher({
        endpoint: "all/devices",
        email: credentials!.email,
        password: credentials!.password,
      }),
    { revalidateOnFocus: false }
  )
}

export function useCurrentData(deviceId: string | null) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  // DB-Modus
  if (USE_DATABASE) {
    return useSWR(
      deviceId ? `/api/powerfox/history?deviceId=${deviceId}&type=current&limit=100` : null,
      () => dbFetcher(`/api/powerfox/history?deviceId=${deviceId}&type=current&limit=100`),
      { refreshInterval: 30000 }
    )
  }

  // API-Modus (Standard)
  return useSWR(
    credentials && deviceId ? ["current", deviceId, credentials] : null,
    () =>
      apiFetcher({
        endpoint: `${deviceId}/current`,
        params: { unit: "kwh" },
        email: credentials!.email,
        password: credentials!.password,
      }),
    { refreshInterval: 30000 }
  )
}

export function useOperatingData(deviceId: string | null) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  // DB-Modus
  if (USE_DATABASE) {
    return useSWR(
      deviceId ? `/api/powerfox/history?deviceId=${deviceId}&type=operating&limit=10` : null,
      () => dbFetcher(`/api/powerfox/history?deviceId=${deviceId}&type=operating&limit=10`),
      { refreshInterval: 60000 }
    )
  }

  // API-Modus (Standard)
  return useSWR(
    credentials && deviceId ? ["operating", deviceId, credentials] : null,
    () =>
      apiFetcher({
        endpoint: `${deviceId}/operating`,
        email: credentials!.email,
        password: credentials!.password,
      }),
    { refreshInterval: 60000 }
  )
}

export function useReportData(
  deviceId: string | null,
  period: "day" | "month" | "year" | "24h",
  date?: { year?: number; month?: number; day?: number }
) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  // DB-Modus
  if (USE_DATABASE) {
    return useSWR(
      deviceId ? `/api/powerfox/history?deviceId=${deviceId}&type=reports&limit=10` : null,
      () => dbFetcher(`/api/powerfox/history?deviceId=${deviceId}&type=reports&limit=10`),
      { revalidateOnFocus: false }
    )
  }

  // API-Modus (Standard)
  const params: Record<string, number> = {}
  if (period !== "24h" && date) {
    if (date.year) params.year = date.year
    if (date.month) params.month = date.month
    if (date.day) params.day = date.day
  }

  return useSWR(
    credentials && deviceId
      ? ["report", deviceId, period, JSON.stringify(params), credentials]
      : null,
    () =>
      apiFetcher({
        endpoint: `${deviceId}/report`,
        params,
        email: credentials!.email,
        password: credentials!.password,
      }),
    { revalidateOnFocus: false }
  )
}
