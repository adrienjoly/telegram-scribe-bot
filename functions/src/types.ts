import { ParsedMessageEntities } from './Telegram'

type Enum<T extends readonly string[]> = T[number]

export type ServiceOptions<
  Namespace extends string,
  Keys extends readonly string[]
> = {
  [key in Namespace]: { [key in Enum<Keys>]: string }
}

export type MessageHandlerOptions = {
  [namespace: string]: { [key: string]: string }
}

export type CommandHandler = (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
) => Promise<BotResponse>

export type BotResponse = {
  text: string
  error?: Error
}

export type TelegramRequest = {
  method: 'sendMessage'
  chat_id: number
  text: string
}
