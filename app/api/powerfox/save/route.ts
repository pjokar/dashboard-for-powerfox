import { NextRequest, NextResponse } from "next/server"
import {
  saveDevice,
  saveCurrentData,
  saveOperatingReport,
  saveReport,
} from "@/lib/powerfox-db"
import type {
  MyDeviceModel,
  MyCurrentDataModel,
  OperatingReportModel,
  ReportModel,
} from "@/lib/powerfox-sdk/models"

const POWERFOX_API_BASE = "https://backend.powerfox.energy/api/2.0/my"

/**
 * Diese erweiterte API-Route ruft Daten von Powerfox ab und speichert sie in der Datenbank
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, endpoint, params, saveToDb = true } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const authHeader = `Basic ${Buffer.from(`${email}:${password}`).toString("base64")}`

    let url = `${POWERFOX_API_BASE}/${endpoint}`
    if (params) {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 0) {
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
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      }
      if (response.status === 412) {
        return NextResponse.json(
          { error: "Data transmission has been refused by the customer" },
          { status: 412 }
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please wait and try again." },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Optional: Daten in DB speichern
    if (saveToDb) {
      try {
        await saveDataToDatabase(endpoint, data)
      } catch (dbError) {
        console.error("Database save error:", dbError)
        // Wir geben trotzdem die Daten zurück, auch wenn DB-Speicherung fehlschlägt
        return NextResponse.json({
          ...data,
          dbWarning: "Data fetched successfully but failed to save to database",
        })
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Powerfox API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data from Powerfox" },
      { status: 500 }
    )
  }
}

/**
 * Speichert Daten basierend auf dem Endpoint-Typ
 */
async function saveDataToDatabase(endpoint: string, data: any) {
  if (!data) return

  switch (endpoint) {
    case "Devices":
      // Liste von Devices
      if (Array.isArray(data)) {
        for (const device of data) {
          await saveDevice(device as MyDeviceModel)
        }
      }
      break

    case "main":
      // Hauptdevice
      if (data.deviceId) {
        await saveDevice(data as MyDeviceModel)
      }
      break

    case "current":
      // Aktuelle Daten - kann einzelnes Objekt oder Array sein
      if (Array.isArray(data)) {
        for (const currentData of data) {
          if (currentData.deviceId) {
            await saveCurrentData(currentData as MyCurrentDataModel)
          }
        }
      } else if (data.deviceId) {
        await saveCurrentData(data as MyCurrentDataModel)
      }
      break

    case "operating":
      // Operating Report
      if (data.deviceId) {
        await saveOperatingReport(data as OperatingReportModel)
      }
      break

    case "report":
      // Vollständiger Report
      if (data.deviceId) {
        await saveReport(data as ReportModel)
      }
      break

    default:
      console.log(`No database handler for endpoint: ${endpoint}`)
  }
}

/**
 * GET-Endpunkt zum Abrufen aller Devices aus der lokalen Datenbank
 */
export async function GET() {
  try {
    const { getAllDevices } = await import("@/lib/powerfox-db")
    const devices = await getAllDevices()
    return NextResponse.json(devices)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to fetch devices from database" },
      { status: 500 }
    )
  }
}
