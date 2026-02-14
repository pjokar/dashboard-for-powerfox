"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsDialog } from "@/components/settings-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePowerfoxStore } from "@/lib/powerfox-store"
import { Nav } from "@/components/nav"
import { useTranslations } from "next-intl"

export default function LoginPage() {
  const router = useRouter()
  const credentials = usePowerfoxStore((state) => state.credentials)
  const t = useTranslations("login")

  useEffect(() => {
    if (credentials) {
      router.replace("/")
    }
  }, [credentials, router])

  if (credentials) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <section className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("hero")}</p>
        </section>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SettingsDialog
              trigger={
                <Button size="lg" className="gap-2">
                  <Zap className="h-5 w-5" />
                  {t("loginButton")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
