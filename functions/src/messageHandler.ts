import { TelegramMessage } from './types'

export function parseMessage(container: any) {
  try {
    return container.message.chat && container.message.from
      ? container.message
      : null
  } catch (err) {
    throw new Error('not a telegram message')
  }
}

type MessageHandlerOptions = {
  onlyFromUserId?: number
}

export function processMessage(
  message: TelegramMessage,
  options: MessageHandlerOptions
) {
  if (options.onlyFromUserId && message.from.id !== options.onlyFromUserId)
    throw new Error('this sender is not allowed')
  return {
    method: 'sendMessage',
    chat_id: message.chat.id,
    text: `Hello ${message.from.first_name}, ${options.onlyFromUserId}`,
  }
}

// reference: https://core.telegram.org/bots/api
