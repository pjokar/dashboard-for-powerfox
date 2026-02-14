/**
 * Mapper zwischen API-Response und DB-Strukturen
 * 
 * Die Powerfox API gibt snake_case zurück (z.B. a_Plus, a_Minus)
 * DB verwendet camelCase (Prisma-Schema)
 * 
 * Diese Mapper akzeptieren die Raw API-Response und mappen
 * direkt zu DB-Models (Prisma-Format)
 */

import type { Device, CurrentData, OperatingReport, Report } from '@prisma/client'

// ============================================
// Device Mapper
// ============================================

/**
 * Mappt API-Response (beliebiges Format) zu DB-Format
 * Akzeptiert sowohl camelCase als auch snake_case Felder
 */
export function deviceSdkToDb(apiData: any): Omit<Device, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    deviceId: apiData?.deviceId || apiData?.device_id || '',
    name: apiData?.name || apiData?.Name || null,
    accountAssociatedSince: apiData?.accountAssociatedSince || apiData?.AccountAssociatedSince || null,
    mainDevice: apiData?.mainDevice ?? apiData?.MainDevice ?? false,
    prosumer: apiData?.prosumer ?? apiData?.Prosumer ?? false,
    division: apiData?.division ?? apiData?.Division ?? 0,
  }
}

export function deviceDbToSdk(db: Device): any {
  return {
    deviceId: db.deviceId,
    name: db.name || undefined,
    accountAssociatedSince: db.accountAssociatedSince || undefined,
    mainDevice: db.mainDevice,
    prosumer: db.prosumer,
    division: db.division,
  }
}

// ============================================
// CurrentData Mapper
// ============================================

/**
 * Mappt API-Response (beliebiges Format) zu DB-Format
 * Akzeptiert sowohl camelCase als auch snake_case Felder
 * API gibt z.B. zurück: { a_Plus: 123, watt: 456, timestamp: 789 }
 */
export function currentDataSdkToDb(
  apiData: any & { unit?: string },
  deviceId: string
): Omit<CurrentData, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    deviceId: deviceId,
    outdated: apiData.outdated ?? apiData.Outdated ?? false,
    unit: apiData.unit || 'wh',
    watt: apiData.watt ?? apiData.Watt ?? null,
    kiloWattHour: apiData.kiloWattHour ?? apiData.KiloWattHour ?? null,
    deltaKiloWattHour: apiData.deltaKiloWattHour ?? apiData.DeltaKiloWattHour ?? null,
    cubicMeterCold: apiData.cubicMeterCold ?? apiData.CubicMeterCold ?? null,
    cubicMeterWarm: apiData.cubicMeterWarm ?? apiData.CubicMeterWarm ?? null,
    cubicMeter: apiData.cubicMeter ?? apiData.CubicMeter ?? null,
    deltaCubicMeter: apiData.deltaCubicMeter ?? apiData.DeltaCubicMeter ?? null,
    timestamp: apiData.timestamp ?? apiData.Timestamp ?? null,
    // API gibt snake_case mit lowercase: a_Plus, a_Minus, etc.
    aPlus: apiData.aPlus ?? apiData.a_Plus ?? apiData.A_Plus ?? null,
    aPlusHT: apiData.aPlusHT ?? apiData.a_Plus_HT ?? apiData.A_Plus_HT ?? null,
    aPlusNT: apiData.aPlusNT ?? apiData.a_Plus_NT ?? apiData.A_Plus_NT ?? null,
    aMinus: apiData.aMinus ?? apiData.a_Minus ?? apiData.A_Minus ?? null,
    l1: apiData.l1 ?? apiData.L1 ?? null,
    l2: apiData.l2 ?? apiData.L2 ?? null,
    l3: apiData.l3 ?? apiData.L3 ?? null,
  }
}

export function currentDataDbToSdk(db: CurrentData): any {
  return {
    deviceId: db.deviceId,
    outdated: db.outdated,
    watt: db.watt ?? undefined,
    kiloWattHour: db.kiloWattHour ?? undefined,
    deltaKiloWattHour: db.deltaKiloWattHour ?? undefined,
    cubicMeterCold: db.cubicMeterCold ?? undefined,
    cubicMeterWarm: db.cubicMeterWarm ?? undefined,
    cubicMeter: db.cubicMeter ?? undefined,
    deltaCubicMeter: db.deltaCubicMeter ?? undefined,
    timestamp: db.timestamp ?? undefined,
    aPlus: db.aPlus ?? undefined,
    aPlusHT: db.aPlusHT ?? undefined,
    aPlusNT: db.aPlusNT ?? undefined,
    aMinus: db.aMinus ?? undefined,
    l1: db.l1 ?? undefined,
    l2: db.l2 ?? undefined,
    l3: db.l3 ?? undefined,
  }
}

// ============================================
// OperatingReport Mapper
// ============================================

/**
 * Mappt API-Response (beliebiges Format) zu App-Format
 * API kann Data oder values zurückgeben
 */
