
# MyCurrentDataModel


## Properties

Name | Type
------------ | -------------
`deviceId` | string
`outdated` | boolean
`watt` | number
`kiloWattHour` | number
`deltaKiloWattHour` | number
`cubicMeterCold` | number
`cubicMeterWarm` | number
`cubicMeter` | number
`deltaCubicMeter` | number
`timestamp` | number
`aPlus` | number
`aPlusHT` | number
`aPlusNT` | number
`aMinus` | number
`l1` | number
`l2` | number
`l3` | number

## Example

```typescript
import type { MyCurrentDataModel } from ''

// TODO: Update the object below with actual values
const example = {
  "deviceId": null,
  "outdated": null,
  "watt": null,
  "kiloWattHour": null,
  "deltaKiloWattHour": null,
  "cubicMeterCold": null,
  "cubicMeterWarm": null,
  "cubicMeter": null,
  "deltaCubicMeter": null,
  "timestamp": null,
  "aPlus": null,
  "aPlusHT": null,
  "aPlusNT": null,
  "aMinus": null,
  "l1": null,
  "l2": null,
  "l3": null,
} satisfies MyCurrentDataModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MyCurrentDataModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


