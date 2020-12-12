import {
  ProviderOptions,
  CommandHandler,
  MessageHandlerOptions,
  BotResponse,
} from './../types'
import { ParsedMessageEntities } from './../Telegram'
import { Trello } from '../services/Trello'

// string to include in Trello card(s), to bind them with some tags
const RE_TRELLO_CARD_BINDING = /telegram-scribe-bot:addCommentsFromTaggedNotes\(([^)]+)\)/

export const CONFIG_NAMESPACE = <const>'trello'
export const CONFIG_KEYS = <const>['apikey', 'usertoken', 'boardid']

export type TrelloOptions = ProviderOptions<
  typeof CONFIG_NAMESPACE,
  typeof CONFIG_KEYS
>

type TrelloCardWithTags = {
  card: TrelloCard
  tags: string[]
}

const checkServiceOptions = <T extends MessageHandlerOptions>(
  options: MessageHandlerOptions,
  serviceConfigNamespace: string,
  serviceConfigKeys: readonly string[]
): T => {
  for (const key of Object.values(serviceConfigKeys)) {
    if (!options?.[serviceConfigNamespace]?.[key])
      throw new Error(`missing ${serviceConfigNamespace}.${key}`)
  }
  return options as T
}

// Populate TrelloOptions from MessageHandlerOptions.
// Throws if any required option is missing.
const checkOptions = (options: MessageHandlerOptions): TrelloOptions =>
  checkServiceOptions(options, CONFIG_NAMESPACE, CONFIG_KEYS)

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
  handlerOpts: MessageHandlerOptions
): Promise<{
  trello: Trello
  options: TrelloOptions
  cardsWithTags: { card: TrelloCard; tags: string[] }[]
  validTags: string
}> {
  const options = checkOptions(handlerOpts) // may throw
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
  return { trello, options, cardsWithTags, validTags }
}

async function fetchTargetedCards(
  message: ParsedMessageEntities,
  handlerOpts: MessageHandlerOptions
): Promise<{
  trello: Trello
  options: TrelloOptions
  targetedCards: TrelloCard[]
}> {
  const {
    trello,
    options,
    cardsWithTags,
    validTags,
  } = await fetchCardsWithTags(handlerOpts)
  const noteTags = message.tags.map((tagEntity) => tagEntity.text)
  if (!noteTags.length) {
    throw new Error(`🤔  Please specify at least one hashtag: ${validTags}`)
  }
  const targetedCards = getCardsBoundToTags(cardsWithTags, noteTags)
  if (!targetedCards.length) {
    throw new Error(`🤔  No cards match. Please pick another tag: ${validTags}`)
  }
  return { trello, options, targetedCards }
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
  handlerOpts: MessageHandlerOptions
): Promise<BotResponse> {
  const { trello, cardsWithTags, options } = await fetchCardsWithTags(
    handlerOpts
  ) // may throw
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

export const addAsTrelloComment: CommandHandler = (message, handlerOpts) =>
  fetchTargetedCards(message, handlerOpts)
    .then(({ trello, targetedCards }) =>
      _addAsTrelloComment(message, trello, targetedCards)
    )
    .catch((err) => ({ error: err, text: err.message }))

export const addAsTrelloTask: CommandHandler = (message, handlerOpts) =>
  fetchTargetedCards(message, handlerOpts)
    .then(({ trello, targetedCards, options }) =>
      _addAsTrelloTask(message, trello, targetedCards, options)
    )
    .catch((err) => ({ error: err, text: err.message }))

export const getNextTrelloTasks: CommandHandler = (message, handlerOpts) =>
  _getNextTrelloTasks(message, handlerOpts).catch((err) => ({
    error: err,
    text: err.message,
  }))

export const getOrAddTrelloTasks: CommandHandler = (message, handlerOpts) =>
  (message.rest === '' ? getNextTrelloTasks : addAsTrelloTask)(
    message,
    handlerOpts
  )
