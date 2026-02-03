
# OperatingReportModel


## Properties

Name | Type
------------ | -------------
`deviceId` | string
`values` | [Array&lt;OperatingReportValueModel&gt;](OperatingReportValueModel.md)
`valuesPlus` | [Array&lt;OperatingReportValueModel&gt;](OperatingReportValueModel.md)
`valuesMinus` | [Array&lt;OperatingReportValueModel&gt;](OperatingReportValueModel.md)
`max` | number
`min` | number
`avg` | number

## Example

```typescript
import type { OperatingReportModel } from ''

// TODO: Update the object below with actual values
const example = {
  "deviceId": null,
  "values": null,
  "valuesPlus": null,
  "valuesMinus": null,
  "max": null,
  "min": null,
  "avg": null,
} satisfies OperatingReportModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OperatingReportModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


