# Powerfox API-Endpunkte

## Übersicht

Die API bietet drei Hauptendpunkte für die Arbeit mit Powerfox-Daten:

1. **`/api/powerfox`** - Direkte Abfrage der Powerfox API (ohne DB-Speicherung)
2. **`/api/powerfox/save`** - Abfrage mit automatischer DB-Speicherung
3. **`/api/powerfox/history`** - Abruf historischer Daten aus der lokalen Datenbank

---

## 1. /api/powerfox

**Methode:** `POST`

**Beschreibung:** Ruft Daten direkt von der Powerfox API ab, ohne sie in der Datenbank zu speichern.

### Request Body

```json
{
  "email": "user@example.com",
  "password": "password123",
  "endpoint": "current",
  "params": {
    "division": 1
  }
}
```

### Parameter

- `email` (required): Powerfox-Account-Email
- `password` (required): Powerfox-Account-Passwort
- `endpoint` (required): API-Endpunkt (z.B. "Devices", "main", "current", "operating", "report")
- `params` (optional): Query-Parameter für den Endpunkt

### Beispiel

```typescript
const response = await fetch('/api/powerfox', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
    endpoint: 'current',
  }),
});

const data = await response.json();
```

---

## 2. /api/powerfox/save

**Methoden:** `POST`, `GET`

### POST - Daten abrufen und speichern

**Beschreibung:** Ruft Daten von der Powerfox API ab und speichert sie automatisch in der lokalen Datenbank.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "password123",
  "endpoint": "current",
  "saveToDb": true
}
```

#### Parameter

- `email` (required): Powerfox-Account-Email
- `password` (required): Powerfox-Account-Passwort
- `endpoint` (required): API-Endpunkt
- `saveToDb` (optional, default: true): Ob Daten in DB gespeichert werden sollen
- `params` (optional): Query-Parameter

#### Unterstützte Endpoints für DB-Speicherung

- `Devices` - Speichert Device-Liste
- `main` - Speichert Hauptdevice
- `current` - Speichert aktuelle Messdaten
- `operating` - Speichert Operating Reports
- `report` - Speichert vollständige Reports

#### Beispiel

```typescript
// Aktuelle Daten abrufen und speichern
const response = await fetch('/api/powerfox/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
    endpoint: 'current',
  }),
});

const data = await response.json();
```

### GET - Alle Devices abrufen

**Beschreibung:** Gibt alle in der Datenbank gespeicherten Devices zurück.

#### Beispiel

```typescript
const response = await fetch('/api/powerfox/save');
const devices = await response.json();
```

---

## 3. /api/powerfox/history

**Methode:** `GET`

**Beschreibung:** Ruft historische Daten aus der lokalen Datenbank ab.

### Query-Parameter

- `deviceId` (required): Device ID
- `type` (optional, default: "current"): Datentyp
  - `current` - Aktuelle Messdaten
  - `operating` - Operating Reports
  - `reports` - Vollständige Reports
- `limit` (optional, default: 100): Anzahl der Einträge
- `startTimestamp` (optional): Unix-Timestamp (Startzeit)
- `endTimestamp` (optional): Unix-Timestamp (Endzeit)

### Beispiele

#### Letzte 100 Messwerte

```typescript
const response = await fetch(
  '/api/powerfox/history?deviceId=ABC123&type=current&limit=100'
);
const data = await response.json();
```

#### Daten für einen Zeitraum

```typescript
const now = Math.floor(Date.now() / 1000);
const yesterday = now - 86400;

const response = await fetch(
  `/api/powerfox/history?deviceId=ABC123&type=current&startTimestamp=${yesterday}&endTimestamp=${now}`
);
const data = await response.json();
```

#### Operating Reports

```typescript
const response = await fetch(
  '/api/powerfox/history?deviceId=ABC123&type=operating&limit=10'
);
const data = await response.json();
```

### Response Format

```json
{
  "deviceId": "ABC123",
  "type": "current",
  "count": 100,
  "data": [
    {
      "id": "...",
      "deviceId": "ABC123",
      "watt": 2500,
      "kiloWattHour": 150.5,
      "timestamp": 1706889600,
      "createdAt": "2024-02-02T12:00:00.000Z",
      ...
    }
  ]
}
```

---

## Workflow-Beispiele

### 1. Initiale Synchronisation

```typescript
// 1. Devices abrufen und speichern
await fetch('/api/powerfox/save', {
  method: 'POST',
  body: JSON.stringify({
    email, password,
    endpoint: 'Devices',
  }),
});

// 2. Für jedes Device aktuelle Daten abrufen
const devicesRes = await fetch('/api/powerfox/save');
const devices = await devicesRes.json();

for (const device of devices) {
  await fetch('/api/powerfox/save', {
    method: 'POST',
    body: JSON.stringify({
      email, password,
      endpoint: 'current',
      params: { deviceId: device.deviceId },
    }),
  });
}
```

### 2. Regelmäßige Updates (Cronjob)

```typescript
// Alle 5 Minuten aktuelle Daten für alle Devices abrufen
setInterval(async () => {
  const devicesRes = await fetch('/api/powerfox/save');
  const devices = await devicesRes.json();

  for (const device of devices) {
    await fetch('/api/powerfox/save', {
      method: 'POST',
      body: JSON.stringify({
        email, password,
        endpoint: 'current',
        params: { deviceId: device.deviceId },
      }),
    });
  }
}, 5 * 60 * 1000);
```

### 3. Historische Daten visualisieren

```typescript
// Daten der letzten 24 Stunden abrufen
const now = Math.floor(Date.now() / 1000);
const yesterday = now - 86400;

const response = await fetch(
  `/api/powerfox/history?deviceId=ABC123&type=current&startTimestamp=${yesterday}&endTimestamp=${now}`
);
const { data } = await response.json();

// Daten für Chart aufbereiten
const chartData = data.map(d => ({
  timestamp: d.timestamp * 1000, // zu Millisekunden
  watt: d.watt,
  kwh: d.kiloWattHour,
}));
```

---

## Error Handling

Alle Endpunkte geben im Fehlerfall einen entsprechenden HTTP-Status-Code zurück:

- `400` - Bad Request (fehlende Parameter)
- `401` - Unauthorized (ungültige Credentials)
- `412` - Precondition Failed (Datenübertragung vom Kunden verweigert)
- `429` - Too Many Requests (Rate Limit erreicht)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": "Error message"
}
```

### Beispiel Error Handling

```typescript
try {
  const response = await fetch('/api/powerfox/save', {
    method: 'POST',
    body: JSON.stringify({ email, password, endpoint: 'current' }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error);
    return;
  }

  const data = await response.json();
  // Erfolg
} catch (error) {
  console.error('Network Error:', error);
}
```
