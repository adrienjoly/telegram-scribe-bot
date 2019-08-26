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

export function processMessage({ message }: { message: TelegramMessage }) {
  const { TELEGRAM_USER_ID } = process.env
  if (TELEGRAM_USER_ID && message.from.id !== parseInt(TELEGRAM_USER_ID, 10))
    throw new Error('this sender is not allowed')
  return {
    method: 'sendMessage',
    chat_id: message.chat.id,
    text: `Hello ${message.from.first_name}`,
  }
}

// reference: https://core.telegram.org/bots/api
