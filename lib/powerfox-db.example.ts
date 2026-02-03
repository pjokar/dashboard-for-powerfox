/**
 * Beispiele zur Verwendung der Powerfox-Datenbankfunktionen
 * 
 * Diese Datei zeigt, wie die verschiedenen Funktionen verwendet werden können.
 * Sie kann in API-Routen, Server-Components oder anderen Server-seitigen Code integriert werden.
 */

import {
  saveDevice,
  saveCurrentData,
  saveOperatingReport,
  saveReport,
  getAllDevices,
  getDeviceByDeviceId,
  getLatestCurrentData,
  getCurrentDataByTimeRange,
  getOperatingReports,
  getReports,
  deleteOldCurrentData,
} from './powerfox-db';

// Beispiel: Device aus der API speichern
async function exampleSaveDevice() {
  const device = {
    deviceId: 'ABC123',
    name: 'Mein Stromzähler',
    accountAssociatedSince: Date.now() / 1000,
    mainDevice: true,
    prosumer: false,
    division: 1,
  };

  const savedDevice = await saveDevice(device);
  console.log('Device gespeichert:', savedDevice);
}

// Beispiel: Aktuelle Messdaten speichern
async function exampleSaveCurrentData() {
  const currentData = {
    deviceId: 'ABC123',
    outdated: false,
    watt: 2500,
    kiloWattHour: 150.5,
    deltaKiloWattHour: 0.5,
    timestamp: Math.floor(Date.now() / 1000),
    aPlus: 150.5,
    l1: 800,
    l2: 850,
    l3: 850,
  };

  const savedData = await saveCurrentData(currentData);
  console.log('Current Data gespeichert:', savedData);
}

// Beispiel: Operating Report speichern
async function exampleSaveOperatingReport() {
  const report = {
    deviceId: 'ABC123',
    max: 3000,
    min: 100,
    avg: 1500,
    values: [
      { timestamp: Math.floor(Date.now() / 1000) - 3600, value: 1500 },
      { timestamp: Math.floor(Date.now() / 1000) - 1800, value: 2000 },
      { timestamp: Math.floor(Date.now() / 1000), value: 1800 },
    ],
  };

  const savedReport = await saveOperatingReport(report);
  console.log('Operating Report gespeichert:', savedReport);
}

// Beispiel: Vollständigen Report speichern
async function exampleSaveReport() {
  const report = {
    deviceId: 'ABC123',
    consumption: {
      sum: 150.5,
      sumCurrency: 45.15,
      startTime: Math.floor(Date.now() / 1000) - 86400,
      max: 3000,
      maxCurrency: 0.9,
      meterReadings: [
        { value: 150.5, type: 1 },
      ],
      reportValues: [
        { timestamp: Math.floor(Date.now() / 1000), value: 2500, type: 0 },
      ],
    },
  };

  const savedReport = await saveReport(report);
  console.log('Report gespeichert:', savedReport);
}

// Beispiel: Alle Devices abrufen
async function exampleGetAllDevices() {
  const devices = await getAllDevices();
  console.log('Alle Devices:', devices);
}

// Beispiel: Device anhand der deviceId abrufen
async function exampleGetDevice() {
  const device = await getDeviceByDeviceId('ABC123');
  console.log('Device gefunden:', device);
}

// Beispiel: Aktuelle Daten abrufen
async function exampleGetCurrentData() {
  // Die letzten 100 Einträge
  const latestData = await getLatestCurrentData('ABC123', 100);
  console.log('Letzte Daten:', latestData);

  // Daten für einen bestimmten Zeitraum (z.B. letzte 24 Stunden)
  const now = Math.floor(Date.now() / 1000);
  const yesterday = now - 86400;
  const rangeData = await getCurrentDataByTimeRange('ABC123', yesterday, now);
  console.log('Daten der letzten 24h:', rangeData);
}

// Beispiel: Operating Reports abrufen
async function exampleGetOperatingReports() {
  const reports = await getOperatingReports('ABC123', 10);
  console.log('Operating Reports:', reports);
}

// Beispiel: Reports abrufen
async function exampleGetReports() {
  const reports = await getReports('ABC123', 10);
  console.log('Reports:', reports);
}

// Beispiel: Alte Daten bereinigen
async function exampleCleanup() {
  // Lösche Daten, die älter als 30 Tage sind
  const deleted = await deleteOldCurrentData(30);
  console.log('Alte Daten gelöscht:', deleted);
}

// Integration in eine API-Route (z.B. app/api/powerfox/save/route.ts)
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Device speichern
    if (data.device) {
      await saveDevice(data.device);
    }

    // Aktuelle Daten speichern
    if (data.currentData) {
      await saveCurrentData(data.currentData);
    }

    // Operating Report speichern
    if (data.operatingReport) {
      await saveOperatingReport(data.operatingReport);
    }

    // Report speichern
    if (data.report) {
      await saveReport(data.report);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// Cronjob-Beispiel: Daten regelmäßig von Powerfox abrufen und speichern
// (z.B. in einer separaten Datei oder einem Scheduler)
async function cronjobExample() {
  try {
    // Hole alle Devices
    const devices = await getAllDevices();

    for (const device of devices) {
      try {
        // Hier würde der API-Call zur Powerfox API kommen
        // const currentData = await powerfoxApi.getCurrentData(device.deviceId);
        // await saveCurrentData(currentData);

        console.log(`Daten für Device ${device.deviceId} aktualisiert`);
      } catch (error) {
        console.error(`Fehler bei Device ${device.deviceId}:`, error);
      }
    }

    // Alte Daten bereinigen (einmal täglich)
    await deleteOldCurrentData(30);
  } catch (error) {
    console.error('Cronjob failed:', error);
  }
}
