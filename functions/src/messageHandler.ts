import {
  TelegramMessage,
  parseEntities,
  ParsedMessageEntities,
} from './Telegram'
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

type CommandHandler = (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
) => Promise<{ text: string }>

const commandHandlers: { [key: string]: CommandHandler } = {
  '/todo': async (
    message: ParsedMessageEntities,
    options: MessageHandlerOptions
  ) => {
    if (!options.ticktickEmail) throw new Error('missing ticktickEmail')
    if (!options.ticktickPassword) throw new Error('missing ticktickPassword')
    const ticktick = new Ticktick(
      options.ticktickEmail,
      options.ticktickPassword
    )
    await ticktick.connect()
    const desc = `Sent from Telegram-scribe-bot, on ${new Date(
      message.initial.date * 1000
    )}`
    // note: user's location can be requested, cf https://tutorials.botsfloor.com/request-and-handle-phone-number-and-location-with-telegram-bot-api-e90004c0c87e
    await ticktick.addTask(message.rest, desc)
    return { text: "✅  Sent to Ticktick's inbox" }
  },
  '/today': async (
    message: ParsedMessageEntities,
    options: MessageHandlerOptions
  ) => {
    if (!options.ticktickEmail) throw new Error('missing ticktickEmail')
    if (!options.ticktickPassword) throw new Error('missing ticktickPassword')
    const ticktick = new Ticktick(
      options.ticktickEmail,
      options.ticktickPassword
    )
    await ticktick.connect()
    const desc = `Sent from Telegram-scribe-bot, on ${new Date(
      message.initial.date * 1000
    )}`
    await ticktick.addTask(message.rest, desc, new Date(), true)
    return { text: '✅  Sent to Ticktick\'s "Today" tasks' }
  },
  '/note': async (
    message: ParsedMessageEntities,
    options: MessageHandlerOptions
  ) => {
    if (!options.trelloApiKey) throw new Error('missing trelloApiKey')
    if (!options.trelloUserToken) throw new Error('missing trelloUserToken')
    if (!options.trelloBoardId) throw new Error('missing trelloBoardId')
    if (!message.tags.length)
      throw new Error('please specify at least one card as a hashtag')
    const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
    const noteTags = message.tags.map(tagEntity => tagEntity.text)
    const targetedCards = await trello.getCardsBoundToTags(
      noteTags,
      options.trelloBoardId
    )
    if (!targetedCards)
      return {
        text: `🤔  No cards match these tags. Please retry without another tag.`,
      }
    await Promise.all(
      targetedCards.map(card =>
        trello.card.addComment(card.id, { text: message.rest })
      )
    )
    return {
      text: `✅  Sent to Trello cards: ${targetedCards
        .map(c => c.name)
        .join(', ')}`,
    }
  },
  '/next': async (
    message: ParsedMessageEntities,
    options: MessageHandlerOptions
  ) => {
    if (!options.trelloApiKey) throw new Error('missing trelloApiKey')
    if (!options.trelloUserToken) throw new Error('missing trelloUserToken')
    if (!options.trelloBoardId) throw new Error('missing trelloBoardId')
    if (!message.tags.length)
      throw new Error('please specify at least one card as a hashtag')
    const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
    const noteTags = message.tags.map(tagEntity => tagEntity.text)
    const targetedCards = await trello.getCardsBoundToTags(
      noteTags,
      options.trelloBoardId
    )
    if (!targetedCards)
      return {
        text: `🤔  No cards match these tags. Please retry without another tag.`,
      }
    const getUniqueCardChecklist = async (checklistIds: string[]) =>
      checklistIds.length !== 1 ? null : trello.getChecklist(checklistIds[0])
    const taskName = message.rest
    const consideredCards = await Promise.all(
      targetedCards.map(async card => {
        const checklistIds = await trello.getChecklistIds(card.id)
        const checklist = await getUniqueCardChecklist(checklistIds)
        const addedItem = checklist
          ? await trello.addChecklistItem(checklist.id, taskName, 'top')
          : null
        return {
          cardName: card.name,
          checklistName: checklist?.name,
          addedTaskName: addedItem?.name,
        }
      })
    )
    const populatedCards = consideredCards.filter(card => card.checklistName)
    return {
      text: `✅  Added task at the top of these Trello cards' unique checklists: ${populatedCards
        .map(c => c.cardName)
        .join(', ')}`,
    }
  },
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
