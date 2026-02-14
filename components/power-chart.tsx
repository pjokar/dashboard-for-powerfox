"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePowerfoxOperatingReport } from "@/hooks/use-powerfox-api"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Activity } from "lucide-react"
import { useTranslations } from "next-intl"

interface PowerChartProps {
  deviceId: string | null
}

export function PowerChart({ deviceId }: PowerChartProps) {
  const { data, error, isLoading } = usePowerfoxOperatingReport(deviceId)
  const t = useTranslations("powerChart")
  const tCommon = useTranslations("common")

  // Daten sind bereits gemappt (camelCase von API-Schicht)
  const chartData = useMemo(() => {
    if (!data?.values || !Array.isArray(data.values)) return []

    return data.values.map((item: any) => ({
      time: new Date((item.timestamp || 0) * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      power: item.average || item.value || 0,
      min: item.min || 0,
      max: item.max || 0,
    }))
  }, [data])

  if (!deviceId) {
    return (
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{tCommon("noDeviceSelected")}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="col-span-full">
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

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.2 145)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.2 145)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
              <XAxis
                dataKey="time"
                stroke="oklch(0.6 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(0.6 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}W`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.16 0 0)",
                  border: "1px solid oklch(0.25 0 0)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                labelStyle={{ color: "oklch(0.6 0 0)" }}
                formatter={(value: number) => [`${value.toFixed(0)} W`, "Power"]}
              />
              <Area
                type="monotone"
                dataKey="power"
                stroke="oklch(0.65 0.2 145)"
                fill="url(#powerGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
