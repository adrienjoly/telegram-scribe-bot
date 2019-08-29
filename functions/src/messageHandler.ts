import { TelegramMessage } from './types'
import { Trello } from './Trello'

export function parseMessage(container: any) {
  try {
    return container.message.chat && container.message.from
      ? container.message
      : null
  } catch (err) {
    throw new Error('not a telegram message')
  }
}

export type MessageHandlerOptions = {
  onlyFromUserId?: number
  trelloApiKey: string
  trelloUserToken: string
}

export async function processMessage(
  message: TelegramMessage,
  options: MessageHandlerOptions
) {
  if (options.onlyFromUserId && message.from.id !== options.onlyFromUserId)
    throw new Error('this sender is not allowed')

  const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
  const boards = await trello.member.searchBoards('me')

  return {
    method: 'sendMessage',
    chat_id: message.chat.id,
    text: `Hello ${message.from.first_name}, ${boards[0]}`,
  }
}

// reference: https://core.telegram.org/bots/api
