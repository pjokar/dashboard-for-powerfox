/**
 * React Hooks für Powerfox API
 * 
 * Diese Hooks nutzen die API-Route (/api/powerfox)
 * Die API-Route nutzt die zentrale API-Schicht und Mapper
 * Alle Daten werden bereits gemappt (DB/App-Format) zurückgegeben
 */

import useSWR from "swr"
import { usePowerfoxStore, handleSessionInvalid } from "@/lib/powerfox-store"

/**
 * API-Refresh-Intervalle (in Millisekunden)
 */
const REFRESH_INTERVALS = {
  DEVICES: 60000,      // 1 Minute
  CURRENT: 60000,      // 1 Minute
  OPERATING: 60000,    // 1 Minute
  REPORT: 300000,      // 5 Minuten
}

/**
 * Fetcher für API-Calls über /api/powerfox
 */
async function apiFetcher({
  endpoint,
  params,
}: {
  endpoint: string
  params?: Record<string, any>
}) {
  const response = await fetch("/api/powerfox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, params }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      handleSessionInvalid()
    }
    const error = await response.json().catch(() => ({ error: "Failed to fetch" }))
    throw new Error(error.error || "Failed to fetch data")
  }

  return response.json()
}

// ============================================
// Devices
// ============================================

/**
 * Hook zum Abrufen aller Devices
 * Daten sind bereits im DB/App-Format (gemappt)
 */
export function usePowerfoxDevices() {
  const credentials = usePowerfoxStore((state) => state.credentials)

  return useSWR(
    credentials ? ["powerfox-devices", credentials] : null,
    () =>
      apiFetcher({
        endpoint: "all/devices",
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: REFRESH_INTERVALS.DEVICES,
    }
  )
}

/**
 * Hook zum Abrufen des Main Device
 * Daten sind bereits im DB/App-Format (gemappt)
 */
export function usePowerfoxMainDevice() {
  const credentials = usePowerfoxStore((state) => state.credentials)

  return useSWR(
    credentials ? ["powerfox-main-device", credentials] : null,
    () =>
      apiFetcher({
        endpoint: "all/main",
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: REFRESH_INTERVALS.DEVICES,
    }
  )
}

// ============================================
// Current Data
// ============================================

/**
 * Hook zum Abrufen aktueller Daten für ein Device
 * Daten sind bereits im DB/App-Format (gemappt)
 */
export function usePowerfoxCurrentData(
  deviceId: string | null,
  unit: 'wh' | 'kwh' = 'kwh'
) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  return useSWR(
    credentials && deviceId ? ["powerfox-current", deviceId, unit, credentials] : null,
    () =>
      apiFetcher({
        endpoint: `${deviceId}/current`,
        params: { unit },
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: REFRESH_INTERVALS.CURRENT,
    }
  )
}

// ============================================
// Operating Report
// ============================================

/**
 * Hook zum Abrufen des Operating Reports für ein Device
 * Daten sind bereits im DB/App-Format (gemappt)
 */
export function usePowerfoxOperatingReport(deviceId: string | null) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  return useSWR(
    credentials && deviceId ? ["powerfox-operating", deviceId, credentials] : null,
    () =>
      apiFetcher({
        endpoint: `${deviceId}/operating`,
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: REFRESH_INTERVALS.OPERATING,
    }
  )
}

// ============================================
// Report
// ============================================

/**
 * Hook zum Abrufen eines Reports für ein Device
 * Daten sind bereits im DB/App-Format (gemappt)
 */
export function usePowerfoxReport(
  deviceId: string | null,
  params?: Record<string, number>
) {
  const credentials = usePowerfoxStore((state) => state.credentials)

  return useSWR(
    credentials && deviceId 
      ? ["powerfox-report", deviceId, JSON.stringify(params), credentials] 
      : null,
    () =>
      apiFetcher({
        endpoint: `${deviceId}/report`,
        params: params,
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: REFRESH_INTERVALS.REPORT,
    }
  )
}

// ============================================
// Helper Hook für Credentials
// ============================================

/**
 * Hook zum Verwalten von Credentials
 */
export function usePowerfoxCredentials() {
  const credentials = usePowerfoxStore((state) => state.credentials)
  const setCredentials = usePowerfoxStore((state) => state.setCredentials)
  const clearCredentials = usePowerfoxStore((state) => state.clearCredentials)

  return {
    credentials,
    setCredentials,
    clearCredentials,
    hasCredentials: !!credentials,
  }
}
