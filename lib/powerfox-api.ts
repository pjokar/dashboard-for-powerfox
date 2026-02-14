/**
 * Zentrale Powerfox API-Schicht
 * 
 * - Alle SDK-Calls erfolgen hier
 * - Mapping von SDK → DB/App-Format erfolgt hier
 * - API-Routes und Hooks nutzen nur diese Funktionen
 * - App arbeitet nur mit DB/App-Format (gemappte Daten)
 * 
 * WICHTIG: Der generierte SDK hat ein Problem mit ReadableStream.
 * Wir müssen die *Raw Methoden nutzen und den Body manuell auslesen.
 */

import { MyApi, Configuration } from "@/lib/powerfox-sdk"
import {
  deviceSdkToDb,
  currentDataSdkToDb,
  operatingReportSdkToDb,
  reportSdkToDb,
} from "@/lib/mappers"
import { logApiCall } from "@/lib/powerfox-db"

/**
 * Credentials für Powerfox API
 */
export interface PowerfoxCredentials {
  email: string
  password: string
}

/**
 * Erstellt eine SDK-Instanz mit Credentials
 */
function createApi(credentials: PowerfoxCredentials): MyApi {
  const config = new Configuration({
    username: credentials.email,
    password: credentials.password,
    basePath: "https://backend.powerfox.energy",
  })
  return new MyApi(config)
}

/**
 * Löst den ReadableStream der Raw Response auf
 * 
 * Der von @openapitools/openapi-generator-cli generierte SDK
 * hat ein Problem mit ReadableStream - der Body ist locked/closed.
 * Diese Funktion liest den Stream korrekt aus.
 * 
 * Die Mapper-Funktionen übernehmen dann die Transformation
 * von API-Response zu DB-Models.
 */
async function parseRawResponse(response: any): Promise<any> {
  const text = await response.raw.text()
  return JSON.parse(text)
}

// ============================================
// Devices
// ============================================

/**
 * Holt alle Devices und mappt sie auf DB-Format
 */
