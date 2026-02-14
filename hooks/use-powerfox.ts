import useSWR from "swr"
import { usePowerfoxStore } from "@/lib/powerfox-store"

/**
 * HYBRID-MODUS:
 * - Dashboard nutzt LIVE API-Daten (Echtzeit vom Main Device)
 * - Reports-Seite nutzt DB-Daten (historische Analyse mit Filtern)
 * 
 * /sync Seite speichert Daten in DB für spätere Analyse
 */
const USE_DATABASE = false // Dashboard zeigt Live-Daten von API

/**
 * API-Refresh-Intervalle (in Millisekunden)
 */
const REFRESH_INTERVALS = {
  DEVICES: 60000,      // 1 Minute - Devices ändern sich selten
  CURRENT: 60000,      // 1 Minute - Aktuelle Daten
  OPERATING: 60000,    // 1 Minute - Operating Reports
  REPORT: 300000,      // 5 Minuten - Reports ändern sich am seltensten
}

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

// Speichert Devices im Hintergrund in der DB
async function saveDevicesToDb(devices: any[]) {
  try {
    const body = JSON.stringify(devices)
    const response = await fetch("/api/powerfox/save?endpoint=all/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    })
    await response.json()
  } catch {
    // Fehler wird ignoriert - DB-Speicherung ist optional
  }
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

  // API-Modus (Standard) - holt von API und speichert automatisch in DB
  return useSWR(
    credentials ? ["devices", credentials] : null,
    async () => {
      const devices = await apiFetcher({
        endpoint: "all/devices",
        email: credentials!.email,
        password: credentials!.password,
      })
      // Speichere im Hintergrund in DB (fire-and-forget)
      if (devices && Array.isArray(devices) && devices.length > 0) {
        saveDevicesToDb(devices)
      }
      
      return devices
    },
    { 
      revalidateOnFocus: false,
      refreshInterval: REFRESH_INTERVALS.DEVICES
    }
  )
}

export function useCurrentData(deviceId: string | null) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  // DB-Modus - holt neueste Daten aus DB
  if (USE_DATABASE) {
    const result = useSWR(
      deviceId ? `/api/powerfox/history?deviceId=${deviceId}&type=current&limit=1` : null,
      dbFetcher,
      { refreshInterval: 30000 }
    )
    
    // Transformiere DB-Response zu API-Response Format (nimm neuesten Eintrag)
    return {
      ...result,
      data: result.data?.data?.[0] || null
    }
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
    { 
      refreshInterval: REFRESH_INTERVALS.CURRENT,
      revalidateOnFocus: false
    }
  )
}

export function useOperatingData(deviceId: string | null) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  // DB-Modus - holt neuesten Operating Report aus DB
  if (USE_DATABASE) {
    const result = useSWR(
      deviceId ? `/api/powerfox/history?deviceId=${deviceId}&type=operating&limit=1` : null,
      dbFetcher,
      { refreshInterval: 60000 }
    )
    
    // Transformiere DB-Response zu API-Response Format (nimm neuesten Eintrag)
    return {
      ...result,
      data: result.data?.data?.[0] || null
    }
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
    { 
      refreshInterval: REFRESH_INTERVALS.OPERATING,
      revalidateOnFocus: false
    }
  )
}

export function useReportData(
  deviceId: string | null,
  period: "day" | "month" | "year" | "24h",
  date?: { year?: number; month?: number; day?: number }
) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  // DB-Modus - holt neuesten Report aus DB
  if (USE_DATABASE) {
    const result = useSWR(
      deviceId ? `/api/powerfox/history?deviceId=${deviceId}&type=reports&limit=1` : null,
      dbFetcher,
      { revalidateOnFocus: false }
    )
    
    // Transformiere DB-Response zu API-Response Format (nimm neuesten Eintrag)
    return {
      ...result,
      data: result.data?.data?.[0] || null
    }
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
    { 
      revalidateOnFocus: false,
      refreshInterval: REFRESH_INTERVALS.REPORT
    }
  )
}
