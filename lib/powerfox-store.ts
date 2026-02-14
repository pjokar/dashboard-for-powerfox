import { create } from "zustand"
import { persist } from "zustand/middleware"

interface PowerfoxCredentials {
  /**
   * Nur die Email wird im Client-Store gehalten/persistiert.
   * Das Passwort liegt ausschließlich im HttpOnly-Cookie.
   */
  email: string
}

interface PowerfoxStore {
  credentials: PowerfoxCredentials | null
  setCredentials: (credentials: PowerfoxCredentials) => void
  clearCredentials: () => void
  isConfigured: () => boolean
}

export const usePowerfoxStore = create<PowerfoxStore>()(
  persist(
    (set, get) => ({
      credentials: null,
      setCredentials: (credentials) => set({ credentials }),
      clearCredentials: () => set({ credentials: null }),
      isConfigured: () => {
        const creds = get().credentials
        return !!creds?.email
      },
    }),
    {
      name: "powerfox-credentials",
    }
  )
)

/** Bei 401 oder ungültigem Cookie: Store leeren und zur Login-Seite (Locale beibehalten). */
export function handleSessionInvalid() {
  usePowerfoxStore.getState().clearCredentials()
  if (typeof window !== "undefined") {
    const seg = window.location.pathname.split("/")[1]
    const locale = seg === "de" || seg === "en" ? seg : "de"
    window.location.href = `/${locale}/login`
  }
}
