import {
  ServiceOptions,
  CommandHandler,
  MessageHandlerOptions,
  BotResponse,
} from './../types'
import { checkServiceOptions } from './../helpers'
import { ParsedMessageEntities } from './../Telegram'
import { Trello as TrelloAPI } from '../services/Trello'

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

class TrelloUseCases {
  private options: TrelloOptions['trello']
  private trelloAPI: TrelloAPI

  constructor(options: MessageHandlerOptions) {
    this.options = checkOptions(options).trello
    this.trelloAPI = new TrelloAPI(this.options.apikey, this.options.usertoken)
  }

  async fetchCardsWithTags(): Promise<{
    cardsWithTags: { card: TrelloCard; tags: string[] }[]
    validTags: string
  }> {
    const cards = await this.trelloAPI.getCards(this.options.boardid)
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
    return { cardsWithTags, validTags }
  }

  async fetchTargetedCards(
    message: ParsedMessageEntities
  ): Promise<TrelloCard[]> {
    const { cardsWithTags, validTags } = await this.fetchCardsWithTags()
    const noteTags = message.tags.map((tagEntity) => tagEntity.text)
    if (!noteTags.length) {
      throw new Error(`🤔  Please specify at least one hashtag: ${validTags}`)
    }
    const targetedCards = getCardsBoundToTags(cardsWithTags, noteTags)
    if (!targetedCards.length) {
      throw new Error(
        `🤔  No cards match. Please pick another tag: ${validTags}`
      )
    }
    return targetedCards
  }

  async addAsTrelloComment(
    message: ParsedMessageEntities,
    targetedCards: TrelloCard[]
  ): Promise<BotResponse> {
    await Promise.all(
      targetedCards.map((card) =>
        this.trelloAPI.addComment(card.id, { text: message.rest })
      )
    )
    return {
      text: `✅  Sent to Trello cards: ${targetedCards
        .map((c) => c.name)
        .join(', ')}`,
    }
  }

  async addAsTrelloTask(
    message: ParsedMessageEntities,
    targetedCards: TrelloCard[]
  ): Promise<BotResponse> {
    const getUniqueCardChecklist = async (
      checklistIds: string[]
    ): Promise<TrelloChecklist | null> =>
      checklistIds.length !== 1
        ? null
        : this.trelloAPI.getChecklist(checklistIds[0])
    const taskName = message.rest
    const consideredCards = await Promise.all(
      targetedCards.map(async (card) => {
        const checklistIds = await this.trelloAPI.getChecklistIds(
          this.options.boardid,
          card.id
        )
        const checklist = await getUniqueCardChecklist(checklistIds)
        const addedItem = checklist
          ? await this.trelloAPI.addChecklistItem(checklist.id, taskName, 'top')
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

  async getNextTrelloTasks(): Promise<BotResponse> {
    const { cardsWithTags } = await this.fetchCardsWithTags() // may throw
    const cards = cardsWithTags.filter(({ tags }) => tags.length > 0)
    const boardId = this.options.boardid
    const nextSteps: { cardName: string; nextStep: string }[] = []
    await Promise.all(
      cards.map(async ({ card }) => {
        const checklistIds = await this.trelloAPI.getChecklistIds(
          boardId,
          card.id
        )
        if (checklistIds.length > 0) {
          const nextStep = await this.trelloAPI.getNextTodoItem(checklistIds[0])
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
}

// CommandHandlers

export const commandHandlers: Record<string, CommandHandler> = {
  async addAsTrelloComment(message, handlerOpts) {
    const trello = new TrelloUseCases(handlerOpts) // may throw
    const targetedCards = await trello.fetchTargetedCards(message)
    return trello.addAsTrelloComment(message, targetedCards)
  },

  async addAsTrelloTask(message, handlerOpts) {
    const trello = new TrelloUseCases(handlerOpts) // may throw
    const targetedCards = await trello.fetchTargetedCards(message)
    return trello.addAsTrelloTask(message, targetedCards)
  },

  async getNextTrelloTasks(message, handlerOpts) {
    const trello = new TrelloUseCases(handlerOpts) // may throw
    return trello.getNextTrelloTasks()
  },

  async getOrAddTrelloTasks(message, handlerOpts) {
    const trello = new TrelloUseCases(handlerOpts) // may throw
    if (message.rest === '') {
      return trello.getNextTrelloTasks()
    } else {
      const targetedCards = await trello.fetchTargetedCards(message)
      return trello.addAsTrelloTask(message, targetedCards)
    }
  },
}
