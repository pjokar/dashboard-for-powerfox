"use client"

import { Zap, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentData } from "@/hooks/use-powerfox"
import { Skeleton } from "@/components/ui/skeleton"

interface CurrentPowerCardProps {
  deviceId: string | null
}

export function CurrentPowerCard({ deviceId }: CurrentPowerCardProps) {
  const { data, error, isLoading } = useCurrentData(deviceId)

  if (!deviceId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Power</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
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
          <CardTitle className="text-sm font-medium">Current Power</CardTitle>
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
          <CardTitle className="text-sm font-medium">Current Power</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const watt = data?.Watt || 0
  const isExporting = watt < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Power</CardTitle>
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
          {isExporting ? "Feeding into grid" : "Consuming from grid"}
        </p>
        {data?.Outdated && (
          <p className="mt-1 text-xs text-chart-3">Data may be outdated</p>
        )}
      </CardContent>
    </Card>
  )
}
