
# AppReportSummaryWater


## Properties

Name | Type
------------ | -------------
`meterReadings` | [Array&lt;AppReportMeterReading&gt;](AppReportMeterReading.md)
`reportValues` | [Array&lt;AppReportValue&gt;](AppReportValue.md)
`sumCurrency` | number
`sumCurrencyCold` | number
`sumCubicMeterCold` | number
`maxCubicMeterCold` | number
`sumCurrencyWarm` | number
`sumCubicMeterWarm` | number
`maxCubicMeterWarm` | number

## Example

```typescript
import type { AppReportSummaryWater } from ''

// TODO: Update the object below with actual values
const example = {
  "meterReadings": null,
  "reportValues": null,
  "sumCurrency": null,
  "sumCurrencyCold": null,
  "sumCubicMeterCold": null,
  "maxCubicMeterCold": null,
  "sumCurrencyWarm": null,
  "sumCubicMeterWarm": null,
  "maxCubicMeterWarm": null,
} satisfies AppReportSummaryWater

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AppReportSummaryWater
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


