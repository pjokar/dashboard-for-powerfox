
# ReportModel


## Properties

Name | Type
------------ | -------------
`deviceId` | string
`consumption` | [AppReportSummaryPower](AppReportSummaryPower.md)
`ownConsumption` | [AppReportSummaryPower](AppReportSummaryPower.md)
`feedIn` | [AppReportSummaryPower](AppReportSummaryPower.md)
`generation` | [AppReportSummaryPower](AppReportSummaryPower.md)
`heat` | [AppReportSummaryHeat](AppReportSummaryHeat.md)
`gas` | [AppReportSummaryGas](AppReportSummaryGas.md)
`water` | [AppReportSummaryWater](AppReportSummaryWater.md)

## Example

```typescript
import type { ReportModel } from ''

// TODO: Update the object below with actual values
const example = {
  "deviceId": null,
  "consumption": null,
  "ownConsumption": null,
  "feedIn": null,
  "generation": null,
  "heat": null,
  "gas": null,
  "water": null,
} satisfies ReportModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ReportModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


