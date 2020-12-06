import { CommandHandler, MessageHandlerOptions, BotResponse } from './../types'
import { ParsedMessageEntities } from './../Telegram'
import { Trello } from '../services/Trello'

// string to include in Trello card(s), to bind them with some tags
const RE_TRELLO_CARD_BINDING = /telegram-scribe-bot:addCommentsFromTaggedNotes\(([^)]+)\)/

const CONFIG_NAMESPACE = 'trello'
const CONFIG_KEYS = <const>['apikey', 'usertoken', 'boardid']

type CONFIG_KEYS_ENUM = typeof CONFIG_KEYS[number]

export type TrelloOptions = {
  [CONFIG_NAMESPACE]: { [key in CONFIG_KEYS_ENUM]: string }
}

type TrelloCardWithTags = {
  card: TrelloCard
  tags: string[]
}

// Populate TrelloOptions from MessageHandlerOptions.
// Throws if any required option is missing.
const checkOptions = (options: MessageHandlerOptions): TrelloOptions => {
  for (const key of Object.values(CONFIG_KEYS)) {
    if (!options?.[CONFIG_NAMESPACE]?.[key])
      throw new Error(`missing ${CONFIG_NAMESPACE}.${key}`)
  }
  return options as TrelloOptions
}

const cleanTag = (tag: string): string =>
  tag.replace('#', '').trim().toLowerCase()

const renderTag = (tag: string): string => `#${cleanTag(tag)}`

const extractTagsFromBinding = (card: TrelloCard): string[] => {
  const tagList = (card.desc.match(RE_TRELLO_CARD_BINDING) || [])[1]
  return tagList ? tagList.split(',').map(cleanTag) : []
}

const listValidTags = (cardsWithTags: TrelloCardWithTags[]): string => {
  const allTags = cardsWithTags.reduce((allTags, { tags }) => {
    tags.forEach((tag) => allTags.add(tag))
    return allTags
  }, new Set<string>())
  return [...allTags].map(renderTag).join(', ')
}

const getCardsBoundToTags = (
  cardsWithTags: TrelloCardWithTags[],
  targetedTags: string[]
): TrelloCard[] => {
  const cleanedTags = targetedTags.map(cleanTag)
  return cardsWithTags
    .filter(({ tags }) =>
      cleanedTags.some((targetedTag) => tags.includes(targetedTag))
    )
    .map(({ card }) => card)
}

async function extractCardFromTags(
  message: ParsedMessageEntities,
  messageHandlerOptions: MessageHandlerOptions
): Promise<{
  trello: Trello
  targetedCards: TrelloCard[]
  options: TrelloOptions
}> {
  const options = checkOptions(messageHandlerOptions) // may throw
  const trello = new Trello(options.trello.apikey, options.trello.usertoken)
  const cards = await trello.getCards(options.trello.boardid)
  const cardsWithTags = cards.map((card) => ({
    card,
    tags: extractTagsFromBinding(card),
  }))
  const validTags = listValidTags(cardsWithTags)
  if (!validTags.length) {
    throw `🤔  Please bind tags to your cards. How: https://github.com/adrienjoly/telegram-scribe-bot#2-bind-tags-to-trello-cards`
  }
  const noteTags = message.tags.map((tagEntity) => tagEntity.text)
  if (!noteTags.length) {
    throw `🤔  Please specify at least one hashtag: ${validTags}`
  }
  const targetedCards = getCardsBoundToTags(cardsWithTags, noteTags)
  if (!targetedCards.length) {
    throw `🤔  No cards match. Please pick another tag: ${validTags}`
  }
  return { trello, targetedCards, options }
}

const _addAsTrelloComment = async (
  message: ParsedMessageEntities,
  trello: Trello,
  targetedCards: TrelloCard[]
): Promise<BotResponse> => {
  await Promise.all(
    targetedCards.map((card) =>
      trello.addComment(card.id, { text: message.rest })
    )
  )
  return {
    text: `✅  Sent to Trello cards: ${targetedCards
      .map((c) => c.name)
      .join(', ')}`,
  }
}

const _addAsTrelloTask = async (
  message: ParsedMessageEntities,
  trello: Trello,
  targetedCards: TrelloCard[],
  options: TrelloOptions
): Promise<BotResponse> => {
  const getUniqueCardChecklist = async (
    checklistIds: string[]
  ): Promise<TrelloChecklist | null> =>
    checklistIds.length !== 1 ? null : trello.getChecklist(checklistIds[0])
  const taskName = message.rest
  const consideredCards = await Promise.all(
    targetedCards.map(async (card) => {
      const checklistIds = await trello.getChecklistIds(
        options.trello.boardid,
        card.id
      )
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
  const populatedCards = consideredCards.filter((card) => card.checklistName)
  if (!populatedCards.length)
    throw new Error(
      '🤔  No checklists were found for these tags. Please retry without another tag.'
    )
  return {
    text: `✅  Added task at the top of these Trello cards' unique checklists: ${populatedCards
      .map((c) => c.cardName)
      .join(', ')}`,
  }
}

async function _getNextTrelloTasks(
  handlerOpts: MessageHandlerOptions
): Promise<BotResponse> {
  const options = checkOptions(handlerOpts) // may throw
  const trello = new Trello(options.trello.apikey, options.trello.usertoken)
  const cards = await trello.getCards(options.trello.boardid)
  const firstCard = cards[0] // TODO: apply for all cards
  const [checklistId] = await trello.getChecklistIds(
    options.trello.boardid,
    firstCard.id
  )
  const nextStep = await trello.getNextTodoItem(checklistId)
  return {
    text: `🌿 Santé: ${nextStep.name}`,
  }
}

export const addAsTrelloComment: CommandHandler = (message, handlerOpts) =>
  extractCardFromTags(message, handlerOpts)
    .then(({ trello, targetedCards }) =>
      _addAsTrelloComment(message, trello, targetedCards)
    )
    .catch((err) => ({ text: err }))

export const addAsTrelloTask: CommandHandler = (message, handlerOpts) =>
  extractCardFromTags(message, handlerOpts)
    .then(({ trello, targetedCards, options }) =>
      _addAsTrelloTask(message, trello, targetedCards, options)
    )
    .catch((err) => ({ text: err.message }))

export const getNextTrelloTasks: CommandHandler = (message, handlerOpts) =>
  _getNextTrelloTasks(handlerOpts).catch((err) => ({ text: err.message }))
