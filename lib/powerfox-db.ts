import { prisma } from './db';
import type {
  MyDeviceModel,
  MyCurrentDataModel,
  OperatingReportModel,
  ReportModel,
} from './powerfox-sdk/models';

/**
 * Speichert oder aktualisiert ein Device in der Datenbank
 * Akzeptiert gemappte Daten (DB-Format) - deviceId ist garantiert vorhanden
 */
export async function saveDevice(device: any) {
  if (!device.deviceId) {
    console.error('Device has no deviceId:', device);
    throw new Error('Device must have a deviceId');
  }
  
  return await prisma.device.upsert({
    where: { deviceId: device.deviceId },
    update: {
      name: device.name ?? null,
      accountAssociatedSince: device.accountAssociatedSince ?? null,
      mainDevice: device.mainDevice ?? false,
      prosumer: device.prosumer ?? false,
      division: device.division ?? 0,
      updatedAt: new Date(),
    },
    create: {
      deviceId: device.deviceId,
      name: device.name ?? null,
      accountAssociatedSince: device.accountAssociatedSince ?? null,
      mainDevice: device.mainDevice ?? false,
      prosumer: device.prosumer ?? false,
      division: device.division ?? 0,
    },
  });
}

/**
 * Speichert aktuelle Daten (CurrentData) für ein Device
 * Akzeptiert gemappte Daten (DB-Format) - deviceId ist garantiert vorhanden
 */
export async function saveCurrentData(data: any) {
  if (!data.deviceId) {
    console.error('CurrentData has no deviceId:', data);
    throw new Error('CurrentData must have a deviceId');
  }
  
  // Stelle sicher, dass das Device existiert
  await prisma.device.upsert({
    where: { deviceId: data.deviceId },
    update: {},
    create: {
      deviceId: data.deviceId,
      mainDevice: false,
      prosumer: false,
      division: 0,
    },
  });

  return await prisma.currentData.create({
    data: {
      deviceId: data.deviceId,
      outdated: data.outdated ?? false,
      unit: data.unit ?? "wh",
      watt: data.watt,
      kiloWattHour: data.kiloWattHour,
      deltaKiloWattHour: data.deltaKiloWattHour,
      cubicMeterCold: data.cubicMeterCold,
      cubicMeterWarm: data.cubicMeterWarm,
      cubicMeter: data.cubicMeter,
      deltaCubicMeter: data.deltaCubicMeter,
      timestamp: data.timestamp,
      aPlus: data.aPlus,
      aPlusHT: data.aPlusHT,
      aPlusNT: data.aPlusNT,
      aMinus: data.aMinus,
      l1: data.l1,
      l2: data.l2,
      l3: data.l3,
    },
  });
}

/**
 * Speichert einen Operating Report mit Values
 * Das SDK garantiert dass deviceId vorhanden ist
 */
/**
 * Speichert einen Operating Report (gemappte Daten aus API)
 * Akzeptiert gemappte Daten (DB-Format) - deviceId ist garantiert vorhanden
 */
export async function saveOperatingReport(report: any) {
  if (!report.deviceId) {
    console.error('OperatingReport has no deviceId:', report);
    throw new Error('OperatingReport must have a deviceId');
  }
  
  // Stelle sicher, dass das Device existiert
  await prisma.device.upsert({
    where: { deviceId: report.deviceId },
    update: {},
    create: {
      deviceId: report.deviceId,
      mainDevice: false,
      prosumer: false,
      division: 0,
    },
  });

  return await prisma.operatingReport.create({
    data: {
      deviceId: report.deviceId,
      max: report.max ?? null,
      min: report.min ?? null,
      avg: report.avg ?? null,
      values: report.values
        ? {
            create: report.values.map((v: any) => ({
              timestamp: v.timestamp ?? null,
              value: v.value ?? v.average ?? null,
            })),
          }
        : undefined,
    },
    include: {
      values: true,
    },
  });
}

/**
 * Speichert einen vollständigen Report mit allen Summaries
 * Akzeptiert gemappte Daten (DB-Format) - deviceId ist garantiert vorhanden
 */
