
# AppReportSummaryHeat


## Properties

Name | Type
------------ | -------------
`meterReadings` | [Array&lt;AppReportMeterReading&gt;](AppReportMeterReading.md)
`reportValues` | [Array&lt;AppReportValue&gt;](AppReportValue.md)
`sumCurrency` | number
`sumCubicMeter` | number
`maxCubicMeter` | number
`sumKiloWattHour` | number
`maxKiloWattHour` | number

## Example

```typescript
import type { AppReportSummaryHeat } from ''

// TODO: Update the object below with actual values
const example = {
  "meterReadings": null,
  "reportValues": null,
  "sumCurrency": null,
  "sumCubicMeter": null,
  "maxCubicMeter": null,
  "sumKiloWattHour": null,
  "maxKiloWattHour": null,
} satisfies AppReportSummaryHeat

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AppReportSummaryHeat
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


