import { ParsedMessageEntities } from './Telegram'

export type Enum<T extends readonly string[]> = T[number]

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
