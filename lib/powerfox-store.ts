import { create } from "zustand"
import { persist } from "zustand/middleware"

interface PowerfoxCredentials {
  email: string
  password: string
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
        return !!(creds?.email && creds?.password)
      },
    }),
    {
      name: "powerfox-credentials",
    }
  )
)
