import { ParsedMessageEntities } from './Telegram'

export type MessageHandlerOptions = {
  [namespace: string]: { [key: string]: string }
}

export type CommandHandler = (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
) => Promise<BotResponse>

export type BotResponse = {
  text: string
}

export type TelegramRequest = {
  method: 'sendMessage'
  chat_id: number
  text: string
}
