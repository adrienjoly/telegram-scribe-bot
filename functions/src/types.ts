import { ParsedMessageEntities } from './Telegram'

// Enum<T> turns an array of strings of type T into a Enum type.
type Enum<T extends readonly string[]> = T[number]

// ServiceOptions defines the properties of MessageHandlerOptions that
// are required for a particular service, given its namespace and keys.
export type ServiceOptions<
  Namespace extends string,
  Keys extends readonly string[]
> = {
  [key in Namespace]: { [key in Enum<Keys>]: string }
}

// MessageHandlerOptions holds the configuration provided by the message
// handler to command handlers.
export type MessageHandlerOptions = {
  [namespace: string]: { [key: string]: string }
}

// CommandHandler is a function type that implements a use case attached
// to a command that can be found in a Telegram message to the bot, and
// returns a response to be given back to the sender of that message.
// Note: a CommandHandler can throw errors back to the user.
export type CommandHandler = (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
) => Promise<BotResponse>

export type BotResponse = {
  text: string
}

// cf API documentation: https://core.telegram.org/bots/api#sendmessage
export type TelegramRequest = {
  method: 'sendMessage'
  chat_id: number
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2' // cf https://core.telegram.org/bots/api#formatting-options
  text: string
}