export async function fetchDevices(credentials: PowerfoxCredentials) {
  const startTime = Date.now()
  
  try {
    const api = createApi(credentials)
    const response = await api.apiVersionMyIdDevicesGetRaw({
      id: 'all',
      version: 2,
    })

    const rawData = await parseRawResponse(response)
    const mappedDevices = Array.isArray(rawData)
      ? rawData
          .filter((d: any) => d.deviceId || d.device_id)
          .map((d: any) => deviceSdkToDb(d))
      : [deviceSdkToDb(rawData)]

    // Log erfolgreichen API-Call
    const duration = Date.now() - startTime
    await logApiCall({
      endpoint: 'all/devices',
      method: 'GET',
      params: undefined,
      statusCode: 200,
      success: true,
      responseData: mappedDevices,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    return mappedDevices
  } catch (error: any) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch devices'
    
    console.error('[powerfox-api] Error fetching devices:', error)
    
    // Log fehlgeschlagenen API-Call
    await logApiCall({
      endpoint: 'all/devices',
      method: 'GET',
      params: undefined,
      statusCode: error.response?.status || 500,
      success: false,
      errorMessage,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    throw error
  }
}

/**
 * Holt das Main Device
 */
export async function fetchMainDevice(credentials: PowerfoxCredentials) {
  const startTime = Date.now()
  
  try {
    const api = createApi(credentials)
    const response = await api.apiVersionMyIdDevicesGetRaw({
      id: 'main',
      version: 2,
    })
    
    const rawData = await parseRawResponse(response)
    const mappedDevice = Array.isArray(rawData)
      ? rawData.filter((d: any) => d.deviceId || d.device_id).map((d: any) => deviceSdkToDb(d))
      : [deviceSdkToDb(rawData)]
    
    const duration = Date.now() - startTime
    await logApiCall({
      endpoint: 'main/devices',
      method: 'GET',
      params: undefined,
      statusCode: 200,
      success: true,
      responseData: mappedDevice,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    return mappedDevice[0] || null
  } catch (error: any) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch main device'
    
    console.error('[powerfox-api] Error fetching main device:', error)
    
    await logApiCall({
      endpoint: 'main/devices',
      method: 'GET',
      params: undefined,
      statusCode: error.response?.status || 500,
      success: false,
      errorMessage,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    throw error
  }
}

// ============================================
// Current Data
// ============================================

/**
 * Holt aktuelle Daten für ein Device und mappt sie auf DB-Format
 */
export async function fetchCurrentData(
  credentials: PowerfoxCredentials,
  deviceId: string,
  unit: 'wh' | 'kwh' = 'wh'
) {
  const startTime = Date.now()
  
  try {
    const api = createApi(credentials)
    const response = await api.apiVersionMyIdCurrentGetRaw({
      id: deviceId,
      version: 2,
      unit,
    })
    
    const rawData = await parseRawResponse(response)
    const mappedData = currentDataSdkToDb(
      { ...rawData, unit },
      deviceId
    )
    const duration = Date.now() - startTime
    await logApiCall({
      endpoint: `${deviceId}/current`,
      method: 'GET',
      params: { unit },
      statusCode: 200,
      success: true,
      responseData: mappedData,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    return mappedData
  } catch (error: any) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch current data'
    
    console.error('[powerfox-api] Error fetching current data:', error)
    
    await logApiCall({
      endpoint: `${deviceId}/current`,
      method: 'GET',
      params: { unit },
      statusCode: error.response?.status || 500,
      success: false,
      errorMessage,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    throw error
  }
}

// ============================================
// Operating Report
// ============================================

/**
 * Holt Operating Report für ein Device und mappt ihn auf DB-Format
 */
export async function fetchOperatingReport(
  credentials: PowerfoxCredentials,
  deviceId: string
) {
  const startTime = Date.now()
  
  try {
    const api = createApi(credentials)
    const response = await api.apiVersionMyIdOperatingGetRaw({
      id: deviceId,
      version: 2,
    })
    
    const rawData = await parseRawResponse(response)
    const mappedData = operatingReportSdkToDb(rawData, deviceId)
    const duration = Date.now() - startTime
    await logApiCall({
      endpoint: `${deviceId}/operating`,
      method: 'GET',
      params: undefined,
      statusCode: 200,
      success: true,
      responseData: mappedData,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    return mappedData
  } catch (error: any) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch operating report'
    
    console.error('[powerfox-api] Error fetching operating report:', error)
    
    await logApiCall({
      endpoint: `${deviceId}/operating`,
      method: 'GET',
      params: undefined,
      statusCode: error.response?.status || 500,
      success: false,
      errorMessage,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    throw error
  }
}

// ============================================
// Report
// ============================================

export interface ReportParams {
  day?: number
  month?: number
  year?: number
  fromhour?: number
}

/**
 * Holt Report für ein Device und mappt ihn auf DB-Format
 */
export async function fetchReport(
  credentials: PowerfoxCredentials,
  deviceId: string,
  params?: ReportParams
) {
  const startTime = Date.now()
  
  try {
    const api = createApi(credentials)
    const response = await api.apiVersionMyIdReportGetRaw({
      id: deviceId,
      version: 2,
      ...params,
    })
    
    const rawData = await parseRawResponse(response)
    const mappedData = reportSdkToDb(rawData, deviceId)
    const duration = Date.now() - startTime
    await logApiCall({
      endpoint: `${deviceId}/report`,
      method: 'GET',
      params: params,
      statusCode: 200,
      success: true,
      responseData: mappedData,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    return mappedData
  } catch (error: any) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch report'
    
    console.error('[powerfox-api] Error fetching report:', error)
    
    await logApiCall({
      endpoint: `${deviceId}/report`,
      method: 'GET',
      params: params,
      statusCode: error.response?.status || 500,
      success: false,
      errorMessage,
      duration,
    }).catch(err => console.error('Failed to log API call:', err))
    
    throw error
  }
}
