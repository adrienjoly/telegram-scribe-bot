import { MessageHandlerOptions, CommandHandler, TelegramRequest } from './types'
import { TelegramMessage, parseEntities } from './Telegram'
import {
  addTaskToTicktick,
  addTodayTaskToTicktick,
} from './use-cases/addTaskToTicktick'
import { commandHandlers as trello } from './use-cases/addToTrello'
import { addSpotifyAlbumToShelfRepo } from './use-cases/addSpotifyAlbumToShelfRepo'
import { BotResponse } from './types'
import markdown from 'nano-markdown'

// map commands to "use-case" implementations
const commandHandlers: { [key: string]: CommandHandler } = {
  '/shelf': addSpotifyAlbumToShelfRepo,
  '/todo': addTaskToTicktick,
  '/today': addTodayTaskToTicktick,
  '/tags': trello.listTags,
  '/note': trello.addAsTrelloComment,
  '/next': trello.getOrAddTrelloTasks,
  '/version': async (_, options): Promise<BotResponse> => {
    return { text: `ℹ️  Version: ${options.bot.version}` }
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

  let text
  const entities = parseEntities(message)

  const command = (entities.commands[0] || {}).text
  const commandHandler = commandHandlers[command]
  if (!commandHandler) {
    text = `🤔  Please retry with a valid command: ${Object.keys(
      commandHandlers
    ).join(', ')}`
  } else {
    const res = await commandHandler(entities, options)
    text = res.text
  }

  // cf API documentation: https://core.telegram.org/bots/api#sendmessage
  return {
    method: 'sendMessage',
    chat_id: message.chat.id,
    parse_mode: 'HTML', // Note: response will not be sent if the text is not valid
    text: markdown(text), // let's compile the markdown ourselves, because Telegram's parser is strict and it fails silently
  }
}
