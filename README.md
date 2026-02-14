## Powerfox Dashboard

Ein Next.js-Dashboard zur Visualisierung von Strom-Verbrauchsdaten aus der **Powerfox**-API mit:

- **Live-Daten** und Charts
- **SQLite/Prisma**-Persistenz
- **Sync-Seite** für manuelle/halb-automatische Daten-Synchronisation
- **Analytische Reports** (z.B. Zeitraum-Durchschnitts-Report)

Die meisten technischen Details sind in den spezialisierten Markdown-Dateien dokumentiert – dieses `README` gibt einen kompakten Überblick und einen klaren Einstieg.

---

## Tech-Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS 4, Radix UI, shadcn/ui-Komponenten
- **State**: Zustand Store (`lib/powerfox-store.ts`)
- **Datenbank**: SQLite (`db/dev.db`) mit Prisma 7 (`@prisma/adapter-better-sqlite3`)
- **Powerfox-Anbindung**:
  - Generiertes SDK in `lib/powerfox-sdk/`
  - Zentrale API-Schicht in `lib/powerfox-api.ts`
  - React Hooks in `hooks/use-powerfox-api.ts`

---

## Projektstruktur (Kurzfassung)

- `app/`
  - `page.tsx` – Einstieg, rendert das `Dashboard`
  - `sync/` – Sync-UI für Powerfox → DB
  - `reports/` – Reports-Übersicht und Timespan-Report (`reports/timespan`)
  - `api/`
    - `powerfox/` – Backend-Endpunkte für Powerfox-Integration (direkte API, Save, History, Logs)
    - `reports/timespan` – Zeitraum-Report-API
- `components/`
  - Dashboard-UI (`dashboard.tsx`, `current-power-card.tsx`, `meter-reading-card.tsx`, Charts, Nav, Settings)
  - `components/ui/` – generische UI-Komponenten (shadcn)
- `lib/`
  - `powerfox-api.ts` – zentrale API-Schicht (SDK-Calls, Mapping, Logging)
  - `mappers.ts` – Mapping SDK ↔ DB/App-Format
  - `powerfox-db.ts` – DB-Lese-/Schreibfunktionen
  - `powerfox-store.ts` – Credentials & UI-State
  - `db.ts` – Prisma-Client-Setup
- `hooks/` – React Hooks (`use-powerfox-api.ts`, `use-powerfox.ts` (legacy), `use-mobile.ts`, `use-toast.ts`)
- `prisma/` – Prisma-Schema & migrationspezifische README

Weiterführende Architekturdetails: `ARCHITECTURE.md`, `lib/ARCHITECTURE.md`.

---

## Einrichtung & Entwicklung

### Voraussetzungen

- Node.js (empfohlen: aktuelle LTS)
- `pnpm` (Projekt ist auf `pnpm` ausgelegt)

### Installation

```bash
pnpm install
```

### Entwicklung starten

```bash
pnpm dev
# → http://localhost:3000
```

Die Hauptseite (`/`) zeigt das Live-Dashboard. Ohne konfigurierte Credentials erscheint zunächst ein Onboarding-Card mit Einstellungsdialog.

---

## Powerfox-Credentials & erstes Setup

1. **Dev-Server starten** (`pnpm dev`).
2. Im Browser `http://localhost:3000` öffnen.
3. Im Dashboard oben rechts auf das **Zahnrad** (Settings) klicken.
4. Powerfox **E-Mail** und **Passwort** eintragen und speichern.
5. Optional: Auf `/sync` wechseln, um initial Daten zu laden (siehe unten).

Die Credentials werden im Store (`usePowerfoxStore`) gehalten und nicht in der Datenbank gespeichert.

Weitere Details:

- `API_SYNC_ANLEITUNG.md` – kompakte Anleitung zur Sync-Seite
- `SYNC_USAGE.md` – detaillierter Sync-Workflow

---

## Datenbank & Prisma

Die App nutzt eine lokale SQLite-Datenbank (`db/dev.db`), angebunden über Prisma.

### Wichtige Dateien

- `prisma/schema.prisma` – DB-Schema (Devices, CurrentData, Reports, Summaries, ApiLog, …)
- `lib/db.ts` – Prisma-Client
- `lib/powerfox-db.ts` – High-Level-DB-API (save/get/Delete-Funktionen)
- `DATABASE_SETUP.md` – Setup- und Integrationsdetails

