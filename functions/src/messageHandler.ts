import { MessageHandlerOptions, CommandHandler } from './types'
import { TelegramMessage, parseEntities } from './Telegram'
import {
  addTaskToTicktick,
  addTodayTaskToTicktick,
} from './use-cases/addTaskToTicktick'
import { addAsTrelloComment, addAsTrelloTask } from './use-cases/addToTrello'

// map commands to "use-case" implementations
const commandHandlers: { [key: string]: CommandHandler } = {
  '/todo': addTaskToTicktick,
  '/today': addTodayTaskToTicktick,
  '/note': addAsTrelloComment,
  '/next': addAsTrelloTask,
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

    const command = (entities.commands[0] || {}).text
    const commandHandler = commandHandlers[command]
    if (!commandHandler) {
      text = `🤔  Please retry with a valid command: ${Object.keys(
        commandHandlers
      ).join(', ')}`
    } else {
      text = (await commandHandler(entities, options)).text
    }
  } catch (err) {
    text = `😕  Error while processing: ${err.message}`
    console.error(`❌ `, err, err.stack)
  }

  console.log(`=> ${text}`)

  return {
    method: 'sendMessage',
    chat_id: message.chat.id,
    text,
  }
}

// reference: https://core.telegram.org/bots/api
