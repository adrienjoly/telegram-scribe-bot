import { TelegramMessage, parseEntities, ParsedMessageEntities } from './Telegram'
import { Ticktick } from './Ticktick'
import { Trello } from './Trello'

export type MessageHandlerOptions = {
  onlyFromUserId?: number
  trelloApiKey?: string
  trelloUserToken?: string
  trelloBoardId?: string
  ticktickEmail?: string
  ticktickPassword?: string
}

const cleanTag = (tag: string) => tag.replace(/^\#/, '')

type CommandHandler = (message: ParsedMessageEntities, options: MessageHandlerOptions) => Promise<{ text: string }>

const commandHandlers: { [key: string]: CommandHandler } = {
  '/todo': async (message: ParsedMessageEntities, options: MessageHandlerOptions) => {
    if (!options.ticktickEmail) throw new Error('missing ticktickEmail')
    if (!options.ticktickPassword) throw new Error('missing ticktickPassword')
    const ticktick = new Ticktick(options.ticktickEmail, options.ticktickPassword)
    await ticktick.connect()
    const desc = `Sent from Telegram-scribe-bot, on ${new Date(message.initial.date * 1000)}`
    // note: user's location can be requested, cf https://tutorials.botsfloor.com/request-and-handle-phone-number-and-location-with-telegram-bot-api-e90004c0c87e
    await ticktick.addTask(message.rest, desc)
    return { text: '✅  Sent to Ticktick\'s inbox' }
  },
  '/today': async (message: ParsedMessageEntities, options: MessageHandlerOptions) => {
    if (!options.ticktickEmail) throw new Error('missing ticktickEmail')
    if (!options.ticktickPassword) throw new Error('missing ticktickPassword')
    const ticktick = new Ticktick(options.ticktickEmail, options.ticktickPassword)
    await ticktick.connect()
    const desc = `Sent from Telegram-scribe-bot, on ${new Date(message.initial.date * 1000)}`
    await ticktick.addTask(message.rest, desc, new Date(), true)
    return { text: '✅  Sent to Ticktick\'s "Today" tasks' }
  },
  '/note': async (message: ParsedMessageEntities, options: MessageHandlerOptions) => {
    if (!options.trelloApiKey) throw new Error('missing trelloApiKey')
    if (!options.trelloUserToken) throw new Error('missing trelloUserToken')
    if (!options.trelloBoardId) throw new Error('missing trelloBoardId')
    if (!message.tags.length) throw new Error('please specify at least one card as a hashtag')
    const noteTags = message.tags.map(tagEntity => cleanTag(tagEntity.text))
    const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
    // const boards = await trello.member.searchBoards('me')
    type TrelloCard = { name: string, desc: string }
    const cards: TrelloCard[] = await trello.board.searchCards(options.trelloBoardId)

    const RE_TRELLO_CARD_BINDING = /telegram\-scribe\-bot\:addCommentsFromTaggedNotes\(([^\)]+)\)/
    const targetedCards = cards.filter((card: TrelloCard) => {
      const cardTags = (card.desc.match(RE_TRELLO_CARD_BINDING) || [])[1]
      const matches = cardTags && noteTags.find(noteTag => cardTags.includes(noteTag))
      return matches
    })
    return { text: `Hello ${message.initial.from.first_name}, ${targetedCards.map(c => c.name).join(', ')}` }
  }
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
      text = `🤔  Please retry with a valid command: ${Object.keys(commandHandlers).join(', ')}`
    } else {
      text = (await commandHandler(entities, options)).text
    }
  } catch (err) {
    text = `😕  Error while processing: ${err.message}`
    console.error(text)
  }

  return {
    method: 'sendMessage',
    chat_id: message.chat.id,
    text,
  }
}

// reference: https://core.telegram.org/bots/api
