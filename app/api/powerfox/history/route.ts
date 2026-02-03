import { NextRequest, NextResponse } from "next/server"
import {
  getLatestCurrentData,
  getCurrentDataByTimeRange,
  getOperatingReports,
  getReports,
} from "@/lib/powerfox-db"

/**
 * GET /api/powerfox/history
 * 
 * Query-Parameter:
 * - deviceId (required): Device ID
 * - type: "current" | "operating" | "reports" (default: "current")
 * - limit: Anzahl der Einträge (default: 100)
 * - startTimestamp: Unix-Timestamp für Zeitraum-Filter (optional)
 * - endTimestamp: Unix-Timestamp für Zeitraum-Filter (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const deviceId = searchParams.get("deviceId")
    const type = searchParams.get("type") || "current"
    const limit = parseInt(searchParams.get("limit") || "100")
    const startTimestamp = searchParams.get("startTimestamp")
    const endTimestamp = searchParams.get("endTimestamp")

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
        { status: 400 }
      )
    }

    let data

    switch (type) {
      case "current":
        if (startTimestamp && endTimestamp) {
          data = await getCurrentDataByTimeRange(
            deviceId,
            parseInt(startTimestamp),
            parseInt(endTimestamp)
          )
        } else {
          data = await getLatestCurrentData(deviceId, limit)
        }
        break

      case "operating":
        data = await getOperatingReports(deviceId, limit)
        break

      case "reports":
        data = await getReports(deviceId, limit)
        break

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      deviceId,
      type,
      count: Array.isArray(data) ? data.length : 0,
      data,
    })
  } catch (error) {
    console.error("Database query error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data from database" },
      { status: 500 }
    )
  }
}