export function operatingReportSdkToDb(
  apiData: any,
  deviceId: string
): {
  deviceId: string
  max?: number
  min?: number
  avg?: number
  values?: Array<{timestamp?: number, value?: number, average?: number, min?: number, max?: number}>
} {
  // API kann verschiedene Feldnamen verwenden
  const values = apiData.values ?? apiData.Values ?? apiData.Data ?? apiData.data
  
  // Mappe values wenn vorhanden
  const mappedValues = values ? values.map((v: any) => ({
    timestamp: v.timestamp ?? v.Timestamp,
    value: v.value ?? v.Value,
    average: v.average ?? v.Average ?? v.avg ?? v.Avg,
    min: v.min ?? v.Min,
    max: v.max ?? v.Max,
  })) : undefined

  return {
    deviceId: deviceId,
    max: apiData.max ?? apiData.Max,
    min: apiData.min ?? apiData.Min,
    avg: apiData.avg ?? apiData.Avg ?? apiData.average ?? apiData.Average,
    values: mappedValues,
  }
}

export function operatingReportDbToSdk(db: OperatingReport): any {
  return {
    deviceId: db.deviceId,
    max: db.max ?? undefined,
    min: db.min ?? undefined,
    avg: db.avg ?? undefined,
    values: undefined, // Muss separat geladen werden
    valuesPlus: undefined,
    valuesMinus: undefined,
  }
}

// ============================================
// Report Mapper
// ============================================

/**
 * Mappt API-Response (beliebiges Format) zu App-Format
 * API kann verschiedene Strukturen zurückgeben:
 * 1. Direkt: { values: [...] }
 * 2. Verschachtelt: { consumption: { reportValues: [...] }, feedIn: { reportValues: [...] } }
 */
export function reportSdkToDb(
  apiData: any,
  deviceId: string
): {
  deviceId: string
  values?: Array<{
    timestamp?: number
    date?: string
    aPlus?: number
    aMinus?: number
    consumption?: number
    feedIn?: number
  }>
  consumption?: any
  feedIn?: any
} {
  // API kann verschiedene Feldnamen verwenden
  let values = apiData.values ?? apiData.Values ?? apiData.Data ?? apiData.data
  
  // Falls keine direkten values, extrahiere aus consumption/feedIn
  if (!values && (apiData.consumption?.reportValues || apiData.feedIn?.reportValues)) {
    // Kombiniere consumption und feedIn reportValues in ein values Array
    const consumptionValues = apiData.consumption?.reportValues || []
    const feedInValues = apiData.feedIn?.reportValues || []
    
    // Erstelle ein gemeinsames Array mit allen Timestamps
    const timestampMap = new Map<number, any>()
    
    consumptionValues.forEach((v: any) => {
      const ts = v.timestamp ?? v.Timestamp ?? v.date ?? v.Date
      if (ts) {
        timestampMap.set(ts, {
          timestamp: ts,
          date: v.date ?? v.Date,
          // API nutzt 'delta' für den Wert in reportValues
          consumption: v.delta ?? v.value ?? v.Value ?? v.consumption ?? v.Consumption,
          aPlus: v.aPlus ?? v.a_Plus ?? v.A_Plus,
        })
      }
    })
    
    feedInValues.forEach((v: any) => {
      const ts = v.timestamp ?? v.Timestamp ?? v.date ?? v.Date
      if (ts) {
        const existing = timestampMap.get(ts) || { timestamp: ts }
        // API nutzt 'delta' für den Wert in reportValues
        existing.feedIn = v.delta ?? v.value ?? v.Value ?? v.feedIn ?? v.FeedIn
        existing.aMinus = v.aMinus ?? v.a_Minus ?? v.A_Minus
        existing.date = existing.date ?? v.date ?? v.Date
        timestampMap.set(ts, existing)
      }
    })
    
    values = Array.from(timestampMap.values()).sort((a, b) => {
      const aTs = typeof a.timestamp === 'number' ? a.timestamp : 0
      const bTs = typeof b.timestamp === 'number' ? b.timestamp : 0
      return aTs - bTs
    })
  }
  
  // Mappe values wenn vorhanden
  const mappedValues = values ? values.map((v: any) => ({
    timestamp: v.timestamp ?? v.Timestamp,
    date: v.date ?? v.Date,
    aPlus: v.aPlus ?? v.a_Plus ?? v.A_Plus,
    aMinus: v.aMinus ?? v.a_Minus ?? v.A_Minus,
    consumption: v.consumption ?? v.Consumption,
    feedIn: v.feedIn ?? v.FeedIn ?? v.feed_in,
  })) : undefined

  return {
    deviceId: deviceId,
    values: mappedValues,
    consumption: apiData.consumption ?? apiData.Consumption,
    feedIn: apiData.feedIn ?? apiData.FeedIn ?? apiData.feed_in,
  }
}

export function reportDbToSdk(db: Report): any {
  return {
    deviceId: db.deviceId,
    // Summaries müssen separat geladen werden
    consumption: undefined,
    ownConsumption: undefined,
    feedIn: undefined,
    generation: undefined,
    heat: undefined,
    gas: undefined,
    water: undefined,
  }
}

