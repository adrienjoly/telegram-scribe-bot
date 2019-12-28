import { ParsedMessageEntities } from './Telegram'

export type MessageHandlerOptions = {
  [namespace: string]: { [key: string]: string }
}

export type CommandHandler = (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
) => Promise<{ text: string }>

export type BotResponse = {
  text: string
}

export type TelegramRequest = {
  method: 'sendMessage'
  chat_id: number // eslint-disable-line @typescript-eslint/camelcase
  text: string
}
