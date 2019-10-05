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

const commandHandlers: { [key: string]: Function } = {
  '/todo': async (message: TelegramMessage, options: MessageHandlerOptions) => {
    if (!options.ticktickEmail) throw new Error('missing ticktickEmail')
    if (!options.ticktickPassword) throw new Error('missing ticktickPassword')
    const ticktick = new Ticktick(options.ticktickEmail, options.ticktickPassword)
    await ticktick.connect()
    const desc = `Sent from Telegram-scribe-bot, on ${new Date(message.date * 1000)}`
    // note: user's location can be requested, cf https://tutorials.botsfloor.com/request-and-handle-phone-number-and-location-with-telegram-bot-api-e90004c0c87e
    await ticktick.addTask(message.text, desc)
    return { text: '✅  Sent to Ticktick' }
  },
  /*
  '/note': async (message: TelegramMessage, options: MessageHandlerOptions) => {
    if (!options.trelloApiKey) throw new Error('missing trelloApiKey')
    if (!options.trelloUserToken) throw new Error('missing trelloUserToken')
    const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
    const boards = await trello.member.searchBoards('me')
    return { text: `Hello ${message.from.first_name}, ${boards[0].name}` }
  }
  */
}

export async function processMessage(
  message: TelegramMessage,
  options: MessageHandlerOptions
) {
  if (options.onlyFromUserId && message.from.id !== options.onlyFromUserId)
    throw new Error('this sender is not allowed')

  console.log('received message from Telegram:', message)

  let text
  try {
    const entities = parseEntities(message)
    console.log('entities:', entities)

    const command = entities.commands[0].text
    const commandHandler = commandHandlers[command]
    if (!commandHandler) {
      text = 'Please retry with a valid command: ' + Object.keys(commandHandlers).join(', ')
    } else {
      text = (await commandHandler(message, options)).text
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
