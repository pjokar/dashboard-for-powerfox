/**
 * Shared auth helpers for Powerfox API routes.
 * Credentials are read from an HttpOnly cookie (set by the credentials API).
 */

export const COOKIE_NAME = "powerfox-credentials"

export interface CookieCredentials {
  email: string
  password: string
}

/**
 * Parses the auth cookie value and returns credentials or null if invalid.
 */
export function parseAuthCookie(value: string): CookieCredentials | null {
  if (!value || typeof value !== "string") return null
  try {
    const decoded = decodeURIComponent(value)
    const parsed = JSON.parse(decoded) as unknown
    if (
      parsed &&
      typeof parsed === "object" &&
      "email" in parsed &&
      "password" in parsed &&
      typeof (parsed as CookieCredentials).email === "string" &&
      typeof (parsed as CookieCredentials).password === "string"
    ) {
      return parsed as CookieCredentials
    }
  } catch {
    // ignore
  }
  return null
}
