import { NextRequest, NextResponse } from "next/server"
import {
  saveDevice,
  saveCurrentData,
  saveOperatingReport,
  saveReport,
  logApiCall,
} from "@/lib/powerfox-db"
import type {
  MyDeviceModel,
  MyCurrentDataModel,
  OperatingReportModel,
  ReportModel,
} from "@/lib/powerfox-sdk/models"
import { MyApi, Configuration } from "@/lib/powerfox-sdk"
import { 
  deviceDbToSdk, 
  deviceSdkToDb,
  currentDataSdkToDb,
  transformApiFieldsToCamelCase 
} from "@/lib/mappers"
import { COOKIE_NAME, parseAuthCookie } from "@/app/api/powerfox/credentials/route"

/**
 * Diese erweiterte API-Route ruft Daten von Powerfox ab und speichert sie in der Datenbank
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let endpoint = ''
  let params: any = null
  
  try {
    const body = await request.json()
    
    // Prüfe ob Daten direkt übergeben wurden (für Hintergrund-Speicherung)
    const searchParams = new URL(request.url).searchParams
    const directEndpoint = searchParams.get('endpoint')
    endpoint = directEndpoint || ''
    
    if (directEndpoint && Array.isArray(body)) {
      const action = directEndpoint.split('/')[1] || 'devices'
      try {
        // Daten sind bereits im App-Format (gemappt von /api/powerfox)
        // Kein weiteres Mapping nötig!
        await saveDataToDatabase(action, body, undefined)
        
        return NextResponse.json({ 
          success: true, 
          saved: body.length,
          message: 'Data saved to database'
        })
      } catch (error) {
        console.error('Error saving to DB:', error)
        return NextResponse.json(
          { error: 'Failed to save to database', details: String(error) },
          { status: 500 }
        )
      }
    }
    
    // Standard-Modus: API abrufen und optional speichern
    const { saveToDb = true } = body
    endpoint = body.endpoint || endpoint
    params = body.params
    // Credentials aus HttpOnly-Cookie lesen
    const cookie = request.cookies.get(COOKIE_NAME)
    const cookieCreds = cookie ? parseAuthCookie(cookie.value) : null

    if (!cookieCreds) {
      const duration = Date.now() - startTime
      await logApiCall({
        endpoint: endpoint || "unknown",
        method: "POST",
        params,
        statusCode: 401,
        success: false,
        errorMessage: "Missing or invalid credentials cookie",
        duration,
      }).catch((err) => console.error("Failed to log API call:", err))

      return NextResponse.json(
        { error: "Missing or invalid credentials cookie" },
        { status: 401 }
      )
    }

    // Parse endpoint um deviceId zu extrahieren
    const endpointParts = endpoint.split('/')
    const deviceId = endpointParts[0]
    const action = endpointParts[1] || 'devices'

    let data: any

    try {
      const authHeader = `Basic ${Buffer.from(`${cookieCreds.email}:${cookieCreds.password}`).toString("base64")}`
      
      let url = `https://backend.powerfox.energy/api/2/my/${endpoint}`
      if (params) {
        const queryParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value))
          }
        })
        const queryString = queryParams.toString()
        if (queryString) {
          url += `?${queryString}`
        }
      }

      const response = await fetch(url, {
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const rawData = await response.json()

      // Nutze SDK für Transformation
      const config = new Configuration({
        username: cookieCreds.email,
        password: cookieCreds.password,
        basePath: "https://backend.powerfox.energy",
      })
      const api = new MyApi(config)
      
      // Nutze MAPPER für konsistente Transformation (wie /api/powerfox)
      // API gibt bereits camelCase zurück (von SDK transformiert)
      switch (action) {
        case 'devices':
          // Liste von Devices - nutze Mapper
          if (Array.isArray(rawData)) {
            data = rawData
              .filter(device => device && device.deviceId)
              .map(device => deviceSdkToDb(device))
          } else {
            data = deviceSdkToDb(rawData)
          }
          break

        case 'current':
          // CurrentData - nutze Mapper mit deviceId und unit
          const unit = params?.unit || "wh"
          const transformCurrentWithMapper = (item: any) => {
            // Transformiere zuerst snake_case falls vorhanden
            const normalized = transformApiFieldsToCamelCase(item)
            // Dann nutze Mapper
            return currentDataSdkToDb({ ...normalized, unit }, deviceId)
          }
          
          if (Array.isArray(rawData)) {
            data = rawData.map(transformCurrentWithMapper)
          } else {
            data = transformCurrentWithMapper(rawData)
          }
          break

        case 'operating':
          // OperatingReport - deviceId aus Request-Path hinzufügen
          // TODO: Verwende operatingReportSdkToDb Mapper
          data = { ...rawData, deviceId }
          break

        case 'report':
          // Report - deviceId aus Request-Path hinzufügen
          // TODO: Verwende reportSdkToDb Mapper
          data = { ...rawData, deviceId }
          break

        default:
          return NextResponse.json(
            { error: `Unknown endpoint action: ${action}` },
            { status: 400 }
          )
      }

      // Optional: Daten in DB speichern
      if (saveToDb) {
        try {
          await saveDataToDatabase(action, data, deviceId)
        } catch (dbError) {
          console.error("Database save error:", dbError)
          
          const duration = Date.now() - startTime
          await logApiCall({
            endpoint,
            method: 'POST',
            params,
            statusCode: 200,
            success: true,
            responseData: data,
            errorMessage: 'Data fetched but DB save failed: ' + (dbError instanceof Error ? dbError.message : String(dbError)),
            duration,
          }).catch(err => console.error('Failed to log API call:', err))
          
          // Wir geben trotzdem die Daten zurück, auch wenn DB-Speicherung fehlschlägt
          return NextResponse.json({
            ...data,
            dbWarning: "Data fetched successfully but failed to save to database",
            dbError: dbError instanceof Error ? dbError.message : String(dbError)
          })
        }
      }

      // Log erfolgreichen API-Aufruf
      const duration = Date.now() - startTime
      await logApiCall({
        endpoint,
        method: 'POST',
        params,
        statusCode: 200,
        success: true,
        responseData: data,
        duration,
      }).catch(err => console.error('Failed to log API call:', err))

      return NextResponse.json(data)

    } catch (apiError: any) {
      console.error("Powerfox SDK error:", apiError)
      
      const duration = Date.now() - startTime
      
      // Handle SDK Fehler
      if (apiError.response) {
        const status = apiError.response.status
        let errorMessage = `API error: ${status}`
        
        if (status === 401) {
          errorMessage = "Invalid credentials"
        } else if (status === 412) {
          errorMessage = "Data transmission has been refused by the customer"
        } else if (status === 429) {
          errorMessage = "Too many requests. Please wait and try again."
        }
        
        // Log fehlgeschlagenen API-Aufruf
        await logApiCall({
          endpoint,
          method: 'POST',
          params,
          statusCode: status,
          success: false,
          errorMessage,
          duration,
        }).catch(err => console.error('Failed to log API call:', err))
        
        return NextResponse.json(
          { error: errorMessage },
          { status }
        )
      }

      throw apiError
    }

  } catch (error) {
    console.error("Powerfox API error:", error)
    
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data from Powerfox'
    
    // Log fehlgeschlagenen API-Aufruf
    await logApiCall({
      endpoint: endpoint || 'unknown',
      method: 'POST',
      params,
      statusCode: 500,
      success: false,
      errorMessage,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    return NextResponse.json(
      { error: "Failed to fetch data from Powerfox" },
      { status: 500 }
    )
  }
}

/**
 * Speichert Daten basierend auf dem Action-Typ 
 * deviceId wird aus dem Endpoint-Pfad extrahiert und bei Bedarf hinzugefügt
 */
