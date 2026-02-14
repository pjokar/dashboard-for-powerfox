import { NextRequest, NextResponse } from "next/server"
import {
  getApiLogs,
  getApiLogsByEndpoint,
  getFailedApiLogs,
  deleteOldApiLogs,
} from "@/lib/powerfox-db"

/**
 * GET /api/powerfox/logs
 * 
 * Query-Parameter:
 * - limit: Anzahl der Einträge (default: 100)
 * - endpoint: Filter nach bestimmtem Endpoint (optional)
 * - failed: Nur fehlgeschlagene Logs (optional, boolean)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get("limit") || "100")
    const endpoint = searchParams.get("endpoint")
    const failedOnly = searchParams.get("failed") === "true"

    let logs

    if (failedOnly) {
      logs = await getFailedApiLogs(limit)
    } else if (endpoint) {
      logs = await getApiLogsByEndpoint(endpoint, limit)
    } else {
      logs = await getApiLogs(limit)
    }

    // Parse JSON strings zurück zu Objekten für bessere Lesbarkeit
    const parsedLogs = logs.map(log => ({
      ...log,
      params: log.params ? JSON.parse(log.params) : null,
      responseData: log.responseData ? JSON.parse(log.responseData) : null,
    }))

    return NextResponse.json({
      count: parsedLogs.length,
      logs: parsedLogs,
    })
  } catch (error) {
    console.error("Failed to fetch API logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch API logs" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/powerfox/logs
 * 
 * Query-Parameter:
 * - days: Anzahl der Tage, die behalten werden sollen (default: 7)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "7")

    const result = await deleteOldApiLogs(days)

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Deleted logs older than ${days} days`,
    })
  } catch (error) {
    console.error("Failed to delete old API logs:", error)
    return NextResponse.json(
      { error: "Failed to delete old API logs" },
      { status: 500 }
    )
  }
}
