import { ServiceOptions, MessageHandlerOptions } from './types'

// Validates a Service's options object by checking its required properties.
// Throws if any required option is missing.
export const checkServiceOptions = <
  Namespace extends string,
  Keys extends readonly string[],
  ResultingServiceOptionsType extends ServiceOptions<Namespace, Keys>
>(
  serviceConfigNamespace: Namespace,
  serviceConfigKeys: Keys,
  options: MessageHandlerOptions
): ResultingServiceOptionsType => {
  for (const key of Object.values(serviceConfigKeys)) {
    if (!options?.[serviceConfigNamespace]?.[key])
      throw new Error(`missing ${serviceConfigNamespace}.${key}`)
  }
  return options as ResultingServiceOptionsType
}
