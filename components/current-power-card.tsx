"use client"

import { Zap, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePowerfoxCurrentData } from "@/hooks/use-powerfox-api"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"

interface CurrentPowerCardProps {
  deviceId: string | null
}

export function CurrentPowerCard({ deviceId }: CurrentPowerCardProps) {
  const { data, error, isLoading } = usePowerfoxCurrentData(deviceId, 'kwh')
  const t = useTranslations("currentPowerCard")
  const tCommon = useTranslations("common")

  if (!deviceId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
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
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-4 w-32" />
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
  const watt = data?.watt || 0
  const isExporting = watt < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        {isExporting ? (
          <TrendingDown className="h-4 w-4 text-primary" />
        ) : (
          <TrendingUp className="h-4 w-4 text-chart-3" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {Math.abs(watt).toLocaleString()} W
        </div>
        <p className="text-xs text-muted-foreground">
          {isExporting ? t("feedingIntoGrid") : t("consumingFromGrid")}
        </p>
        {data?.outdated && (
          <p className="mt-1 text-xs text-chart-3">{t("dataOutdated")}</p>
        )}
      </CardContent>
    </Card>
  )
}
