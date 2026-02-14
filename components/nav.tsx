"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

const navItems = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/reports", key: "reports", icon: FileText },
  { href: "/sync", key: "sync", icon: RefreshCw },
] as const

export function Nav() {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg text-primary-foreground">⚡</span>
            </div>
            <span className="hidden sm:inline-block">{tCommon("appName")}</span>
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{t(item.key)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
