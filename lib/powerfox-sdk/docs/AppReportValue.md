
# AppReportValue


## Properties

Name | Type
------------ | -------------
`deviceId` | string
`timestamp` | number
`complete` | boolean
`delta` | number
`totalDelta` | number
`totalDeltaCurrency` | number
`deltaHT` | number
`deltaNT` | number
`deltaCurrency` | number
`consumption` | number
`consumptionKWh` | number
`amountOfValuesAdded` | number
`deltaKiloWattHour` | number
`deltaCubicMeter` | number
`deltaCubicMeterCold` | number
`deltaCubicMeterWarm` | number
`deltaCurrencyCold` | number
`deltaCurrencyWarm` | number
`currentConsumption` | number
`currentConsumptionKwh` | number
`valuesType` | [ValuesType](ValuesType.md)

## Example

```typescript
import type { AppReportValue } from ''

// TODO: Update the object below with actual values
const example = {
  "deviceId": null,
  "timestamp": null,
  "complete": null,
  "delta": null,
  "totalDelta": null,
  "totalDeltaCurrency": null,
  "deltaHT": null,
  "deltaNT": null,
  "deltaCurrency": null,
  "consumption": null,
  "consumptionKWh": null,
  "amountOfValuesAdded": null,
  "deltaKiloWattHour": null,
  "deltaCubicMeter": null,
  "deltaCubicMeterCold": null,
  "deltaCubicMeterWarm": null,
  "deltaCurrencyCold": null,
  "deltaCurrencyWarm": null,
  "currentConsumption": null,
  "currentConsumptionKwh": null,
  "valuesType": null,
} satisfies AppReportValue

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AppReportValue
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


