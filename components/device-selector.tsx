"use client"

import { useEffect } from "react"
import { Cpu, AlertCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePowerfoxDevices } from "@/hooks/use-powerfox-api"
import { Skeleton } from "@/components/ui/skeleton"
import type { MyDeviceModel } from "@/lib/powerfox-sdk/models"
import { useTranslations } from "next-intl"

// Device type = SDK Model (verwendet camelCase)
type Device = MyDeviceModel

interface DeviceSelectorProps {
  selectedDevice: string | null
  onSelectDevice: (deviceId: string) => void
}

export function DeviceSelector({
  selectedDevice,
  onSelectDevice,
}: DeviceSelectorProps) {
  const { data: devices, error, isLoading } = usePowerfoxDevices()
  const t = useTranslations("deviceSelector")
  const tCommon = useTranslations("common")

  useEffect(() => {
    if (devices && devices.length > 0 && !selectedDevice) {
      const mainDevice = devices.find((d: Device) => d.mainDevice)
      onSelectDevice(mainDevice?.deviceId || devices[0]?.deviceId || '')
    }
  }, [devices, selectedDevice, onSelectDevice])

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>{t("failedToLoad")}</span>
      </div>
    )
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4" />
        <span>{t("noDevices")}</span>
      </div>
    )
  }

  // Filtere nur valide Devices mit deviceId
  const validDevices = devices.filter((d: Device) => d.deviceId && d.deviceId.trim() !== '')

  if (validDevices.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4" />
        <span>{t("noValidDevices")}</span>
      </div>
    )
  }

  return (
    <Select value={selectedDevice || ""} onValueChange={onSelectDevice}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={tCommon("selectDevice")} />
      </SelectTrigger>
      <SelectContent>
        {validDevices.map((device: Device, index: number) => (
          <SelectItem 
            key={device.deviceId || `device-${index}`} 
            value={device.deviceId || ''}
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>{device.name || device.deviceId}</span>
              {device.mainDevice && (
                <span className="rounded bg-primary/20 px-1 text-xs text-primary">
                  {tCommon("main")}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const divisionKeys: Record<number, string> = {
  [-1]: "unknown",
  0: "electricity",
  1: "coldWater",
  2: "hotWater",
  3: "heat",
  4: "gas",
  5: "water",
}

export function DeviceInfo({ deviceId }: { deviceId: string | null }) {
  const { data: devices } = usePowerfoxDevices()
  const t = useTranslations("deviceSelector")

  if (!deviceId || !devices) return null

  const device = devices.find((d: Device) => d.deviceId === deviceId)
  if (!device) return null

  const divisionKey = divisionKeys[device.division ?? -1] ?? "unknown"

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="rounded bg-secondary px-2 py-1">
        {t(`division.${divisionKey}`)}
      </span>
      {device.prosumer && (
        <span className="rounded bg-primary/20 px-2 py-1 text-primary">
          {t("bidirectional")}
        </span>
      )}
    </div>
  )
}
