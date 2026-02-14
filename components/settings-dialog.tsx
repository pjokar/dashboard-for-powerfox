"use client"

import { useState, type ReactNode } from "react"
import { Settings, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePowerfoxStore } from "@/lib/powerfox-store"
import { useTranslations } from "next-intl"

interface SettingsDialogProps {
  /** Optional: eigener Trigger (z. B. großer „Anmelden“-Button auf der Login-Seite). Ohne Angabe: Zahnrad-Icon. */
  trigger?: ReactNode
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const { credentials, setCredentials, clearCredentials } = usePowerfoxStore()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(credentials?.email || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState("")
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")

  const handleTest = async () => {
    if (!email || !password) {
      setError(t("errorEmailPassword"))
      return
    }

    setTesting(true)
    setError("")

    try {
      const response = await fetch("/api/powerfox/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to connect")
      }

      // Nur die Email im Store halten – Passwort liegt im HttpOnly-Cookie
      setCredentials({ email })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorConnectionFailed"))
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = () => {
    fetch("/api/powerfox/credentials", { method: "DELETE" }).finally(() => {
      clearCredentials()
      setEmail("")
      setPassword("")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
            <span className="sr-only">{tCommon("settings")}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? t("hidePassword") : t("showPassword")}
                </span>
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={testing} className="flex-1">
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {credentials ? t("updateTest") : t("connectTest")}
            </Button>
            {credentials && (
              <Button variant="destructive" onClick={handleDisconnect}>
                {t("disconnect")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
