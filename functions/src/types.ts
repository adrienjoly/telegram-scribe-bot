import { ParsedMessageEntities } from './Telegram'

export type MessageHandlerOptions = {
  onlyFromUserId?: number
  trelloApiKey?: string
  trelloUserToken?: string
  trelloBoardId?: string
  ticktickEmail?: string
  ticktickPassword?: string
}

export type CommandHandler = (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
) => Promise<{ text: string }>
