import { NextRequest, NextResponse } from "next/server"
import { fetchReport } from "@/lib/powerfox-api"
import { prisma } from "@/lib/db"
import { COOKIE_NAME, parseAuthCookie } from "@/lib/powerfox-auth"

/**
 * API Route für zeitbasierte Durchschnittsberechnungen
 * 
 * Nutzt direkt die Powerfox API /report Endpunkt
 * Credentials aus HttpOnly-Cookie.
 * API-Parameter-Kombinationen:
 * - year: Monatswerte
 * - year + month: Tageswerte
 * - year + month + day: Stundenwerte
 * - year + month + day + fromHour: Viertelstundenwerte (6 Stunden)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, year, month, day, fromHour, fromMinute } = body

    const cookie = request.cookies.get(COOKIE_NAME)
    const credentials = cookie ? parseAuthCookie(cookie.value) : null

    if (!credentials) {
      return NextResponse.json(
        { error: "Missing or invalid credentials cookie" },
        { status: 401 }
      )
    }
    
    // Stelle sicher, dass fromHour und fromMinute undefined sind, wenn nicht gesetzt
    const fromHourValue = fromHour !== undefined && fromHour !== null ? fromHour : undefined
    const fromMinuteValue = fromMinute !== undefined && fromMinute !== null ? fromMinute : undefined

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
        { status: 400 }
      )
    }

    if (!year) {
      return NextResponse.json(
        { error: "year is required" },
        { status: 400 }
      )
    }

    // Validierung: Tag erfordert Monat, Monat erfordert Jahr
    if (day && !month) {
      return NextResponse.json(
        { error: "day requires month to be set" },
        { status: 400 }
      )
    }

    if (month && !year) {
      return NextResponse.json(
        { error: "month requires year to be set" },
        { status: 400 }
      )
    }

    // Validierung: fromHour erfordert year + month + day
    if ((fromHourValue !== undefined || fromMinuteValue !== undefined) && (!year || !month || !day)) {
      return NextResponse.json(
        { error: "fromHour requires year, month, and day to be set" },
        { status: 400 }
      )
    }

    const fromHourNum = fromHourValue !== undefined ? parseInt(fromHourValue.toString()) : undefined
    const fromMinuteNum = fromMinuteValue !== undefined ? parseInt(fromMinuteValue.toString()) : undefined

    // Baue API-Parameter basierend auf Auswahl
    const apiParams: { year: number; month?: number; day?: number; fromhour?: number } = {
      year: parseInt(year),
    }
    
    if (month) {
      apiParams.month = parseInt(month)
    }
    
    if (day) {
      apiParams.day = parseInt(day)
    }
    
    // fromHour nur hinzufügen, wenn year + month + day vorhanden
    if (year && month && day && fromHourNum !== undefined) {
      apiParams.fromhour = fromHourNum
    }
    
    // Berechne Datumsbereich für Anzeige
    let startDate: Date
    let endDate: Date
    
    if (day && month) {
      // Jahr + Monat + Tag: Stundenwerte für den Tag
      startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0)
      endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999)
    } else if (month) {
      // Jahr + Monat: Tageswerte für den Monat
      const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0)
      endDate = new Date(parseInt(year), parseInt(month) - 1, lastDayOfMonth, 23, 59, 59, 999)
    } else {
      // Nur Jahr: Monatswerte für das Jahr
      startDate = new Date(Date.UTC(parseInt(year), 0, 1, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(parseInt(year), 11, 31, 23, 59, 59, 999))
    }

    // Rufe Powerfox API auf
    const reportData = await fetchReport(credentials, deviceId, apiParams)
    const allReportData = reportData ? [reportData] : []

    // Kombiniere alle API-Responses
    let combinedReportData: any = {
      values: [],
      consumption: { reportValues: [] },
      feedIn: { reportValues: [] },
    }
    
    allReportData.forEach((data) => {
      if (data.values && Array.isArray(data.values)) {
        combinedReportData.values.push(...data.values)
      }
      if (data.consumption?.reportValues) {
        combinedReportData.consumption.reportValues.push(...data.consumption.reportValues)
      }
      if (data.feedIn?.reportValues) {
        combinedReportData.feedIn.reportValues.push(...data.feedIn.reportValues)
      }
    })

    // Extrahiere Werte aus combinedReportData
    // API liefert Daten in consumption.reportValues oder feedIn.reportValues
    let data: Array<{ timestamp: number; watt: number | null; aPlus: number | null; aMinus: number | null }> = []

    // Nutze reportValues aus consumption/feedIn (das ist die Standard-Struktur)
    const consumptionValues = combinedReportData.consumption?.reportValues || []
    const feedInValues = combinedReportData.feedIn?.reportValues || []
    
    const timestampMap = new Map<number, any>()
    
    // Kombiniere consumption und feedIn Werte
    // API gibt Werte in kWh zurück (im delta Feld)
    consumptionValues.forEach((v: any) => {
      const ts = v.timestamp || 0
      if (ts) {
        timestampMap.set(ts, {
          timestamp: ts,
          kWh: v.delta || v.consumption || v.deltaKiloWattHour || null, // API gibt kWh zurück
          aPlus: v.delta || v.deltaKiloWattHour || null,
          aMinus: null,
        })
      }
    })
    
    feedInValues.forEach((v: any) => {
      const ts = v.timestamp || 0
      if (ts) {
        const existing = timestampMap.get(ts) || { timestamp: ts }
        existing.kWh = existing.kWh || (v.delta || v.feedIn || v.deltaKiloWattHour || null)
        existing.aMinus = v.delta || v.deltaKiloWattHour || null
        timestampMap.set(ts, existing)
      }
    })
    
    data = Array.from(timestampMap.values()).sort((a, b) => a.timestamp - b.timestamp)

    // Filtere nach Uhrzeit (nur wenn fromHour verwendet wurde)
    // fromHour wird nur bei year + month + day unterstützt
    let filteredByTime = data
    
    if (year && month && day && fromHourNum !== undefined && fromHourNum >= 0) {
      // Filtere ab fromHour
      filteredByTime = data.filter((entry) => {
        if (!entry.timestamp || entry.timestamp === 0) {
          return false
        }
        
        const date = new Date(entry.timestamp * 1000)
        const hour = date.getHours()
        const minute = date.getMinutes()
        
        const entryMinutes = hour * 60 + minute
        const fromMinutes = fromHourNum * 60 + (fromMinuteNum || 0)
        
        // Daten ab fromHour bis 23:59
        return entryMinutes >= fromMinutes
      })
    }

    // Gruppiere nach Tag
    const groupedByDay = new Map<string, typeof data>()
    
    filteredByTime.forEach((entry) => {
      const date = new Date(entry.timestamp * 1000)
      const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      
      if (!groupedByDay.has(dayKey)) {
        groupedByDay.set(dayKey, [])
      }
      groupedByDay.get(dayKey)!.push(entry)
    })

    // Berechne Durchschnitte und Summen pro Tag
    // Werte sind in kWh für Hourly, Daily, Monthly
    const dailyStats = Array.from(groupedByDay.entries()).map(([day, entries]) => {
      const kWhValues = entries.map(e => e.kWh || 0).filter(v => v !== null)
      const aPlusValues = entries.map(e => e.aPlus || 0).filter(v => v !== null)
      const aMinusValues = entries.map(e => e.aMinus || 0).filter(v => v !== null)

      const sumKWh = kWhValues.length > 0
        ? kWhValues.reduce((a, b) => a + b, 0)
        : 0
      
      return {
        date: day,
        count: entries.length,
        sumKWh,
        avgWatt: kWhValues.length > 0 
          ? sumKWh / kWhValues.length 
          : 0,
        maxWatt: kWhValues.length > 0 ? Math.max(...kWhValues) : 0,
        minWatt: kWhValues.length > 0 ? Math.min(...kWhValues) : 0,
        avgAPlus: aPlusValues.length > 0
          ? aPlusValues.reduce((a, b) => a + b, 0) / aPlusValues.length
          : 0,
        avgAMinus: aMinusValues.length > 0
          ? aMinusValues.reduce((a, b) => a + b, 0) / aMinusValues.length
          : 0,
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    // Berechne Gesamtdurchschnitt und -summe
    const totalAvgWatt = dailyStats.length > 0
      ? dailyStats.reduce((sum, day) => sum + day.avgWatt, 0) / dailyStats.length
      : 0
    
    const totalMaxWatt = dailyStats.length > 0
      ? Math.max(...dailyStats.map(d => d.maxWatt))
      : 0
    
    const totalMinWatt = dailyStats.length > 0
      ? Math.min(...dailyStats.map(d => d.minWatt))
      : 0

    const totalSumKWh = dailyStats.length > 0
      ? dailyStats.reduce((sum, day) => sum + day.sumKWh, 0)
      : 0

    const totalEntries = filteredByTime.length

    // Speichere Daten in die entsprechende Tabelle basierend auf Zeitgranularität
    if (totalEntries > 0) {
      try {
        const yearNum = parseInt(year)
        const monthNum = month ? parseInt(month) : undefined
        const dayNum = day ? parseInt(day) : undefined
        
        // Bestimme Granularität
        const isQuarterHourly = yearNum && monthNum && dayNum && fromHourNum !== undefined
        const isHourly = yearNum && monthNum && dayNum && !isQuarterHourly
        const isDaily = yearNum && monthNum && !dayNum
        const isMonthly = yearNum && !monthNum

        if (isQuarterHourly) {
          for (const entry of filteredByTime) {
            if (!entry.timestamp) continue
            
            const date = new Date(entry.timestamp * 1000)
            const entryYear = date.getFullYear()
            const entryMonth = date.getMonth() + 1
            const entryDay = date.getDate()
            const entryHour = date.getHours()
            const entryMinute = date.getMinutes()
            
            // Runde auf Viertelstunden (0, 15, 30, 45)
            const roundedMinute = Math.floor(entryMinute / 15) * 15
            
            await prisma.quarterHourlyReportValue.upsert({
              where: {
                deviceId_year_month_day_hour_minute: {
                  deviceId,
                  year: entryYear,
                  month: entryMonth,
                  day: entryDay,
                  hour: entryHour,
                  minute: roundedMinute,
                },
              },
              update: {
                watt: entry.watt,
                aPlus: entry.aPlus,
                aMinus: entry.aMinus,
                timestamp: entry.timestamp,
              },
              create: {
                deviceId,
                year: entryYear,
                month: entryMonth,
                day: entryDay,
                hour: entryHour,
                minute: roundedMinute,
                timestamp: entry.timestamp,
                watt: entry.watt,
                aPlus: entry.aPlus,
                aMinus: entry.aMinus,
              },
            })
          }
        } else if (isHourly) {
          // Gruppiere nach Stunde
          const hourlyGroups = new Map<number, typeof filteredByTime>()
          for (const entry of filteredByTime) {
            if (!entry.timestamp) continue
            
            const date = new Date(entry.timestamp * 1000)
            const entryHour = date.getHours()
            
            if (!hourlyGroups.has(entryHour)) {
              hourlyGroups.set(entryHour, [])
            }
            hourlyGroups.get(entryHour)!.push(entry)
          }
          
          // Speichere aggregierte Werte pro Stunde (in kWh)
          for (const [entryHour, entries] of hourlyGroups.entries()) {
            // Berechne Durchschnittswerte für die Stunde (Werte sind bereits in kWh)
            const kWhValues = entries.map(e => e.kWh).filter(v => v !== null) as number[]
            const aPlusValues = entries.map(e => e.aPlus).filter(v => v !== null) as number[]
            const aMinusValues = entries.map(e => e.aMinus).filter(v => v !== null) as number[]
            
            const avgKWh = kWhValues.length > 0 
              ? kWhValues.reduce((a, b) => a + b, 0) / kWhValues.length 
              : null
            const avgAPlus = aPlusValues.length > 0
              ? aPlusValues.reduce((a, b) => a + b, 0) / aPlusValues.length
              : null
            const avgAMinus = aMinusValues.length > 0
              ? aMinusValues.reduce((a, b) => a + b, 0) / aMinusValues.length
              : null
            
            // Verwende den ersten Timestamp der Stunde
            const firstTimestamp = entries[0]?.timestamp || 0
            const date = new Date(firstTimestamp * 1000)
            
            await prisma.hourlyReportValue.upsert({
              where: {
                deviceId_year_month_day_hour: {
                  deviceId,
                  year: date.getFullYear(),
                  month: date.getMonth() + 1,
                  day: date.getDate(),
                  hour: entryHour,
                },
              },
              update: {
                kWh: avgKWh,
                aPlus: avgAPlus,
                aMinus: avgAMinus,
                timestamp: firstTimestamp,
              },
              create: {
                deviceId,
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                hour: entryHour,
                timestamp: firstTimestamp,
                kWh: avgKWh,
                aPlus: avgAPlus,
                aMinus: avgAMinus,
              },
            })
          }
        } else if (isDaily) {
          // Gruppiere nach Tag
          const dailyGroups = new Map<number, typeof filteredByTime>()
          for (const entry of filteredByTime) {
            if (!entry.timestamp) continue
            
            const date = new Date(entry.timestamp * 1000)
            const entryDay = date.getDate()
            
            if (!dailyGroups.has(entryDay)) {
              dailyGroups.set(entryDay, [])
            }
            dailyGroups.get(entryDay)!.push(entry)
          }
          
          // Speichere aggregierte Werte pro Tag (in kWh)
          for (const [entryDay, entries] of dailyGroups.entries()) {
            // Berechne Durchschnittswerte für den Tag (Werte sind bereits in kWh)
            const kWhValues = entries.map(e => e.kWh).filter(v => v !== null) as number[]
            const aPlusValues = entries.map(e => e.aPlus).filter(v => v !== null) as number[]
            const aMinusValues = entries.map(e => e.aMinus).filter(v => v !== null) as number[]
            
            const avgKWh = kWhValues.length > 0 
              ? kWhValues.reduce((a, b) => a + b, 0) / kWhValues.length 
              : null
            const avgAPlus = aPlusValues.length > 0
              ? aPlusValues.reduce((a, b) => a + b, 0) / aPlusValues.length
              : null
            const avgAMinus = aMinusValues.length > 0
              ? aMinusValues.reduce((a, b) => a + b, 0) / aMinusValues.length
              : null
            
            // Verwende den ersten Timestamp des Tages
            const firstTimestamp = entries[0]?.timestamp || 0
            
            await prisma.dailyReportValue.upsert({
              where: {
                deviceId_year_month_day: {
                  deviceId,
                  year: yearNum,
                  month: monthNum!,
                  day: entryDay,
                },
              },
              update: {
                kWh: avgKWh,
                aPlus: avgAPlus,
                aMinus: avgAMinus,
                timestamp: firstTimestamp,
              },
              create: {
                deviceId,
                year: yearNum,
                month: monthNum!,
                day: entryDay,
                timestamp: firstTimestamp,
                kWh: avgKWh,
                aPlus: avgAPlus,
                aMinus: avgAMinus,
              },
            })
          }
        } else if (isMonthly) {
          // Gruppiere nach Monat
          const monthlyGroups = new Map<number, typeof filteredByTime>()
          for (const entry of filteredByTime) {
            if (!entry.timestamp) continue
            
            const date = new Date(entry.timestamp * 1000)
            const entryMonth = date.getMonth() + 1
            
            if (!monthlyGroups.has(entryMonth)) {
              monthlyGroups.set(entryMonth, [])
            }
            monthlyGroups.get(entryMonth)!.push(entry)
          }
          
          // Speichere aggregierte Werte pro Monat (in kWh)
          for (const [entryMonth, entries] of monthlyGroups.entries()) {
            // Berechne Durchschnittswerte für den Monat (Werte sind bereits in kWh)
            const kWhValues = entries.map(e => e.kWh).filter(v => v !== null) as number[]
            const aPlusValues = entries.map(e => e.aPlus).filter(v => v !== null) as number[]
            const aMinusValues = entries.map(e => e.aMinus).filter(v => v !== null) as number[]
            
            const avgKWh = kWhValues.length > 0 
              ? kWhValues.reduce((a, b) => a + b, 0) / kWhValues.length 
              : null
            const avgAPlus = aPlusValues.length > 0
              ? aPlusValues.reduce((a, b) => a + b, 0) / aPlusValues.length
              : null
            const avgAMinus = aMinusValues.length > 0
              ? aMinusValues.reduce((a, b) => a + b, 0) / aMinusValues.length
              : null
            
            // Verwende den ersten Timestamp des Monats
            const firstTimestamp = entries[0]?.timestamp || 0
            
            await prisma.monthlyReportValue.upsert({
              where: {
                deviceId_year_month: {
                  deviceId,
                  year: yearNum,
                  month: entryMonth,
                },
              },
              update: {
                kWh: avgKWh,
                aPlus: avgAPlus,
                aMinus: avgAMinus,
                timestamp: firstTimestamp,
              },
              create: {
                deviceId,
                year: yearNum,
                month: entryMonth,
                timestamp: firstTimestamp,
                kWh: avgKWh,
                aPlus: avgAPlus,
                aMinus: avgAMinus,
              },
            })
          }
        }
      } catch (dbError: any) {
        console.error('[/api/reports/timespan] Error saving to database:', dbError)
        // Fehler beim Speichern sollte die Antwort nicht verhindern
      }
    }

    const hasFromHour = year && month && day && fromHourNum !== undefined && fromHourNum >= 0
    
    return NextResponse.json({
      success: true,
      parameters: {
        year: parseInt(year),
        month: month ? parseInt(month) : undefined,
        day: day ? parseInt(day) : undefined,
        fromHour: hasFromHour ? fromHourNum : undefined,
      },
      dataSource: 'api',
      timeRange: hasFromHour ? {
        from: `${fromHourNum.toString().padStart(2, '0')}:${(fromMinuteNum || 0).toString().padStart(2, '0')}`,
        to: "23:59",
      } : {
        from: "00:00",
        to: "23:59",
        note: hasFromHour ? undefined : (day ? "fromHour nicht angegeben" : "fromHour nur mit Jahr + Monat + Tag möglich"),
      },
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        formatted: {
          from: startDate.toLocaleDateString('de-DE'),
          to: endDate.toLocaleDateString('de-DE'),
        }
      },
      summary: {
        totalDays: dailyStats.length,
        totalEntries,
        avgWatt: Math.round(totalAvgWatt * 100) / 100,
        maxWatt: Math.round(totalMaxWatt * 100) / 100,
        minWatt: Math.round(totalMinWatt * 100) / 100,
        sumKWh: Math.round(totalSumKWh * 100) / 100,
      },
      dailyStats,
      // Alle einzelnen Einträge (nicht aggregiert) für die detaillierte Übersicht
      entries: filteredByTime.map((entry) => ({
        timestamp: entry.timestamp,
        date: new Date(entry.timestamp * 1000).toISOString().split('T')[0],
        datetime: new Date(entry.timestamp * 1000).toISOString(),
        kWh: entry.kWh || null,
        aPlus: entry.aPlus || null,
        aMinus: entry.aMinus || null,
      })),
      warning: totalEntries === 0 ? 
        (hasFromHour 
          ? `Keine Daten gefunden für den Zeitraum ${startDate.toLocaleDateString('de-DE')} - ${endDate.toLocaleDateString('de-DE')} ab ${fromHourNum}:${(fromMinuteNum || 0).toString().padStart(2, '0')} Uhr. Bitte wähle einen anderen Zeitraum oder prüfe, ob Daten vorhanden sind.`
          : `Keine Daten gefunden für den Zeitraum ${startDate.toLocaleDateString('de-DE')} - ${endDate.toLocaleDateString('de-DE')}. Bitte wähle einen anderen Zeitraum oder prüfe, ob Daten vorhanden sind.`)
        : undefined,
    })

  } catch (error: any) {
    console.error("[/api/reports/timespan] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    )
  }
}