export async function saveReport(report: any) {
  if (!report.deviceId) {
    console.error('Report has no deviceId:', report);
    throw new Error('Report must have a deviceId');
  }
  
  // Stelle sicher, dass das Device existiert
  await prisma.device.upsert({
    where: { deviceId: report.deviceId },
    update: {},
    create: {
      deviceId: report.deviceId,
      mainDevice: false,
      prosumer: false,
      division: 0,
    },
  });

  const createdReport = await prisma.report.create({
    data: {
      deviceId: report.deviceId,
    },
  });

  // Speichere Power Summaries
  if (report.consumption) {
    await createPowerSummary(createdReport.id, 'consumption', report.consumption);
  }
  if (report.ownConsumption) {
    await createPowerSummary(createdReport.id, 'ownConsumption', report.ownConsumption);
  }
  if (report.feedIn) {
    await createPowerSummary(createdReport.id, 'feedIn', report.feedIn);
  }
  if (report.generation) {
    await createPowerSummary(createdReport.id, 'generation', report.generation);
  }

  // Speichere Heat Summary
  if (report.heat) {
    await prisma.reportSummaryHeat.create({
      data: {
        reportId: createdReport.id,
        sumCurrency: report.heat.sumCurrency,
        sumCubicMeter: report.heat.sumCubicMeter,
        maxCubicMeter: report.heat.maxCubicMeter,
        sumKiloWattHour: report.heat.sumKiloWattHour,
        maxKiloWattHour: report.heat.maxKiloWattHour,
        meterReadings: report.heat.meterReadings
          ? {
              create: report.heat.meterReadings.map((mr) => ({
                value: mr.value,
                type: mr.type,
              })),
            }
          : undefined,
        reportValues: report.heat.reportValues
          ? {
              create: report.heat.reportValues.map((rv) => ({
                deviceId: rv.deviceId,
                timestamp: rv.timestamp,
                complete: rv.complete ?? false,
                delta: rv.delta,
                totalDelta: rv.totalDelta,
                totalDeltaCurrency: rv.totalDeltaCurrency,
                deltaHT: rv.deltaHT,
                deltaNT: rv.deltaNT,
                deltaCurrency: rv.deltaCurrency,
                consumption: rv.consumption,
                consumptionKWh: rv.consumptionKWh,
                amountOfValuesAdded: rv.amountOfValuesAdded,
                deltaKiloWattHour: rv.deltaKiloWattHour,
                deltaCubicMeter: rv.deltaCubicMeter,
                deltaCubicMeterCold: rv.deltaCubicMeterCold,
                deltaCubicMeterWarm: rv.deltaCubicMeterWarm,
                deltaCurrencyCold: rv.deltaCurrencyCold,
                deltaCurrencyWarm: rv.deltaCurrencyWarm,
                currentConsumption: rv.currentConsumption,
                currentConsumptionKwh: rv.currentConsumptionKwh,
                valuesType: rv.valuesType,
              })),
            }
          : undefined,
      },
    });
  }

  // Speichere Gas Summary
  if (report.gas) {
    await prisma.reportSummaryGas.create({
      data: {
        reportId: createdReport.id,
        sumCurrency: report.gas.sumCurrency,
        totalDelta: report.gas.totalDelta,
        sum: report.gas.sum,
        totalDeltaCurrency: report.gas.totalDeltaCurrency,
        currentConsumptionKwh: report.gas.currentConsumptionKwh,
        currentConsumption: report.gas.currentConsumption,
        consumptionKWh: report.gas.consumptionKWh,
        consumption: report.gas.consumption,
        max: report.gas.max,
        maxCurrency: report.gas.maxCurrency,
        maxConsumption: report.gas.maxConsumption,
        maxConsumptionKWh: report.gas.maxConsumptionKWh,
        min: report.gas.min,
        minConsumption: report.gas.minConsumption,
        minConsumptionKWh: report.gas.minConsumptionKWh,
        avgDelta: report.gas.avgDelta,
        avgConsumption: report.gas.avgConsumption,
        avgConsumptionKWh: report.gas.avgConsumptionKWh,
        meterReadings: report.gas.meterReadings
          ? {
              create: report.gas.meterReadings.map((mr) => ({
                value: mr.value,
                type: mr.type,
              })),
            }
          : undefined,
        reportValues: report.gas.reportValues
          ? {
              create: report.gas.reportValues.map((rv) => ({
                deviceId: rv.deviceId,
                timestamp: rv.timestamp,
                complete: rv.complete ?? false,
                delta: rv.delta,
                totalDelta: rv.totalDelta,
                totalDeltaCurrency: rv.totalDeltaCurrency,
                deltaHT: rv.deltaHT,
                deltaNT: rv.deltaNT,
                deltaCurrency: rv.deltaCurrency,
                consumption: rv.consumption,
                consumptionKWh: rv.consumptionKWh,
                amountOfValuesAdded: rv.amountOfValuesAdded,
                deltaKiloWattHour: rv.deltaKiloWattHour,
                deltaCubicMeter: rv.deltaCubicMeter,
                deltaCubicMeterCold: rv.deltaCubicMeterCold,
                deltaCubicMeterWarm: rv.deltaCubicMeterWarm,
                deltaCurrencyCold: rv.deltaCurrencyCold,
                deltaCurrencyWarm: rv.deltaCurrencyWarm,
                currentConsumption: rv.currentConsumption,
                currentConsumptionKwh: rv.currentConsumptionKwh,
                valuesType: rv.valuesType,
              })),
            }
          : undefined,
      },
    });
  }

  // Speichere Water Summary
  if (report.water) {
    await prisma.reportSummaryWater.create({
      data: {
        reportId: createdReport.id,
        sumCurrency: report.water.sumCurrency,
        sumCurrencyCold: report.water.sumCurrencyCold,
        sumCubicMeterCold: report.water.sumCubicMeterCold,
        maxCubicMeterCold: report.water.maxCubicMeterCold,
        sumCurrencyWarm: report.water.sumCurrencyWarm,
        sumCubicMeterWarm: report.water.sumCubicMeterWarm,
        maxCubicMeterWarm: report.water.maxCubicMeterWarm,
        meterReadings: report.water.meterReadings
          ? {
              create: report.water.meterReadings.map((mr) => ({
                value: mr.value,
                type: mr.type,
              })),
            }
          : undefined,
        reportValues: report.water.reportValues
          ? {
              create: report.water.reportValues.map((rv) => ({
                deviceId: rv.deviceId,
                timestamp: rv.timestamp,
                complete: rv.complete ?? false,
                delta: rv.delta,
                totalDelta: rv.totalDelta,
                totalDeltaCurrency: rv.totalDeltaCurrency,
                deltaHT: rv.deltaHT,
                deltaNT: rv.deltaNT,
                deltaCurrency: rv.deltaCurrency,
                consumption: rv.consumption,
                consumptionKWh: rv.consumptionKWh,
                amountOfValuesAdded: rv.amountOfValuesAdded,
                deltaKiloWattHour: rv.deltaKiloWattHour,
                deltaCubicMeter: rv.deltaCubicMeter,
                deltaCubicMeterCold: rv.deltaCubicMeterCold,
                deltaCubicMeterWarm: rv.deltaCubicMeterWarm,
                deltaCurrencyCold: rv.deltaCurrencyCold,
                deltaCurrencyWarm: rv.deltaCurrencyWarm,
                currentConsumption: rv.currentConsumption,
                currentConsumptionKwh: rv.currentConsumptionKwh,
                valuesType: rv.valuesType,
              })),
            }
          : undefined,
      },
    });
  }

  return await prisma.report.findUnique({
    where: { id: createdReport.id },
    include: {
      consumption: { include: { meterReadings: true, reportValues: true } },
      ownConsumption: { include: { meterReadings: true, reportValues: true } },
      feedIn: { include: { meterReadings: true, reportValues: true } },
      generation: { include: { meterReadings: true, reportValues: true } },
      heat: { include: { meterReadings: true, reportValues: true } },
      gas: { include: { meterReadings: true, reportValues: true } },
      water: { include: { meterReadings: true, reportValues: true } },
    },
  });
}

