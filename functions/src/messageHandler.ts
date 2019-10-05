import { TelegramMessage, parseEntities } from './Telegram'
import { Ticktick } from './Ticktick'
// import { Trello } from './Trello'

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

  console.log('received message from Telegram:', message)

  const entities = parseEntities(message)
  console.log('entities', entities)

  let text
  try {
    /*
    const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
    const boards = await trello.member.searchBoards('me')
    text = `Hello ${message.from.first_name}, ${boards[0].name}`
    */
    /*
    if (message.entities.length) {
      
    } else
    */
    if (options.ticktickEmail && options.ticktickPassword) {
      const ticktick = new Ticktick(options.ticktickEmail, options.ticktickPassword)
      await ticktick.connect()
      const desc = `Sent from Telegram-scribe-bot, on ${new Date(message.date * 1000)}`
      // note: user's location can be requested, cf https://tutorials.botsfloor.com/request-and-handle-phone-number-and-location-with-telegram-bot-api-e90004c0c87e
      await ticktick.addTask(message.text, desc)
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