// ============================================
// ReportValue Mapper
// ============================================

export function reportValueSdkToDb(sdk: AppReportValue) {
  return {
    deviceId: sdk.deviceId || null,
    timestamp: sdk.timestamp || null,
    complete: sdk.complete ?? false,
    delta: sdk.delta || null,
    totalDelta: sdk.totalDelta || null,
    totalDeltaCurrency: sdk.totalDeltaCurrency || null,
    deltaHT: sdk.deltaHT || null,
    deltaNT: sdk.deltaNT || null,
    deltaCurrency: sdk.deltaCurrency || null,
    consumption: sdk.consumption || null,
    consumptionKWh: sdk.consumptionKWh || null,
    amountOfValuesAdded: sdk.amountOfValuesAdded || null,
    deltaKiloWattHour: sdk.deltaKiloWattHour || null,
    deltaCubicMeter: sdk.deltaCubicMeter || null,
    deltaCubicMeterCold: sdk.deltaCubicMeterCold || null,
    deltaCubicMeterWarm: sdk.deltaCubicMeterWarm || null,
    deltaCurrencyCold: sdk.deltaCurrencyCold || null,
    deltaCurrencyWarm: sdk.deltaCurrencyWarm || null,
    currentConsumption: sdk.currentConsumption || null,
    currentConsumptionKwh: sdk.currentConsumptionKwh || null,
    valuesType: sdk.valuesType || null,
  }
}

// ============================================
// Power Summary Mapper
// ============================================

export function powerSummarySdkToDb(sdk: AppReportSummaryPower) {
  return {
    sumCurrency: sdk.sumCurrency,
    startTime: sdk.startTime,
    startTimeCurrency: sdk.startTimeCurrency,
    sum: sdk.sum,
    max: sdk.max,
    maxCurrency: sdk.maxCurrency,
  }
}

// ============================================
// Heat Summary Mapper
// ============================================

export function heatSummarySdkToDb(sdk: AppReportSummaryHeat) {
  return {
    sumCurrency: sdk.sumCurrency,
    sumCubicMeter: sdk.sumCubicMeter,
    maxCubicMeter: sdk.maxCubicMeter,
    sumKiloWattHour: sdk.sumKiloWattHour,
    maxKiloWattHour: sdk.maxKiloWattHour,
  }
}

// ============================================
// Gas Summary Mapper
// ============================================

export function gasSummarySdkToDb(sdk: AppReportSummaryGas) {
  return {
    sumCurrency: sdk.sumCurrency,
    totalDelta: sdk.totalDelta,
    sum: sdk.sum,
    totalDeltaCurrency: sdk.totalDeltaCurrency,
    currentConsumptionKwh: sdk.currentConsumptionKwh,
    currentConsumption: sdk.currentConsumption,
    consumptionKWh: sdk.consumptionKWh,
    consumption: sdk.consumption,
    max: sdk.max,
    maxCurrency: sdk.maxCurrency,
    maxConsumption: sdk.maxConsumption,
    maxConsumptionKWh: sdk.maxConsumptionKWh,
    min: sdk.min,
    minConsumption: sdk.minConsumption,
    minConsumptionKWh: sdk.minConsumptionKWh,
    avgDelta: sdk.avgDelta,
    avgConsumption: sdk.avgConsumption,
    avgConsumptionKWh: sdk.avgConsumptionKWh,
  }
}

// ============================================
// Water Summary Mapper
// ============================================

export function waterSummarySdkToDb(sdk: AppReportSummaryWater) {
  return {
    sumCurrency: sdk.sumCurrency,
    sumCurrencyCold: sdk.sumCurrencyCold,
    sumCubicMeterCold: sdk.sumCubicMeterCold,
    maxCubicMeterCold: sdk.maxCubicMeterCold,
    sumCurrencyWarm: sdk.sumCurrencyWarm,
    sumCubicMeterWarm: sdk.sumCubicMeterWarm,
    maxCubicMeterWarm: sdk.maxCubicMeterWarm,
  }
}

// ============================================
// Meter Reading Mapper
// ============================================

export function meterReadingSdkToDb(sdk: AppReportMeterReading) {
  return {
    value: sdk.value,
    type: sdk.type,
  }
}

// ============================================
// Utility: Transform snake_case API fields to camelCase
// ============================================

export function transformApiFieldsToCamelCase(data: any): any {
  if (!data) return data
  
  const transformed = { ...data }
  
  // Spezielle Felder die von API in snake_case kommen
  if ('a_Plus' in transformed) {
    transformed.aPlus = transformed.a_Plus
    delete transformed.a_Plus
  }
  if ('a_Plus_HT' in transformed) {
    transformed.aPlusHT = transformed.a_Plus_HT
    delete transformed.a_Plus_HT
  }
  if ('a_Plus_NT' in transformed) {
    transformed.aPlusNT = transformed.a_Plus_NT
    delete transformed.a_Plus_NT
  }
  if ('a_Minus' in transformed) {
    transformed.aMinus = transformed.a_Minus
    delete transformed.a_Minus
  }
  
  return transformed
}
