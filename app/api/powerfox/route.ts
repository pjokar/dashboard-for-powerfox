import { NextRequest, NextResponse } from "next/server"
import {
  fetchDevices,
  fetchMainDevice,
  fetchCurrentData,
  fetchOperatingReport,
  fetchReport,
} from "@/lib/powerfox-api"
import {
  saveDevice,
  saveCurrentData,
  saveOperatingReport,
  saveReport,
} from "@/lib/powerfox-db"
import { COOKIE_NAME, parseAuthCookie } from "@/app/api/powerfox/credentials/route"

/**
 * API-Route mit automatischem DB-Speichern
 * 
 * Alle SDK-Calls und Mapping erfolgen in lib/powerfox-api.ts
 * Nach jedem erfolgreichen Abruf werden die Daten in der DB gespeichert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, params } = body

    // Credentials primär aus HttpOnly-Cookie lesen
    const cookie = request.cookies.get(COOKIE_NAME)
    const cookieCreds = cookie ? parseAuthCookie(cookie.value) : null

    if (!cookieCreds) {
      return NextResponse.json(
        { error: "Missing or invalid credentials cookie" },
        { status: 401 }
      )
    }

    const credentials = cookieCreds
    
    // Parse endpoint um deviceId und action zu extrahieren
    const endpointParts = endpoint.split('/')
    const deviceId = endpointParts[0]
    const action = endpointParts[1] || 'devices'

    let data: any

    // Nutze zentrale API-Schicht (SDK-Calls + Mapping erfolgen dort)
    switch (action) {
      case 'devices':
        if (deviceId === 'all') {
          data = await fetchDevices(credentials)
          // Speichere alle Devices in DB (im Hintergrund)
          if (Array.isArray(data)) {
            data.forEach(device => {
              saveDevice(device).catch(() => {})
            })
          }
        } else {
          // Spezifisches Device - hole alle und filtere
          const allDevices = await fetchDevices(credentials)
          data = allDevices.filter(d => d.deviceId === deviceId)
        }
        break

      case 'main':
        data = await fetchMainDevice(credentials)
        // Speichere main device in DB
        if (data) {
          saveDevice(data).catch(() => {})
        }
        break

      case 'current':
        const unit = (params?.unit || 'kwh') as 'wh' | 'kwh'
        data = await fetchCurrentData(credentials, deviceId, unit)
        // Speichere current data in DB
        if (data) {
          saveCurrentData(data).catch(() => {})
        }
        break

      case 'operating':
        data = await fetchOperatingReport(credentials, deviceId)
        // Speichere operating report in DB
        if (data) {
          saveOperatingReport(data).catch(() => {})
        }
        break

      case 'report':
        data = await fetchReport(credentials, deviceId, params)
        // Speichere report in DB
        if (data) {
          saveReport(data).catch(() => {})
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown endpoint action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error("Powerfox API error:", error)
    
    // Handle SDK Fehler
    if (error.response) {
      const status = error.response.status
      let errorMessage = `API error: ${status}`
      
      if (status === 401) {
        errorMessage = "Invalid credentials"
      } else if (status === 412) {
        errorMessage = "Data transmission has been refused by the customer"
      } else if (status === 429) {
        errorMessage = "Too many requests. Please wait and try again."
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch data from Powerfox" },
      { status: 500 }
    )
  }
}
