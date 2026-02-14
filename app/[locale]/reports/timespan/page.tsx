"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Clock, TrendingUp, TrendingDown, BarChart3, AlertCircle, Calendar, ArrowLeft } from "lucide-react"
import { Nav } from "@/components/nav"
import { Link } from "@/i18n/navigation"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart } from "recharts"
import useSWR from "swr"
import { usePowerfoxStore, handleSessionInvalid } from "@/lib/powerfox-store"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useTranslations } from "next-intl"

// Fetcher für Devices
async function devicesFetcher(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export default function TimespanReportPage() {
  const isAuth = useRequireAuth()
  const credentials = usePowerfoxStore((state) => state.credentials)
  const t = useTranslations("reportsTimespan")
  const tCommon = useTranslations("common")
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [year, setYear] = useState<string>("")
  const [month, setMonth] = useState<string>("")
  const [day, setDay] = useState<string>("")
  const [fromHour, setFromHour] = useState("")
  const [fromMinute, setFromMinute] = useState("00")
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([])
  
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // Generiere Jahre (letztes Jahr bis aktuelles Jahr)
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 4 + i).toString())
  
  // Generiere Monate (1-12)
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  
  // Generiere Tage basierend auf ausgewähltem Monat und Jahr
  const getDaysInMonth = () => {
    if (!year || !month) return []
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'))
  }
  
  const days = getDaysInMonth()
  
  // Validierung
  const isValid = () => {
    if (!year) return false
    if (month && !year) return false
    if (day && (!month || !year)) return false
    return true
  }
  
  const canUseFromHour = () => {
    return year && month && day
  }

  // Lade Devices aus DB
  const { data: devices } = useSWR("/api/powerfox/save", devicesFetcher, { revalidateOnFocus: false })

  const handleGenerateReport = async () => {
    if (!selectedDevice) {
      setError(t("errorSelectDevice"))
      return
    }

    if (!credentials) {
      setError(t("errorCredentials"))
      return
    }

    if (!isValid()) {
      setError("Bitte wähle mindestens ein Jahr aus. Tag erfordert Monat und Jahr.")
      return
    }

    setLoading(true)
    setError(null)
    setReportData(null)
    setSelectedEntryIds([])

    try {
      const response = await fetch("/api/reports/timespan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDevice,
          year: year ? parseInt(year) : undefined,
          month: month ? parseInt(month) : undefined,
          day: day ? parseInt(day) : undefined,
          fromHour: canUseFromHour() && fromHour && fromHour.trim() !== "" ? parseInt(fromHour) : undefined,
          fromMinute: canUseFromHour() && fromMinute && fromMinute.trim() !== "" ? parseInt(fromMinute) : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionInvalid()
          return
        }
        throw new Error(data.error || t("errorGenerate"))
      }

      setReportData(data)
    } catch (err: any) {
      setError(err.message || "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }
  
  const getDateLabel = () => {
    if (day && month && year) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('de-DE', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    }
    if (month && year) {
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    }
    if (year) {
      return `Jahr ${year}`
    }
    return "Keine Auswahl"
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']

  // Auswahl-Logik für Detail-Einträge
  const allEntryIds = reportData?.entries?.map((entry: any, index: number) => `${entry.timestamp}-${index}`) ?? []
  const allSelected = allEntryIds.length > 0 && allEntryIds.every((id: string) => selectedEntryIds.includes(id))

  const selectedEntries =
    reportData?.entries?.filter((entry: any, index: number) =>
      selectedEntryIds.includes(`${entry.timestamp}-${index}`)
    ) ?? []

  const selectedSumKWh = selectedEntries.reduce(
    (sum: number, entry: any) => sum + (entry.kWh ?? 0),
    0
  )
  const selectedSumAPlus = selectedEntries.reduce(
    (sum: number, entry: any) => sum + (entry.aPlus ?? 0),
    0
  )
  const selectedSumAMinus = selectedEntries.reduce(
    (sum: number, entry: any) => sum + (entry.aMinus ?? 0),
    0
  )

  if (!isAuth) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="mb-6">
          <Link href="/reports">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToReports")}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("configTitle")}</CardTitle>
            <CardDescription>{t("configDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t("device")}</Label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder={tCommon("selectDevice")} />
                </SelectTrigger>
                <SelectContent>
                  {devices?.map((device: any) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.name || device.deviceId}
                            {device.mainDevice && (
                        <span className="ml-2 rounded bg-primary/20 px-1 text-xs text-primary">
                          {tCommon("main")}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Jahr */}
            <div className="space-y-2">
              <Label>Jahr *</Label>
              <Select value={year} onValueChange={(v) => {
                setYear(v)
                if (!v) {
                  setMonth("")
                  setDay("")
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Jahr auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Erforderlich. Liefert Monatswerte für das Jahr.
              </p>
            </div>

            {/* Monat */}
            {year && (
              <div className="space-y-2">
                <Label>Monat (optional)</Label>
                <Select value={month} onValueChange={(v) => {
                  setMonth(v)
                  if (!v) {
                    setDay("")
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Monat auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>
                        {new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleDateString('de-DE', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Optional. Mit Jahr: Liefert Tageswerte für den Monat.
                </p>
              </div>
            )}

            {/* Tag */}
            {year && month && (
              <div className="space-y-2">
                <Label>Tag (optional)</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tag auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Optional. Mit Jahr + Monat: Liefert Stundenwerte für den Tag.
                </p>
              </div>
            )}

            {/* Info */}
            {!credentials && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bitte konfiguriere zuerst deine Powerfox-Credentials in den Einstellungen.
                </AlertDescription>
              </Alert>
            )}
            

            {/* Start-Uhrzeit (fromHour) - nur bei Jahr + Monat + Tag möglich */}
            {canUseFromHour() && (
              <div className="space-y-2">
                <Label>Start-Uhrzeit (fromHour) - Optional</Label>
                <div className="flex gap-2">
                  <Select value={fromHour || "none"} onValueChange={(value) => setFromHour(value === "none" ? "" : value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">--</SelectItem>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center">:</span>
                  <Select value={fromMinute || "none"} onValueChange={(value) => setFromMinute(value === "none" ? "" : value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">--</SelectItem>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="ml-2 flex items-center text-sm text-muted-foreground">Uhr</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional: Mit Jahr + Monat + Tag: Liefert Viertelstundenwerte ab dieser Uhrzeit für 6 Stunden (24 Werte).
                  Wenn nicht angegeben, werden alle Stundenwerte (0-23) geliefert.
                </p>
              </div>
            )}
            
            {/* Info wenn fromHour nicht verfügbar */}
            {!canUseFromHour() && year && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Hinweis:</strong> <code className="text-xs bg-muted px-1 rounded">fromHour</code> ist nur verfügbar, wenn Jahr + Monat + Tag ausgewählt sind.
                  <br />
                  Aktuell: {getDateLabel()}
                </AlertDescription>
              </Alert>
            )}

            {/* API-Parameter Info */}
            {year && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>API-Parameter:</strong>
                  <ul className="mt-1 ml-4 list-disc space-y-0.5">
                    {!month && !day && (
                      <li><code>year={year}</code> → Liefert Monatswerte für das Jahr</li>
                    )}
                    {month && !day && (
                      <li><code>year={year}, month={month}</code> → Liefert Tageswerte für den Monat</li>
                    )}
                    {month && day && !canUseFromHour() && (
                      <li><code>year={year}, month={month}, day={day}</code> → Liefert Stundenwerte für den Tag</li>
                    )}
                    {canUseFromHour() && (
                      <>
                        <li><code>year={year}, month={month}, day={day}</code> → Liefert Stundenwerte für den Tag</li>
                        {fromHour && (
                          <li><code>year={year}, month={month}, day={day}, fromHour={fromHour}</code> → Liefert Viertelstundenwerte ab {fromHour}:{fromMinute} Uhr (6 Stunden)</li>
                        )}
                      </>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedDevice || loading || !credentials || !isValid()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Report wird generiert...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Report generieren
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Warnung wenn keine Daten */}
        {reportData?.warning && (
          <Alert className="mb-6" variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{reportData.warning}</AlertDescription>
          </Alert>
        )}

        {/* Ergebnisse */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-4 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Zeitraum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getDateLabel()}</div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.dateRange.formatted.from} - {reportData.dateRange.formatted.to}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reportData.timeRange.note ? (
                      <span>{reportData.timeRange.note}</span>
                    ) : (
                      <span>Ab {reportData.timeRange.from} Uhr (bis 23:59)</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    API: {reportData.parameters?.year}
                    {reportData.parameters?.month && `, Monat ${reportData.parameters.month}`}
                    {reportData.parameters?.day && `, Tag ${reportData.parameters.day}`}
                    {reportData.parameters?.fromHour !== undefined && `, fromHour ${reportData.parameters.fromHour}`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Ø Verbrauch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.summary.avgWatt.toLocaleString()} kWh
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.summary.totalDays} Tage • {reportData.summary.totalEntries} Messwerte
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-chart-3" />
                    Maximum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-3">
                    {reportData.summary.maxWatt.toLocaleString()} kWh
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Höchster Wert im Zeitraum
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    Minimum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {reportData.summary.minWatt.toLocaleString()} kWh
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Niedrigster Wert im Zeitraum
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Summe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.summary.sumKWh.toLocaleString()} kWh
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gesamtverbrauch im Zeitraum
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Täglicher Verlauf Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Täglicher Durchschnitt</CardTitle>
                <CardDescription>
                  {reportData.timeRange.note ? (
                    <>Durchschnittliche Leistung pro Tag (ganzer Tag)</>
                  ) : (
                    <>Durchschnittliche Leistung pro Tag ab {reportData.timeRange.from} Uhr (bis 23:59)</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={reportData.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
                      <XAxis
                        dataKey="date"
                        stroke="oklch(0.6 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return `${date.getDate()}.${date.getMonth() + 1}.`
                        }}
                      />
                      <YAxis
                        stroke="oklch(0.6 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} kWh`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.16 0 0)",
                          border: "1px solid oklch(0.25 0 0)",
                          borderRadius: "8px",
                          color: "oklch(0.95 0 0)",
                        }}
                        labelFormatter={(value) => {
                          const date = new Date(value)
                          return date.toLocaleDateString('de-DE', { 
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })
                        }}
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            avgWatt: 'Ø Leistung',
                            maxWatt: 'Maximum',
                            minWatt: 'Minimum',
                          }
                          return [`${value.toFixed(2)} kWh`, labels[name] || name]
                        }}
                      />
                      <Bar
                        dataKey="avgWatt"
                        fill="oklch(0.7 0.15 220)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxWatt"
                        stroke="oklch(0.7 0.2 30)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="minWatt"
                        stroke="oklch(0.65 0.2 145)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detaillierte Tabelle */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Detaillierte Übersicht</CardTitle>
                <CardDescription>
                  Alle einzelnen Messwerte für den Zeitraum ({reportData.entries?.length || 0} Einträge)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => {
                              if (allSelected) {
                                setSelectedEntryIds([])
                              } else {
                                setSelectedEntryIds(allEntryIds)
                              }
                            }}
                          />
                        </th>
                        <th className="px-4 py-2 text-left font-medium">Datum & Uhrzeit</th>
                        <th className="px-4 py-2 text-right font-medium">kWh</th>
                        <th className="px-4 py-2 text-right font-medium">A+ (kWh)</th>
                        <th className="px-4 py-2 text-right font-medium">A- (kWh)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.entries?.map((entry: any, index: number) => {
                        const date = new Date(entry.timestamp * 1000)
                        const entryId = `${entry.timestamp}-${index}`
                        const isSelected = selectedEntryIds.includes(entryId)
                        return (
                          <tr key={entryId} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedEntryIds((prev) =>
                                    prev.includes(entryId)
                                      ? prev.filter((id) => id !== entryId)
                                      : [...prev, entryId]
                                  )
                                }}
                              />
                            </td>
                            <td className="px-4 py-2">
                              {date.toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}{' '}
                              {date.toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {entry.kWh !== null ? entry.kWh.toFixed(2) : '-'} {entry.kWh !== null && 'kWh'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {entry.aPlus !== null ? entry.aPlus.toFixed(2) : '-'} {entry.aPlus !== null && 'kWh'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {entry.aMinus !== null ? entry.aMinus.toFixed(2) : '-'} {entry.aMinus !== null && 'kWh'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summe der ausgewählten Einträge */}
                <div className="mt-4 text-xs text-muted-foreground">
                  {selectedEntryIds.length > 0 ? (
                    <div className="space-y-1">
                      <div>
                        Ausgewählte Einträge: <span className="font-medium">{selectedEntryIds.length}</span>
                      </div>
                      <div>
                        Summe kWh:{' '}
                        <span className="font-medium">
                          {selectedSumKWh.toFixed(2)} kWh
                        </span>
                      </div>
                      <div>
                        Summe A+ (kWh):{' '}
                        <span className="font-medium">
                          {selectedSumAPlus.toFixed(2)} kWh
                        </span>
                      </div>
                      <div>
                        Summe A- (kWh):{' '}
                        <span className="font-medium">
                          {selectedSumAMinus.toFixed(2)} kWh
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span>Keine Einträge ausgewählt.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
