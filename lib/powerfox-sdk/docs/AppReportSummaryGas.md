
# AppReportSummaryGas


## Properties

Name | Type
------------ | -------------
`meterReadings` | [Array&lt;AppReportMeterReading&gt;](AppReportMeterReading.md)
`reportValues` | [Array&lt;AppReportValue&gt;](AppReportValue.md)
`sumCurrency` | number
`totalDelta` | number
`sum` | number
`totalDeltaCurrency` | number
`currentConsumptionKwh` | number
`currentConsumption` | number
`consumptionKWh` | number
`consumption` | number
`max` | number
`maxCurrency` | number
`maxConsumption` | number
`maxConsumptionKWh` | number
`min` | number
`minConsumption` | number
`minConsumptionKWh` | number
`avgDelta` | number
`avgConsumption` | number
`avgConsumptionKWh` | number

## Example

```typescript
import type { AppReportSummaryGas } from ''

// TODO: Update the object below with actual values
const example = {
  "meterReadings": null,
  "reportValues": null,
  "sumCurrency": null,
  "totalDelta": null,
  "sum": null,
  "totalDeltaCurrency": null,
  "currentConsumptionKwh": null,
  "currentConsumption": null,
  "consumptionKWh": null,
  "consumption": null,
  "max": null,
  "maxCurrency": null,
  "maxConsumption": null,
  "maxConsumptionKWh": null,
  "min": null,
  "minConsumption": null,
  "minConsumptionKWh": null,
  "avgDelta": null,
  "avgConsumption": null,
  "avgConsumptionKWh": null,
} satisfies AppReportSummaryGas

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AppReportSummaryGas
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


