"use client"

import { useState } from "react"
import { Zap, Database } from "lucide-react"
import { SettingsDialog } from "@/components/settings-dialog"
import { DeviceSelector, DeviceInfo } from "@/components/device-selector"
import { CurrentPowerCard } from "@/components/current-power-card"
import { MeterReadingCard } from "@/components/meter-reading-card"
import { PowerChart } from "@/components/power-chart"
import { ConsumptionChart } from "@/components/consumption-chart"
import { usePowerfoxStore } from "@/lib/powerfox-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Dashboard() {
  const credentials = usePowerfoxStore((state) => state.credentials)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  if (!credentials) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Powerfox</span>
            </div>
            <SettingsDialog />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Welcome to Powerfox Dashboard</CardTitle>
              <CardDescription>
                Connect your Powerfox account to start monitoring your energy
                consumption in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SettingsDialog />
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Powerfox</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sync">
              <Button variant="outline" size="sm">
                <Database className="mr-2 h-4 w-4" />
                API Sync
              </Button>
            </Link>
            <DeviceSelector
              selectedDevice={selectedDevice}
              onSelectDevice={setSelectedDevice}
            />
            <SettingsDialog />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <DeviceInfo deviceId={selectedDevice} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CurrentPowerCard deviceId={selectedDevice} />
          <MeterReadingCard deviceId={selectedDevice} />
        </div>

        <div className="mt-6 grid gap-4">
          <PowerChart deviceId={selectedDevice} />
          <ConsumptionChart deviceId={selectedDevice} />
        </div>
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Data refreshes automatically. Last 60 min power data updates every
          minute.
        </div>
      </footer>
    </div>
  )
}