async function saveDataToDatabase(action: string, data: any, deviceId?: string) {
  if (!data) return

  switch (action) {
    case 'devices':
    case 'main':
      // Liste von Devices oder einzelnes Device
      if (Array.isArray(data)) {
        const validDevices = data.filter(device => device && device.deviceId)
        for (const device of validDevices) {
          await saveDevice(device)
        }
      } else {
        await saveDevice(data)
      }
      break

    case 'current':
      // Aktuelle Daten
      if (Array.isArray(data)) {
        await Promise.all(data.map(currentData => saveCurrentData(currentData)))
      } else {
        await saveCurrentData(data)
      }
      break

    case 'operating':
      // Operating Report - deviceId wurde bereits im data-Objekt gesetzt
      await saveOperatingReport(data)
      break

    case 'report':
      // Vollständiger Report - deviceId wurde bereits im data-Objekt gesetzt
      await saveReport(data)
      break

    default:
      break
  }
}

/**
 * GET-Endpunkt zum Abrufen aller Devices aus der lokalen Datenbank
 */
export async function GET() {
  try {
    const { getAllDevices } = await import("@/lib/powerfox-db")
    const devices = await getAllDevices()
    // Transformiere DB-Daten zu SDK-Format (camelCase)
    const devicesInSdkFormat = devices.map(deviceDbToSdk)
    return NextResponse.json(devicesInSdkFormat)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to fetch devices from database" },
      { status: 500 }
    )
  }
}