### Nützliche Skripte

```bash
pnpm db:generate   # Prisma Client generieren
pnpm db:migrate    # Migration erstellen / anwenden (dev)
pnpm db:push       # Schema ohne Migration pushen
pnpm db:studio     # Prisma Studio (GUI) öffnen
pnpm db:seed       # Optionale Seed-Daten (falls implementiert)
```

Mehr Informationen:

- `DATABASE_SETUP.md`
- `prisma/README.md`

---

## API-Layer & Logging

Die Powerfox-Anbindung ist dreistufig aufgebaut:

1. **SDK** (`lib/powerfox-sdk/`) – generierter OpenAPI-Client (nicht direkt in Components nutzen).
2. **Zentrale API-Schicht** (`lib/powerfox-api.ts`) – kapselt SDK-Calls, Mapping, Error-Handling, Logging.
3. **React Hooks** (`hooks/use-powerfox-api.ts`) – werden von Komponenten verwendet.

Alle externen API-Calls werden in der DB geloggt (`ApiLog`-Tabelle).

- Details: `ARCHITECTURE.md`, `API_LOGGING.md`
- HTTP-API-Dokumentation der Routen: `app/api/powerfox/API.md`

Relevante Endpunkte:

- `POST /api/powerfox` – direkte Powerfox-Calls (ohne Speichern)
- `POST /api/powerfox/save` – Powerfox → DB
- `GET /api/powerfox/save` – Devices aus DB
- `GET /api/powerfox/history` – historische Daten aus DB
- `GET/DELETE /api/powerfox/logs` – API-Logs lesen/bereinigen

---

## Sync-Seite (`/sync`)

Die Sync-Seite dient als UI für manuelle oder halb-automatische Synchronisation von Powerfox-Daten in die lokale DB.

Funktionen (Auszug):

- Auswahl von Endpoints:
  - `all/devices`, `{deviceId}/main`, `{deviceId}/current`, `{deviceId}/operating`, `{deviceId}/report`
- Dynamische Parameter-Eingabe (Device ID, Zeitraum etc.)
- Fetch & Save-Button mit JSON-Vorschau der Response
- Klarer Status (Erfolg/Fehler)

Die Logik und Workflows sind in `API_SYNC_ANLEITUNG.md` und `SYNC_USAGE.md` beschrieben.

---

## Reports & Analytics

Neben dem Live-Dashboard gibt es einen Reports-Bereich (`/reports`) mit u.a.:

- **Zeitraum-Durchschnitts-Report** (`/reports/timespan`):
  - Analyse des Durchschnittsverbrauchs für bestimmte Tageszeiten über:
    - Letzte 7 Tage
    - Letzten Kalendermonat
    - Letztes Kalenderjahr
  - Datenquellen: `CurrentData` und/oder `ReportValues` (automatische Wahl nach Zeitraum)
  - Uhrzeitfilter inkl. Bereiche über Mitternacht

Details: `TIMESPAN_REPORT.md`.

---

## Deployment (High-Level)

Das Projekt ist ein klassisches Next.js-App-Router-Projekt und kann z.B. über:

- Vercel
- Docker + Node

deployt werden. Zu beachten:

- SQLite-Datei (`db/dev.db`) sollte auf ein produktives Setup angepasst werden (Pfad, Backup-Strategie).
- Prisma-Konfiguration ggf. auf ein anderes Backend (z.B. Postgres) migrieren, falls notwendig.

---

## Weitere Dokumentation

Für tiefere technische Details:

- `ARCHITECTURE.md` – Architektur-Übersicht der Powerfox-Integration
- `lib/ARCHITECTURE.md` – Fokus auf API- und Mapper-Schicht
- `DATABASE_SETUP.md` – Datenbankintegration & Migrations-Setup
- `API_LOGGING.md` – Logging-Konzept und Endpunkte
- `API_SYNC_ANLEITUNG.md` / `SYNC_USAGE.md` – Sync-Workflows
- `TIMESPAN_REPORT.md` – Zeitraum-Report-Spezifikation
- `app/api/powerfox/API.md` – HTTP-API-Dokumentation der Backend-Routen

