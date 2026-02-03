# MyApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**apiVersionMyIdCurrentGet**](MyApi.md#apiversionmyidcurrentget) | **GET** /api/{version}/my/{id}/current | Abfrage der aktuellen Werte für Leistung und Zählerstände eines poweroptis |
| [**apiVersionMyIdDevicesGet**](MyApi.md#apiversionmyiddevicesget) | **GET** /api/{version}/my/{id}/devices | Abfrage der mit dem Konto verknüpften Geräte. |
| [**apiVersionMyIdOperatingGet**](MyApi.md#apiversionmyidoperatingget) | **GET** /api/{version}/my/{id}/operating | Abruf der Leistungswerte für die letzte Stunde. |
| [**apiVersionMyIdOperatingcsvGet**](MyApi.md#apiversionmyidoperatingcsvget) | **GET** /api/{version}/my/{id}/operatingcsv | Herunterladen der Leistungswerte als CSV-Datei für die letzten 7 Tage. |
| [**apiVersionMyIdReportGet**](MyApi.md#apiversionmyidreportget) | **GET** /api/{version}/my/{id}/report | Abruf der aggregierten Daten. |
| [**apiVersionMyIdReportcsvGet**](MyApi.md#apiversionmyidreportcsvget) | **GET** /api/{version}/my/{id}/reportcsv | Herunterladen der Viertelstundenverbrauchswerte als CSV-Datei für die letzten 31 Tage. |



## apiVersionMyIdCurrentGet

> MyCurrentDataModel apiVersionMyIdCurrentGet(id, version, unit)

Abfrage der aktuellen Werte für Leistung und Zählerstände eines poweroptis

Abfrage eines Gerätes durch \&quot;main\&quot; als ID Parameter oder falls mehrere \&quot;MainDevice\&quot; existieren, die poweropti ID als ID parameter verwenden.  &lt;br /&gt;&lt;br /&gt;  Die Zählerstände liegen in Wh (oder nach Wunsch in kWh siehe unit-Parameter) vor   &lt;br /&gt;&lt;br /&gt;  Die Leistung liegt in W vor   &lt;br /&gt;&lt;br /&gt;  Die HT- und NT-Werte werden nur mitgeliefert, wenn Sie einen 2-Tarifzähler haben.   &lt;br /&gt;&lt;br /&gt;  Zusätzlich gibt bei Strommessung „Outdated“ an ob dieser Wert vom System als veraltet gilt, d.h.wenn der Zeitstempel des Wertes mehr als 60 Sekunden in der Vergangenheit liegt(es gibt allerdings keinerlei Auskunft über den Online-Status des poweroptis, es kann aber auf eine fehlende oder schlechte Verbindung hindeuten) – Das Flag kann für die Integration in Drittsysteme verwendet werden

### Example

```ts
import {
  Configuration,
  MyApi,
} from '';
import type { ApiVersionMyIdCurrentGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: Basic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // Configure HTTP bearer authorization: Bearer
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MyApi(config);

  const body = {
    // string | \"main\" oder konkrete poweropti ID (main => für alle als Hauptzähler markierten Geräte)
    id: id_example,
    // number | API Version
    version: 1.2,
    // string | Zählerstände in Wh, wenn unit = \"wh\" oder in kWh, wenn unit = \"kwh\" (optional)
    unit: unit_example,
  } satisfies ApiVersionMyIdCurrentGetRequest;

  try {
    const data = await api.apiVersionMyIdCurrentGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | \&quot;main\&quot; oder konkrete poweropti ID (main &#x3D;&gt; für alle als Hauptzähler markierten Geräte) | [Defaults to `&#39;main&#39;`] |
| **version** | `number` | API Version | [Defaults to `2`] |
| **unit** | `string` | Zählerstände in Wh, wenn unit &#x3D; \&quot;wh\&quot; oder in kWh, wenn unit &#x3D; \&quot;kwh\&quot; | [Optional] [Defaults to `&#39;wh&#39;`] |

### Return type

[**MyCurrentDataModel**](MyCurrentDataModel.md)

### Authorization

[Basic](../README.md#Basic), [Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/plain`, `application/json`, `text/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Wirft eine 200 wenn die Daten erfolgreich ausgegeben werden. |  -  |
| **412** | Wirft eine 412, wenn die Übertragung der Daten durch den Kunden selbst verweigert wurde. |  -  |
| **429** | Wirft eine 429, wenn zu viele Anfragen in zu kurzer Zeit gestellt werden. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## apiVersionMyIdDevicesGet

> Array&lt;MyDeviceModel&gt; apiVersionMyIdDevicesGet(id, version)

Abfrage der mit dem Konto verknüpften Geräte.

Abfrage der mit dem Konto verknüpften Geräte    &lt;br /&gt;  \&quot;MainDevice\&quot; sind alle Geräte, die Verbrauch bzw. Verbrauch und Einspeisung messen (z.B. Haushaltszähler, zweiter Zähler für Wärmepumpe)   &lt;br /&gt;  Zähler zur Messung der Produktion sind keine \&quot;MainDevice\&quot; (z.B. Zähler an PV-Anlage, BHKW)    &lt;br /&gt;  „Prosumer“ spiegelt die Einstellung der App wider, ob der poweropti auf einem Zweirichtungszähler montiert ist und somit auch Einspeisung misst(„true“ bei Zweirichtungszähler ansonsten „false“)  &lt;br /&gt;  „Division“ entspricht dem Zählertyp, für den der poweropti in der App konfiguriert wurde. Es entspricht folgenden Werten:   &lt;br /&gt;   - Kein Typ hinterlegt: -1  &lt;br /&gt;   - Stromzähler: 0  &lt;br /&gt;   - Kaltwasserzähler: 1  &lt;br /&gt;   - Warmwasserzähler: 2  &lt;br /&gt;   - Wärmezähler: 3  &lt;br /&gt;   - Gaszähler: 4  &lt;br /&gt;   - Kalt- und Warmwasserzähler: 5

### Example

```ts
import {
  Configuration,
  MyApi,
} from '';
import type { ApiVersionMyIdDevicesGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: Basic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // Configure HTTP bearer authorization: Bearer
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MyApi(config);

  const body = {
    // string | \"all\"
    id: id_example,
    // number | API Version
    version: 1.2,
  } satisfies ApiVersionMyIdDevicesGetRequest;

  try {
    const data = await api.apiVersionMyIdDevicesGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | \&quot;all\&quot; | [Defaults to `&#39;all&#39;`] |
| **version** | `number` | API Version | [Defaults to `2`] |

### Return type

[**Array&lt;MyDeviceModel&gt;**](MyDeviceModel.md)

### Authorization

[Basic](../README.md#Basic), [Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/plain`, `application/json`, `text/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Wirft eine 200 wenn die Daten erfolgreich ausgegeben werden. |  -  |
| **400** | Wirft eine 400, wenn die Url nicht .../my/all/devices entspricht. |  -  |
| **429** | Wirft eine 429, wenn zu viele Anfragen in zu kurzer Zeit gestellt werden. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## apiVersionMyIdOperatingGet

> OperatingReportModel apiVersionMyIdOperatingGet(id, version)

Abruf der Leistungswerte für die letzte Stunde.

Abfrage der historischen Wirkleistung der letzten 60 Minuten ab Abfrage für das \&quot;MainDevice\&quot; (falls mehrere \&quot;MainDevice\&quot; existieren, nächsten Aufruf verwenden), wenn als ID \&quot;main\&quot; verwendet wird.  &lt;br /&gt;&lt;br /&gt;  Oder Abfrage der historischen Wirkleistung eines Grätes wenn die poweropti ID als ID Parameter verwendet wird.  &lt;br /&gt;&lt;br /&gt;  Aggregation der Werte auf 2-Minutenbasis - Durchschnittswerte (inklusive Min und Max der Originalwerte).    &lt;br /&gt;  Werte liegen in W vor

### Example

```ts
import {
  Configuration,
  MyApi,
} from '';
import type { ApiVersionMyIdOperatingGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: Basic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // Configure HTTP bearer authorization: Bearer
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MyApi(config);

  const body = {
    // string | \"main\" oder konkrete poweropti ID (main => für alle als Hauptzähler markierten Geräte)
    id: id_example,
    // number | API Version
    version: 1.2,
  } satisfies ApiVersionMyIdOperatingGetRequest;

  try {
    const data = await api.apiVersionMyIdOperatingGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | \&quot;main\&quot; oder konkrete poweropti ID (main &#x3D;&gt; für alle als Hauptzähler markierten Geräte) | [Defaults to `&#39;main&#39;`] |
| **version** | `number` | API Version | [Defaults to `2`] |

### Return type

[**OperatingReportModel**](OperatingReportModel.md)

### Authorization

[Basic](../README.md#Basic), [Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/plain`, `application/json`, `text/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Wirft eine 200 wenn die Daten erfolgreich ausgegeben werden. |  -  |
| **412** | Wirft eine 412, wenn die Übertragung der Daten durch den Kunden selbst verweigert wurde. |  -  |
| **429** | Wirft eine 429, wenn zu viele Anfragen in zu kurzer Zeit gestellt werden. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## apiVersionMyIdOperatingcsvGet

> apiVersionMyIdOperatingcsvGet(id, version)

Herunterladen der Leistungswerte als CSV-Datei für die letzten 7 Tage.

Siehe Beschreibung /operating

### Example

```ts
import {
  Configuration,
  MyApi,
} from '';
import type { ApiVersionMyIdOperatingcsvGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: Basic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // Configure HTTP bearer authorization: Bearer
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MyApi(config);

  const body = {
    // string | Geräte-ID (poweropti ID)
    id: id_example,
    // number | API Version
    version: 1.2,
  } satisfies ApiVersionMyIdOperatingcsvGetRequest;

  try {
    const data = await api.apiVersionMyIdOperatingcsvGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | Geräte-ID (poweropti ID) | [Defaults to `undefined`] |
| **version** | `number` | API Version | [Defaults to `2`] |

### Return type

`void` (Empty response body)

### Authorization

[Basic](../README.md#Basic), [Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Wirft eine 200 wenn die Daten erfolgreich ausgegeben werden. |  -  |
| **412** | Wirft eine 412, wenn die Übertragung der Daten durch den Kunden selbst verweigert wurde. |  -  |
| **429** | Wirft eine 429, wenn zu viele Anfragen in zu kurzer Zeit gestellt werden. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## apiVersionMyIdReportGet

> ReportModel apiVersionMyIdReportGet(id, version, day, month, year, fromhour)

Abruf der aggregierten Daten.

Abfrage der Deltas eines Gerätes (entweder Verbrauch und Einspeisung oder Generation/Produktion → abhängig davon ob \&quot;MainDevice\&quot;), wenn die poweropti ID als parameter verwendet wird.  &lt;br /&gt;&lt;br /&gt;  Oder Abfrage aller Geräte, wenn \&quot;all\&quot; als ID verwendet wird.  &lt;br /&gt;&lt;br /&gt;  Die HT- und NT-Werte werden nur mitgeliefert, wenn Sie einen 2-Tarifzähler haben.   &lt;br /&gt;  Folgende Zeitangaben sind möglich:  - Angabe von \&quot;year\&quot;: Monatswerte für das angegebene Jahr (liefert die Monatswerte für das angegebene Jahr(XXXX) (vom 1.1. oder vom Aktivierungsstartpunkt bis zum heutigen Tag oder bis zum 31.12.)).  &lt;br /&gt;  - Angabe von \&quot;year\&quot; und \&quot;month\&quot;: Tageswerte für das angegebene Jahr und den Monat (liefert die Tageswerte für das angegebene Jahr(XXXX) und den Monat(YY) (vom 1. bis zum Letzten des Monats)).  &lt;br /&gt;  - Angabe von \&quot;year\&quot;, \&quot;month\&quot; und \&quot;day\&quot;: Stundenwerte für das angegebene Datum (liefert die Stundenwerte für das konkrete Datum (von 0 Uhr lokaler Zeit bis 23:59 lokaler Zeit)).  &lt;br /&gt;  - Angabe von \&quot;year\&quot;, \&quot;month\&quot;, \&quot;day\&quot; und \&quot;fromHour\&quot;: Viertelstundenwerte ab angegebenen Zeitpunkt für 6 Stunden (also 24 Werte,  Z.B. fromHour&#x3D;6, dann werden Werte von 6:00 bis 11:59 geliefert)  &lt;br /&gt;  - Keine Angabe: Letzten 24 Stundenwerte ab Abruf.  &lt;br /&gt;&lt;br /&gt;  Sollte eine Abfrage nicht die richtige Kombination aus Parametern enthalten z.B. nur Tag und Jahr sind angegeben, tritt der Standardfall ein → letzten 24 Stundenwerte ab Abruf.

### Example

```ts
import {
  Configuration,
  MyApi,
} from '';
import type { ApiVersionMyIdReportGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: Basic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // Configure HTTP bearer authorization: Bearer
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MyApi(config);

  const body = {
    // string | \"all\" oder konkrete poweropti ID
    id: id_example,
    // number | API Version
    version: 1.2,
    // number |  (optional)
    day: 56,
    // number |  (optional)
    month: 56,
    // number |  (optional)
    year: 56,
    // number |  (optional)
    fromhour: 56,
  } satisfies ApiVersionMyIdReportGetRequest;

  try {
    const data = await api.apiVersionMyIdReportGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | \&quot;all\&quot; oder konkrete poweropti ID | [Defaults to `&#39;all&#39;`] |
| **version** | `number` | API Version | [Defaults to `2`] |
| **day** | `number` |  | [Optional] [Defaults to `0`] |
| **month** | `number` |  | [Optional] [Defaults to `0`] |
| **year** | `number` |  | [Optional] [Defaults to `0`] |
| **fromhour** | `number` |  | [Optional] [Defaults to `0`] |

### Return type

[**ReportModel**](ReportModel.md)

### Authorization

[Basic](../README.md#Basic), [Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/plain`, `application/json`, `text/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Wirft eine 200 wenn die Daten erfolgreich ausgegeben werden. |  -  |
| **412** | Wirft eine 412, wenn die Übertragung der Daten durch den Kunden selbst verweigert wurde. |  -  |
| **429** | Wirft eine 429, wenn zu viele Anfragen in zu kurzer Zeit gestellt werden. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## apiVersionMyIdReportcsvGet

> apiVersionMyIdReportcsvGet(id, version)

Herunterladen der Viertelstundenverbrauchswerte als CSV-Datei für die letzten 31 Tage.

Siehe Beschreibung /report

### Example

```ts
import {
  Configuration,
  MyApi,
} from '';
import type { ApiVersionMyIdReportcsvGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: Basic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // Configure HTTP bearer authorization: Bearer
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MyApi(config);

  const body = {
    // string | Geräte-ID (poweropti ID)
    id: id_example,
    // number | API Version
    version: 1.2,
  } satisfies ApiVersionMyIdReportcsvGetRequest;

  try {
    const data = await api.apiVersionMyIdReportcsvGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | Geräte-ID (poweropti ID) | [Defaults to `undefined`] |
| **version** | `number` | API Version | [Defaults to `2`] |

### Return type

`void` (Empty response body)

### Authorization

[Basic](../README.md#Basic), [Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Wirft eine 200 wenn die Daten erfolgreich ausgegeben werden. |  -  |
| **412** | Wirft eine 412, wenn die Übertragung der Daten durch den Kunden selbst verweigert wurde. |  -  |
| **429** | Wirft eine 429, wenn zu viele Anfragen in zu kurzer Zeit gestellt werden. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

