"use client"

import { useState } from "react"
import { SettingsDialog } from "@/components/settings-dialog"
import { DeviceSelector, DeviceInfo } from "@/components/device-selector"
import { CurrentPowerCard } from "@/components/current-power-card"
import { MeterReadingCard } from "@/components/meter-reading-card"
import { PowerChart } from "@/components/power-chart"
import { ConsumptionChart } from "@/components/consumption-chart"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { Nav } from "@/components/nav"
import { useTranslations } from "next-intl"

export function Dashboard() {
  const isAuth = useRequireAuth()
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const t = useTranslations("dashboard")

  if (!isAuth) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            <div className="mt-2">
              <DeviceInfo deviceId={selectedDevice} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DeviceSelector
              selectedDevice={selectedDevice}
              onSelectDevice={setSelectedDevice}
            />
            <SettingsDialog />
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
          {t("footer")}
        </div>
      </footer>
    </div>
  )
}
