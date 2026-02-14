"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar as CalendarIcon, FileText, Loader2, Info } from "lucide-react"
import { format } from "date-fns"
import { de, enUS } from "date-fns/locale"
import { Link } from "@/i18n/navigation"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { Nav } from "@/components/nav"
import { useTranslations, useLocale } from "next-intl"

async function fetcher(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch")
  return response.json()
}

const dateLocaleMap = { de, en: enUS }

export default function ReportsPage() {
  const isAuth = useRequireAuth()
  const locale = useLocale() as "de" | "en"
  const t = useTranslations("reports")
  const tCommon = useTranslations("common")
  const dateLocale = dateLocaleMap[locale] ?? de

  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [reportType, setReportType] = useState<"current" | "operating" | "reports">("current")

  const { data: devicesData } = useSWR("/api/powerfox/save", fetcher)
  const devices = devicesData || []

  const shouldFetchReport = selectedDevice && dateFrom && dateTo
  const startTimestamp = dateFrom ? Math.floor(dateFrom.getTime() / 1000) : undefined
  const endTimestamp = dateTo ? Math.floor(dateTo.getTime() / 1000) : undefined

  const reportUrl = shouldFetchReport
    ? `/api/powerfox/history?deviceId=${selectedDevice}&type=${reportType}&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}&limit=1000`
    : null

  const { data: reportData, isLoading } = useSWR(reportUrl, fetcher)

  if (!isAuth) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
            <Link href="/reports/timespan">
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {t("timespanReport")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{t("filter")}</CardTitle>
              <CardDescription>{t("filterDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("device")}</Label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon("selectDevice")} />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device: { deviceId: string; name?: string }) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.name || device.deviceId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("dataType")}</Label>
                <Select value={reportType} onValueChange={(v: "current" | "operating" | "reports") => setReportType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">{t("currentData")}</SelectItem>
                    <SelectItem value="operating">{t("operatingReport")}</SelectItem>
                    <SelectItem value="reports">{t("fullReport")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("from")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP", { locale: dateLocale }) : t("selectDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>{t("to")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP", { locale: dateLocale }) : t("selectDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">{t("syncHint")}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("results")}</CardTitle>
              <CardDescription>
                {reportData ? t("resultsDescription", { count: reportData.count }) : t("selectFiltersPrompt")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoading && !shouldFetchReport && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">{t("noFiltersSelected")}</h3>
                  <p className="text-sm text-muted-foreground">{t("selectDeviceAndRange")}</p>
                </div>
              )}

              {!isLoading && reportData && reportData.count === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">{t("noDataFound")}</h3>
                  <p className="text-sm text-muted-foreground">{t("noDataForPeriod")}</p>
                  <Link href="/sync">
                    <Button className="mt-4" variant="outline">
                      {t("goToSync")}
                    </Button>
                  </Link>
                </div>
              )}

              {!isLoading && reportData && reportData.count > 0 && (
                <div className="space-y-4">
                  <div className="rounded-lg border">
                    <div className="max-h-[600px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">{t("timestamp")}</th>
                            {reportType === "current" && (
                              <>
                                <th className="px-4 py-2 text-right font-medium">{t("watt")}</th>
                                <th className="px-4 py-2 text-right font-medium">{t("kwh")}</th>
                                <th className="px-4 py-2 text-right font-medium">A+</th>
                                <th className="px-4 py-2 text-right font-medium">A-</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.data.map((item: { timestamp?: number; watt?: number; kiloWattHour?: number; aPlus?: number; aMinus?: number }, idx: number) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2">
                                {item.timestamp
                                  ? format(new Date(item.timestamp * 1000), "PPpp", { locale: dateLocale })
                                  : "-"}
                              </td>
                              {reportType === "current" && (
                                <>
                                  <td className="px-4 py-2 text-right">{item.watt?.toFixed(0) || "-"} W</td>
                                  <td className="px-4 py-2 text-right">{item.kiloWattHour?.toFixed(2) || "-"} kWh</td>
                                  <td className="px-4 py-2 text-right">{item.aPlus?.toFixed(0) || "-"}</td>
                                  <td className="px-4 py-2 text-right">{item.aMinus?.toFixed(0) || "-"}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {reportType === "current" && reportData.data.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>{t("avgWatt")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {(
                              reportData.data.reduce(
                                (sum: number, d: { watt?: number }) => sum + (d.watt || 0),
                                0
                              ) / reportData.data.length
                            ).toFixed(0)}{" "}
                            W
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>{t("minMaxWatt")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {Math.min(...reportData.data.map((d: { watt?: number }) => d.watt || 0)).toFixed(0)} /{" "}
                            {Math.max(...reportData.data.map((d: { watt?: number }) => d.watt || 0)).toFixed(0)} W
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>{t("entries")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{reportData.count}</div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
