import {
  ServiceOptions,
  CommandHandler,
  MessageHandlerOptions,
  BotResponse,
} from './../types'
import { checkServiceOptions } from './../helpers'
import { ParsedMessageEntities } from './../Telegram'
import { Trello } from '../services/Trello'

export const CONFIG_NAMESPACE = <const>'trello'
export const CONFIG_KEYS = <const>['apikey', 'usertoken', 'boardid']

export type TrelloOptions = ServiceOptions<
  typeof CONFIG_NAMESPACE,
  typeof CONFIG_KEYS
>

type TrelloCardWithTags = {
  card: TrelloCard
  tags: string[]
}

// string to include in Trello card(s), to bind them with some tags
const RE_TRELLO_CARD_BINDING = /telegram-scribe-bot:addCommentsFromTaggedNotes\(([^)]+)\)/

// Populate TrelloOptions from MessageHandlerOptions.
// Throws if any required option is missing.
const checkOptions = (options: MessageHandlerOptions) =>
  checkServiceOptions(CONFIG_NAMESPACE, CONFIG_KEYS, options)

const cleanTag = (tag: string): string =>
  tag.replace('#', '').trim().toLowerCase()

const renderTag = (tag: string): string => `#${cleanTag(tag)}`

const extractTagsFromBinding = (card: TrelloCard): string[] => {
  const tagList = ((card.desc || '').match(RE_TRELLO_CARD_BINDING) || [])[1]
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

async function fetchCardsWithTags(
  options: TrelloOptions
): Promise<{
  trello: Trello
  cardsWithTags: { card: TrelloCard; tags: string[] }[]
  validTags: string
}> {
  const trello = new Trello(options.trello.apikey, options.trello.usertoken)
  const cards = await trello.getCards(options.trello.boardid)
  const cardsWithTags = cards.map((card) => ({
    card,
    tags: extractTagsFromBinding(card),
  }))
  const validTags = listValidTags(cardsWithTags)
  if (!validTags.length) {
    throw new Error(
      `🤔  Please bind tags to your cards. How: https://github.com/adrienjoly/telegram-scribe-bot#2-bind-tags-to-trello-cards`
    )
  }
  return { trello, cardsWithTags, validTags }
}

async function fetchTargetedCards(
  message: ParsedMessageEntities,
  options: TrelloOptions
): Promise<{
  trello: Trello
  targetedCards: TrelloCard[]
}> {
  const { trello, cardsWithTags, validTags } = await fetchCardsWithTags(options)
  const noteTags = message.tags.map((tagEntity) => tagEntity.text)
  if (!noteTags.length) {
    throw new Error(`🤔  Please specify at least one hashtag: ${validTags}`)
  }
  const targetedCards = getCardsBoundToTags(cardsWithTags, noteTags)
  if (!targetedCards.length) {
    throw new Error(`🤔  No cards match. Please pick another tag: ${validTags}`)
  }
  return { trello, targetedCards }
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
  message: ParsedMessageEntities,
  options: TrelloOptions
): Promise<BotResponse> {
  const { trello, cardsWithTags } = await fetchCardsWithTags(options) // may throw
  const cards = cardsWithTags.filter(({ tags }) => tags.length > 0)
  const boardId = options.trello.boardid
  const nextSteps: { cardName: string; nextStep: string }[] = []
  await Promise.all(
    cards.map(async ({ card }) => {
      const checklistIds = await trello.getChecklistIds(boardId, card.id)
      if (checklistIds.length > 0) {
        const nextStep = await trello.getNextTodoItem(checklistIds[0])
        if (nextStep && nextStep.name) {
          nextSteps.push({ cardName: card.name, nextStep: nextStep.name })
        }
      }
    })
  )
  return {
    text: nextSteps
      .map(({ cardName, nextStep }) => `${cardName}: ${nextStep}`)
      .join('\n'),
  }
}

// CommandHandlers

export const addAsTrelloComment: CommandHandler = async (
  message,
  handlerOpts
) => {
  const options = checkOptions(handlerOpts) // may throw
  const { trello, targetedCards } = await fetchTargetedCards(message, options)
  return _addAsTrelloComment(message, trello, targetedCards)
}

export const addAsTrelloTask: CommandHandler = async (message, handlerOpts) => {
  const options = checkOptions(handlerOpts) // may throw
  const { trello, targetedCards } = await fetchTargetedCards(message, options)
  return _addAsTrelloTask(message, trello, targetedCards, options)
}

export const getNextTrelloTasks: CommandHandler = async (
  message,
  handlerOpts
) => {
  const options = checkOptions(handlerOpts) // may throw
  return _getNextTrelloTasks(message, options)
}

export const getOrAddTrelloTasks: CommandHandler = (message, handlerOpts) =>
  (message.rest === '' ? getNextTrelloTasks : addAsTrelloTask)(
    message,
    handlerOpts
  )
