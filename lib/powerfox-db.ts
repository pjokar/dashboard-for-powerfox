import { prisma } from './db';
import type {
  MyDeviceModel,
  MyCurrentDataModel,
  OperatingReportModel,
  ReportModel,
} from './powerfox-sdk/models';

/**
 * Speichert oder aktualisiert ein Device in der Datenbank
 */
export async function saveDevice(device: MyDeviceModel) {
  if (!device.deviceId) {
    throw new Error('DeviceId is required');
  }

  return await prisma.device.upsert({
    where: { deviceId: device.deviceId },
    update: {
      name: device.name,
      accountAssociatedSince: device.accountAssociatedSince,
      mainDevice: device.mainDevice ?? false,
      prosumer: device.prosumer ?? false,
      division: device.division ?? 0,
      updatedAt: new Date(),
    },
    create: {
      deviceId: device.deviceId,
      name: device.name,
      accountAssociatedSince: device.accountAssociatedSince,
      mainDevice: device.mainDevice ?? false,
      prosumer: device.prosumer ?? false,
      division: device.division ?? 0,
    },
  });
}

/**
 * Speichert aktuelle Daten (CurrentData) für ein Device
 */
export async function saveCurrentData(data: MyCurrentDataModel) {
  if (!data.deviceId) {
    throw new Error('DeviceId is required');
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
 */
export async function saveOperatingReport(report: OperatingReportModel) {
  if (!report.deviceId) {
    throw new Error('DeviceId is required');
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
      max: report.max,
      min: report.min,
      avg: report.avg,
      values: report.values
        ? {
            create: report.values.map((v) => ({
              timestamp: v.timestamp,
              value: v.value,
            })),
          }
        : undefined,
      valuesPlus: report.valuesPlus
        ? {
            create: report.valuesPlus.map((v) => ({
              timestamp: v.timestamp,
              value: v.value,
            })),
          }
        : undefined,
      valuesMinus: report.valuesMinus
        ? {
            create: report.valuesMinus.map((v) => ({
              timestamp: v.timestamp,
              value: v.value,
            })),
          }
        : undefined,
    },
    include: {
      values: true,
      valuesPlus: true,
      valuesMinus: true,
    },
  });
}

/**
 * Speichert einen vollständigen Report mit allen Summaries
 */
export async function saveReport(report: ReportModel) {
  if (!report.deviceId) {
    throw new Error('DeviceId is required');
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
        startTime: report.heat.startTime,
        startTimeCurrency: report.heat.startTimeCurrency,
        sum: report.heat.sum,
        max: report.heat.max,
        maxCurrency: report.heat.maxCurrency,
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
                timestamp: rv.timestamp,
                value: rv.value,
                type: rv.type,
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
        startTime: report.gas.startTime,
        startTimeCurrency: report.gas.startTimeCurrency,
        sum: report.gas.sum,
        max: report.gas.max,
        maxCurrency: report.gas.maxCurrency,
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
                timestamp: rv.timestamp,
                value: rv.value,
                type: rv.type,
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
        startTime: report.water.startTime,
        startTimeCurrency: report.water.startTimeCurrency,
        sum: report.water.sum,
        max: report.water.max,
        maxCurrency: report.water.maxCurrency,
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
                timestamp: rv.timestamp,
                value: rv.value,
                type: rv.type,
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
  return await prisma.reportSummaryPower.create({
    data: {
      reportId,
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
              timestamp: rv.timestamp,
              value: rv.value,
              type: rv.type,
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
