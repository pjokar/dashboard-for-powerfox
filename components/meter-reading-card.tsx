"use client"

import { Gauge, ArrowDown, ArrowUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePowerfoxCurrentData } from "@/hooks/use-powerfox-api"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"

interface MeterReadingCardProps {
  deviceId: string | null
}

export function MeterReadingCard({ deviceId }: MeterReadingCardProps) {
  const { data, error, isLoading } = usePowerfoxCurrentData(deviceId, 'kwh')
  const t = useTranslations("meterReadingCard")
  const tCommon = useTranslations("common")

  if (!deviceId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{tCommon("noDeviceSelected")}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-32" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  // Daten sind bereits gemappt (camelCase von API-Schicht)
  const consumption = data?.aPlus || 0
  const feedIn = data?.aMinus || 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        <Gauge className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <ArrowDown className="h-4 w-4 text-chart-3" />
          <div>
            <p className="text-sm font-medium">
              {consumption.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              kWh
            </p>
            <p className="text-xs text-muted-foreground">{t("consumption")}</p>
          </div>
        </div>
        {feedIn > 0 && (
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {feedIn.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                kWh
              </p>
              <p className="text-xs text-muted-foreground">{t("feedIn")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
