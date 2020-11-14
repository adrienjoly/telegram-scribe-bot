import { MessageHandlerOptions, CommandHandler, TelegramRequest } from './types'
import { TelegramMessage, parseEntities } from './Telegram'
import {
  addTaskToTicktick,
  addTodayTaskToTicktick,
} from './use-cases/addTaskToTicktick'
import { addAsTrelloComment, addAsTrelloTask } from './use-cases/addToTrello'
import { addSpotifyAlbumToShelfRepo } from './use-cases/addSpotifyAlbumToShelfRepo'
import { BotResponse } from './types'

// map commands to "use-case" implementations
const commandHandlers: { [key: string]: CommandHandler } = {
  '/shelf': addSpotifyAlbumToShelfRepo,
  '/todo': addTaskToTicktick,
  '/today': addTodayTaskToTicktick,
  '/note': addAsTrelloComment,
  '/next': addAsTrelloTask,
  '/version': async (): Promise<BotResponse> => {
    return { text: `ℹ️  Version: ${process.env.npm_package_version}` }
  },
}

export async function processMessage(
  message: TelegramMessage,
  options: MessageHandlerOptions
): Promise<TelegramRequest> {
  const onlyFromUserId = options.telegram?.onlyfromuserid
    ? parseInt(options.telegram.onlyfromuserid, 10)
    : undefined
  if (onlyFromUserId && message.from.id !== onlyFromUserId)
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
    chat_id: message.chat.id, // eslint-disable-line @typescript-eslint/camelcase
    text,
  }
}

// reference: https://core.telegram.org/bots/api
