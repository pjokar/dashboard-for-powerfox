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
import { useDevices } from "@/hooks/use-powerfox"
import { Skeleton } from "@/components/ui/skeleton"

interface Device {
  DeviceId: string
  Name: string
  MainDevice: boolean
  Prosumer: boolean
  Division: number
}

const divisionLabels: Record<number, string> = {
  [-1]: "Unknown",
  0: "Electricity",
  1: "Cold Water",
  2: "Hot Water",
  3: "Heat",
  4: "Gas",
  5: "Water",
}

interface DeviceSelectorProps {
  selectedDevice: string | null
  onSelectDevice: (deviceId: string) => void
}

export function DeviceSelector({
  selectedDevice,
  onSelectDevice,
}: DeviceSelectorProps) {
  const { data: devices, error, isLoading } = useDevices()

  useEffect(() => {
    if (devices && devices.length > 0 && !selectedDevice) {
      const mainDevice = devices.find((d: Device) => d.MainDevice)
      onSelectDevice(mainDevice?.DeviceId || devices[0].DeviceId)
    }
  }, [devices, selectedDevice, onSelectDevice])

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load devices</span>
      </div>
    )
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4" />
        <span>No devices found</span>
      </div>
    )
  }

  return (
    <Select value={selectedDevice || ""} onValueChange={onSelectDevice}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select device" />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device: Device) => (
          <SelectItem key={device.DeviceId} value={device.DeviceId}>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>{device.Name || device.DeviceId}</span>
              {device.MainDevice && (
                <span className="rounded bg-primary/20 px-1 text-xs text-primary">
                  Main
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function DeviceInfo({ deviceId }: { deviceId: string | null }) {
  const { data: devices } = useDevices()

  if (!deviceId || !devices) return null

  const device = devices.find((d: Device) => d.DeviceId === deviceId)
  if (!device) return null

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="rounded bg-secondary px-2 py-1">
        {divisionLabels[device.Division] || "Unknown"}
      </span>
      {device.Prosumer && (
        <span className="rounded bg-primary/20 px-2 py-1 text-primary">
          Bidirectional
        </span>
      )}
    </div>
  )
}