/**
 * Helper-Funktion zum Erstellen einer Power Summary
 */
async function createPowerSummary(
  reportId: string,
  summaryType: 'consumption' | 'ownConsumption' | 'feedIn' | 'generation',
  summary: any
) {
  // Bestimme das richtige Foreign Key Feld basierend auf dem summaryType
  const relationField: Record<string, string> = {
    consumption: 'reportConsumptionId',
    ownConsumption: 'reportOwnConsumptionId',
    feedIn: 'reportFeedInId',
    generation: 'reportGenerationId',
  };

  return await prisma.reportSummaryPower.create({
    data: {
      [relationField[summaryType]]: reportId,
      summaryType,
      sumCurrency: summary.sumCurrency,
      startTime: summary.startTime,
      startTimeCurrency: summary.startTimeCurrency,
      sum: summary.sum,
      max: summary.max,
      maxCurrency: summary.maxCurrency,
      meterReadings: summary.meterReadings
        ? {
            create: summary.meterReadings.map((mr: any) => ({
              value: mr.value,
              type: mr.type,
            })),
          }
        : undefined,
      reportValues: summary.reportValues
        ? {
            create: summary.reportValues.map((rv: any) => ({
              deviceId: rv.deviceId,
              timestamp: rv.timestamp,
              complete: rv.complete ?? false,
              delta: rv.delta,
              totalDelta: rv.totalDelta,
              totalDeltaCurrency: rv.totalDeltaCurrency,
              deltaHT: rv.deltaHT,
              deltaNT: rv.deltaNT,
              deltaCurrency: rv.deltaCurrency,
              consumption: rv.consumption,
              consumptionKWh: rv.consumptionKWh,
              amountOfValuesAdded: rv.amountOfValuesAdded,
              deltaKiloWattHour: rv.deltaKiloWattHour,
              deltaCubicMeter: rv.deltaCubicMeter,
              deltaCubicMeterCold: rv.deltaCubicMeterCold,
              deltaCubicMeterWarm: rv.deltaCubicMeterWarm,
              deltaCurrencyCold: rv.deltaCurrencyCold,
              deltaCurrencyWarm: rv.deltaCurrencyWarm,
              currentConsumption: rv.currentConsumption,
              currentConsumptionKwh: rv.currentConsumptionKwh,
              valuesType: rv.valuesType,
            })),
          }
        : undefined,
    },
  });
}

