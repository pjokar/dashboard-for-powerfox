
# MyDeviceModel


## Properties

Name | Type
------------ | -------------
`deviceId` | string
`name` | string
`accountAssociatedSince` | number
`mainDevice` | boolean
`prosumer` | boolean
`division` | [Divisions](Divisions.md)

## Example

```typescript
import type { MyDeviceModel } from ''

// TODO: Update the object below with actual values
const example = {
  "deviceId": null,
  "name": null,
  "accountAssociatedSince": null,
  "mainDevice": null,
  "prosumer": null,
  "division": null,
} satisfies MyDeviceModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MyDeviceModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


