"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, CheckCircle, AlertCircle, Zap, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePowerfoxStore } from "@/lib/powerfox-store"

interface EndpointConfig {
  name: string
  path: string
  description: string
  params?: Array<{
    key: string
    label: string
    type: "text" | "number" | "select"
    options?: string[]
    required?: boolean
  }>
  saveType: "device" | "current" | "operating" | "report"
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: "All Devices",
    path: "all/devices",
    description: "Holt alle Geräte und speichert sie in der DB",
    saveType: "device",
  },
  {
    name: "Device Info",
    path: "{deviceId}/main",
    description: "Holt Geräteinformationen",
    params: [{ key: "deviceId", label: "Device ID", type: "text", required: true }],
    saveType: "device",
  },
  {
    name: "Current Data",
    path: "{deviceId}/current",
    description: "Aktuelle Messdaten (Watt, kWh, etc.)",
    params: [
      { key: "deviceId", label: "Device ID", type: "text", required: true },
      { key: "unit", label: "Unit", type: "select", options: ["kwh", "wh"], required: false },
    ],
    saveType: "current",
  },
  {
    name: "Operating Report",
    path: "{deviceId}/operating",
    description: "Betriebsbericht mit Min/Max/Avg",
    params: [{ key: "deviceId", label: "Device ID", type: "text", required: true }],
    saveType: "operating",
  },
  {
    name: "Full Report",
    path: "{deviceId}/report",
    description: "Vollständiger Bericht mit allen Summaries",
    params: [
      { key: "deviceId", label: "Device ID", type: "text", required: true },
      { key: "year", label: "Jahr", type: "number", required: false },
      { key: "month", label: "Monat (1-12)", type: "number", required: false },
      { key: "day", label: "Tag", type: "number", required: false },
    ],
    saveType: "report",
  },
]

export default function SyncPage() {
  const credentials = usePowerfoxStore((state) => state.credentials)
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: any
  } | null>(null)

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const buildEndpointPath = () => {
    if (!selectedEndpoint) return ""
    let path = selectedEndpoint.path
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, value)
    })
    return path
  }

  const handleFetch = async () => {
    if (!credentials) {
      setResult({
        success: false,
        message: "Bitte Credentials in den Einstellungen hinterlegen",
      })
      return
    }

    if (!selectedEndpoint) return

    setLoading(true)
    setResult(null)

    try {
      const endpoint = buildEndpointPath()
      
      // Baue Query-Parameter (ohne deviceId, das ist im Pfad)
      const queryParams: Record<string, string | number> = {}
      selectedEndpoint.params?.forEach((param) => {
        if (param.key !== "deviceId" && params[param.key]) {
          queryParams[param.key] = param.type === "number" 
            ? Number(params[param.key]) 
            : params[param.key]
        }
      })

      const response = await fetch("/api/powerfox/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          endpoint,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
          saveToDb: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `Daten erfolgreich abgerufen und in DB gespeichert! (${selectedEndpoint.saveType})`,
          data,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Fehler beim Abrufen der Daten",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      })
    } finally {
      setLoading(false)
    }
  }

  const canFetch = () => {
    if (!selectedEndpoint) return false
    const requiredParams = selectedEndpoint.params?.filter((p) => p.required) || []
    return requiredParams.every((p) => params[p.key])
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Database className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">API Sync</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Daten manuell von API abrufen</h1>
          <p className="text-muted-foreground">
            Wähle einen Endpoint aus und hole Daten von der Powerfox API in die Datenbank
          </p>
        </div>

        {!credentials && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bitte konfiguriere zuerst deine Powerfox-Credentials in den Einstellungen.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Endpoint Auswahl */}
          <Card>
            <CardHeader>
              <CardTitle>1. Endpoint auswählen</CardTitle>
              <CardDescription>Wähle welche Daten du abrufen möchtest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Endpoint</Label>
                <Select
                  value={selectedEndpoint?.name}
                  onValueChange={(value) => {
                    const endpoint = ENDPOINTS.find((e) => e.name === value)
                    setSelectedEndpoint(endpoint || null)
                    setParams({})
                    setResult(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Endpoint auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ENDPOINTS.map((endpoint) => (
                      <SelectItem key={endpoint.name} value={endpoint.name}>
                        {endpoint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEndpoint && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">Beschreibung</p>
                  <p className="text-sm text-muted-foreground">{selectedEndpoint.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Pfad: {selectedEndpoint.path}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Speichert als: {selectedEndpoint.saveType}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parameter */}
          <Card>
            <CardHeader>
              <CardTitle>2. Parameter konfigurieren</CardTitle>
              <CardDescription>
                {selectedEndpoint
                  ? "Fülle die erforderlichen Parameter aus"
                  : "Wähle zuerst einen Endpoint"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEndpoint?.params && selectedEndpoint.params.length > 0 ? (
                <div className="space-y-4">
                  {selectedEndpoint.params.map((param) => (
                    <div key={param.key} className="space-y-2">
                      <Label htmlFor={param.key}>
                        {param.label}
                        {param.required && <span className="text-destructive"> *</span>}
                      </Label>
                      {param.type === "select" ? (
                        <Select
                          value={params[param.key] || ""}
                          onValueChange={(value) => handleParamChange(param.key, value)}
                        >
                          <SelectTrigger id={param.key}>
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {param.options?.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={param.key}
                          type={param.type}
                          value={params[param.key] || ""}
                          onChange={(e) => handleParamChange(param.key, e.target.value)}
                          placeholder={`${param.label} eingeben...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selectedEndpoint
                    ? "Dieser Endpoint benötigt keine Parameter"
                    : "Keine Parameter verfügbar"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fetch Button */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>3. Daten abrufen</CardTitle>
            <CardDescription>
              {buildEndpointPath() && `Endpoint: ${buildEndpointPath()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleFetch}
              disabled={!canFetch() || loading || !credentials}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lädt...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Daten abrufen und speichern
                </>
              )}
            </Button>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            {result?.data && (
              <div className="rounded-lg border bg-muted p-4">
                <p className="mb-2 text-sm font-medium">Antwort:</p>
                <pre className="max-h-96 overflow-auto text-xs">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
