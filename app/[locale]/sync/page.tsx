"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Cpu, Zap } from "lucide-react"
import { usePowerfoxStore, handleSessionInvalid } from "@/lib/powerfox-store"
import { useRequireAuth } from "@/hooks/use-require-auth"
import useSWR from "swr"
import { Nav } from "@/components/nav"
import { useTranslations } from "next-intl"

const ENDPOINT_KEYS = ["allDevices", "currentData", "operatingReport", "fullReport"] as const

const ENDPOINTS_CONFIG: Record<
  string,
  {
    path: string
    saveType: "device" | "current" | "operating" | "report"
    params?: Array<{
      key: string
      type: "text" | "number" | "select"
      options?: string[]
      required?: boolean
    }>
  }
> = {
  allDevices: { path: "all/devices", saveType: "device" },
  currentData: {
    path: "{deviceId}/current",
    saveType: "current",
    params: [
      { key: "deviceId", type: "text", required: true },
      { key: "unit", type: "select", options: ["kwh", "wh"], required: false },
    ],
  },
  operatingReport: {
    path: "{deviceId}/operating",
    saveType: "operating",
    params: [{ key: "deviceId", type: "text", required: true }],
  },
  fullReport: {
    path: "{deviceId}/report",
    saveType: "report",
    params: [
      { key: "deviceId", type: "text", required: true },
      { key: "year", type: "number", required: false },
      { key: "month", type: "number", required: false },
      { key: "day", type: "number", required: false },
    ],
  },
}

async function dbFetcher(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch")
  return response.json()
}

export default function SyncPage() {
  const isAuth = useRequireAuth()
  const credentials = usePowerfoxStore((state) => state.credentials)
  const [selectedKey, setSelectedKey] = useState<string>("")
  const [params, setParams] = useState<Record<string, string>>({})
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: unknown
  } | null>(null)

  const t = useTranslations("sync")
  const tCommon = useTranslations("common")

  const selectedConfig = selectedKey ? ENDPOINTS_CONFIG[selectedKey] : null

  const { data: devices } = useSWR<
    Array<{ deviceId: string; name?: string; mainDevice?: boolean }>
  >("/api/powerfox/save", dbFetcher, { revalidateOnFocus: false })

  useEffect(() => {
    if (selectedDeviceId && selectedConfig?.params?.some((p) => p.key === "deviceId")) {
      setParams((prev) => ({ ...prev, deviceId: selectedDeviceId }))
    }
  }, [selectedDeviceId, selectedConfig])

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const buildEndpointPath = () => {
    if (!selectedConfig) return ""
    let path = selectedConfig.path
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, value)
    })
    return path
  }

  const handleFetch = async () => {
    if (!credentials) {
      setResult({ success: false, message: t("errorCredentials") })
      return
    }
    if (!selectedConfig) return

    setLoading(true)
    setResult(null)

    try {
      const endpoint = buildEndpointPath()
      const queryParams: Record<string, string | number> = {}
      selectedConfig.params?.forEach((param) => {
        if (param.key !== "deviceId" && params[param.key]) {
          queryParams[param.key] =
            param.type === "number" ? Number(params[param.key]) : params[param.key]
        }
      })

      const response = await fetch("/api/powerfox/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
          saveToDb: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: t("successMessage", { saveType: selectedConfig.saveType }),
          data,
        })
      } else {
        if (response.status === 401) {
          handleSessionInvalid()
          return
        }
        setResult({
          success: false,
          message: data.error || tCommon("errorUnknown"),
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : tCommon("errorUnknown"),
      })
    } finally {
      setLoading(false)
    }
  }

  const canFetch = () => {
    if (!selectedConfig) return false
    const requiredParams = selectedConfig.params?.filter((p) => p.required) || []
    return requiredParams.every((p) => params[p.key])
  }

  if (!isAuth) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        {!credentials && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("alertCredentials")}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("step1Title")}</CardTitle>
              <CardDescription>{t("step1Description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("endpoint")}</Label>
                <Select
                  value={selectedKey}
                  onValueChange={(v) => {
                    setSelectedKey(v)
                    setParams({})
                    setResult(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectEndpointPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ENDPOINT_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`endpoints.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedConfig && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">{t("description")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`endpoints.${selectedKey}Desc`)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("path")}: {selectedConfig.path}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("savesAs")}: {selectedConfig.saveType}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("step2Title")}</CardTitle>
              <CardDescription>
                {selectedConfig ? t("step2DescriptionFill") : t("step2DescriptionSelect")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices &&
                devices.length > 0 &&
                selectedConfig?.params?.some((p) => p.key === "deviceId") && (
                  <div className="mb-6 space-y-2 rounded-lg border bg-muted/50 p-4">
                    <Label htmlFor="device-selector">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        {t("deviceFromDb")}
                      </div>
                    </Label>
                    <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                      <SelectTrigger id="device-selector">
                        <SelectValue placeholder={tCommon("selectDevice")} />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
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
                    <p className="text-xs text-muted-foreground">{t("deviceFromDbHint")}</p>
                  </div>
                )}

              {selectedConfig?.params && selectedConfig.params.length > 0 ? (
                <div className="space-y-4">
                  {selectedConfig.params.map((param) => (
                    <div key={param.key} className="space-y-2">
                      <Label htmlFor={param.key}>
                        {t(`endpoints.${param.key}`)}
                        {param.required && <span className="text-destructive"> *</span>}
                      </Label>
                      {param.type === "select" ? (
                        <Select
                          value={params[param.key] || ""}
                          onValueChange={(value) => handleParamChange(param.key, value)}
                        >
                          <SelectTrigger id={param.key}>
                            <SelectValue placeholder={tCommon("selectPlaceholder")} />
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
                          placeholder={t("paramLabelEnter", {
                            label: t(`endpoints.${param.key}`),
                          })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selectedConfig ? t("noParamsRequired") : t("noParamsAvailable")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("step3Title")}</CardTitle>
            <CardDescription>
              {buildEndpointPath() && t("endpointLabel", { path: buildEndpointPath() })}
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
                  {tCommon("loading")}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {t("fetchAndSave")}
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
                <p className="mb-2 text-sm font-medium">{tCommon("response")}</p>
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
