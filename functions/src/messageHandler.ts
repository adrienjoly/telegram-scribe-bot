import { TelegramMessage } from './types'
import { Ticktick } from './Ticktick'
// import { Trello } from './Trello'

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
  trelloApiKey?: string
  trelloUserToken?: string
  ticktickEmail?: string
  ticktickPassword?: string
}

export async function processMessage(
  message: TelegramMessage,
  options: MessageHandlerOptions
) {
  if (options.onlyFromUserId && message.from.id !== options.onlyFromUserId)
    throw new Error('this sender is not allowed')

  let text
  try {
    /*
    const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
    const boards = await trello.member.searchBoards('me')
    text = `Hello ${message.from.first_name}, ${boards[0].name}`
    */
    if (options.ticktickEmail && options.ticktickPassword) {
      const ticktick = new Ticktick(options.ticktickEmail, options.ticktickPassword)
      await ticktick.connect()
      await ticktick.addTask(message.text)
      text = '✅  Sent to Ticktick'
    } else {
      text = 'Not sent to any service.'
    }
  } catch (err) {
    text = `Error while processing: ${err.message}`
    console.error(text)
  }

  return {
    method: 'sendMessage',
    chat_id: message.chat.id,
    text,
  }
}

// reference: https://core.telegram.org/bots/api
