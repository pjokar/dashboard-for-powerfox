"use client"

import { Gauge, ArrowDown, ArrowUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentData } from "@/hooks/use-powerfox"
import { Skeleton } from "@/components/ui/skeleton"

interface MeterReadingCardProps {
  deviceId: string | null
}

export function MeterReadingCard({ deviceId }: MeterReadingCardProps) {
  const { data, error, isLoading } = useCurrentData(deviceId)

  if (!deviceId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meter Readings</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No device selected</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meter Readings</CardTitle>
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
          <CardTitle className="text-sm font-medium">Meter Readings</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const consumption = data?.A_Plus || 0
  const feedIn = data?.A_Minus || 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Meter Readings</CardTitle>
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
            <p className="text-xs text-muted-foreground">Consumption</p>
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
              <p className="text-xs text-muted-foreground">Feed-in</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