// ============================================
// Query Funktionen
// ============================================

/**
 * Holt alle Devices
 */
export async function getAllDevices() {
  return await prisma.device.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Holt ein Device anhand der deviceId
 */
export async function getDeviceByDeviceId(deviceId: string) {
  return await prisma.device.findUnique({
    where: { deviceId },
  });
}

/**
 * Holt die aktuellsten CurrentData für ein Device
 */
export async function getLatestCurrentData(deviceId: string, limit = 100) {
  return await prisma.currentData.findMany({
    where: { deviceId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Holt CurrentData für ein Device in einem Zeitraum
 */
export async function getCurrentDataByTimeRange(
  deviceId: string,
  startTimestamp: number,
  endTimestamp: number
) {
  return await prisma.currentData.findMany({
    where: {
      deviceId,
      timestamp: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
    },
    orderBy: { timestamp: 'asc' },
  });
}

/**
 * Holt Operating Reports für ein Device
 */
export async function getOperatingReports(deviceId: string, limit = 10) {
  return await prisma.operatingReport.findMany({
    where: { deviceId },
    include: {
      values: true,
      valuesPlus: true,
      valuesMinus: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Holt Reports für ein Device
 */
export async function getReports(deviceId: string, limit = 10) {
  return await prisma.report.findMany({
    where: { deviceId },
    include: {
      consumption: { include: { meterReadings: true, reportValues: true } },
      ownConsumption: { include: { meterReadings: true, reportValues: true } },
      feedIn: { include: { meterReadings: true, reportValues: true } },
      generation: { include: { meterReadings: true, reportValues: true } },
      heat: { include: { meterReadings: true, reportValues: true } },
      gas: { include: { meterReadings: true, reportValues: true } },
      water: { include: { meterReadings: true, reportValues: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Löscht alte CurrentData (z.B. älter als 30 Tage)
 */
export async function deleteOldCurrentData(daysToKeep = 30) {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - daysToKeep * 24 * 60 * 60;
  
  return await prisma.currentData.deleteMany({
    where: {
      timestamp: {
        lt: cutoffTimestamp,
      },
    },
  });
}

// ============================================
// API Logging Funktionen
// ============================================

/**
 * Speichert einen API-Aufruf Log
 */
export async function logApiCall(data: {
  endpoint: string;
  method: string;
  params?: Record<string, any>;
  statusCode: number;
  success: boolean;
  responseData?: any;
  errorMessage?: string;
  duration?: number;
}) {
  return await prisma.apiLog.create({
    data: {
      endpoint: data.endpoint,
      method: data.method,
      params: data.params ? JSON.stringify(data.params) : null,
      statusCode: data.statusCode,
      success: data.success,
      responseData: data.responseData ? JSON.stringify(data.responseData) : null,
      errorMessage: data.errorMessage,
      duration: data.duration,
    },
  });
}

/**
 * Holt die neuesten API-Logs
 */
export async function getApiLogs(limit = 100) {
  return await prisma.apiLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Holt API-Logs für einen bestimmten Endpoint
 */
export async function getApiLogsByEndpoint(endpoint: string, limit = 50) {
  return await prisma.apiLog.findMany({
    where: { endpoint },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Holt fehlgeschlagene API-Logs
 */
export async function getFailedApiLogs(limit = 50) {
  return await prisma.apiLog.findMany({
    where: { success: false },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Löscht alte API-Logs (z.B. älter als 7 Tage)
 */
export async function deleteOldApiLogs(daysToKeep = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return await prisma.apiLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });
}
