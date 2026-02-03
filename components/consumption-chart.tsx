"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useReportData } from "@/hooks/use-powerfox"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, BarChart3 } from "lucide-react"

interface ConsumptionChartProps {
  deviceId: string | null
}

type Period = "24h" | "day" | "month" | "year"

export function ConsumptionChart({ deviceId }: ConsumptionChartProps) {
  const [period, setPeriod] = useState<Period>("24h")

  const now = new Date()
  const dateParams = useMemo(() => {
    switch (period) {
      case "day":
        return {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        }
      case "month":
        return { year: now.getFullYear(), month: now.getMonth() + 1 }
      case "year":
        return { year: now.getFullYear() }
      default:
        return undefined
    }
  }, [period, now.getFullYear(), now.getMonth(), now.getDate()])

  const { data, error, isLoading } = useReportData(deviceId, period, dateParams)

  const chartData = useMemo(() => {
    if (!data?.Data) return []

    return data.Data.map(
      (item: {
        Timestamp?: number
        Date?: string
        A_Plus?: number
        A_Minus?: number
        Consumption?: number
        FeedIn?: number
      }) => {
        let label = ""
        if (item.Timestamp) {
          const date = new Date(item.Timestamp * 1000)
          if (period === "24h" || period === "day") {
            label = date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          } else if (period === "month") {
            label = date.toLocaleDateString([], { day: "numeric" })
          } else {
            label = date.toLocaleDateString([], { month: "short" })
          }
        } else if (item.Date) {
          label = item.Date
        }

        return {
          label,
          consumption: item.A_Plus || item.Consumption || 0,
          feedIn: item.A_Minus || item.FeedIn || 0,
        }
      }
    )
  }, [data, period])

  const periodLabels: Record<Period, string> = {
    "24h": "Last 24 Hours",
    day: "Today (Hourly)",
    month: "This Month (Daily)",
    year: "This Year (Monthly)",
  }

  if (!deviceId) {
    return (
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Energy Consumption
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No device selected</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Energy Consumption
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
          <CardTitle className="text-sm font-medium">
            Energy Consumption
          </CardTitle>
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
        <CardTitle className="text-sm font-medium">Energy Consumption</CardTitle>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="day">Today (Hourly)</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-muted-foreground">
          {periodLabels[period]}
        </p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
              <XAxis
                dataKey="label"
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
                tickFormatter={(value) =>
                  period === "24h" || period === "day"
                    ? `${value}Wh`
                    : `${value}kWh`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.16 0 0)",
                  border: "1px solid oklch(0.25 0 0)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                labelStyle={{ color: "oklch(0.6 0 0)" }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} ${period === "24h" || period === "day" ? "Wh" : "kWh"}`,
                  name === "consumption" ? "Consumption" : "Feed-in",
                ]}
              />
              <Legend
                formatter={(value) =>
                  value === "consumption" ? "Consumption" : "Feed-in"
                }
              />
              <Bar
                dataKey="consumption"
                fill="oklch(0.7 0.15 220)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="feedIn"
                fill="oklch(0.65 0.2 145)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
