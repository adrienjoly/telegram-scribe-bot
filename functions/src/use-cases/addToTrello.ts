import { MessageHandlerOptions } from './../types'
import { ParsedMessageEntities } from './../Telegram'
import { Trello, TrelloCard } from './../Trello'

// string to include in Trello card(s), to bind them with some tags
const RE_TRELLO_CARD_BINDING = /telegram\-scribe\-bot\:addCommentsFromTaggedNotes\(([^\)]+)\)/

export type Options = {
  trelloApiKey: string
  trelloUserToken: string
  trelloBoardId: string
}

type TrelloCardWithTags = {
  card: TrelloCard
  tags: string[]
}

const checkOptions = (options: MessageHandlerOptions) => {
  if (!options.trelloApiKey) throw new Error('missing trelloApiKey')
  if (!options.trelloUserToken) throw new Error('missing trelloUserToken')
  if (!options.trelloBoardId) throw new Error('missing trelloBoardId')
  return options as Options
}

const listValidTags = (cardsWithTags: TrelloCardWithTags[]) => {
  const allTags = cardsWithTags.reduce((allTags, { tags }) => {
    tags.forEach(tag => allTags.add(tag))
    return allTags
  }, new Set<string>())
  return [...allTags].join(', ')
}

const getCardsBoundToTags = (
  cardsWithTags: TrelloCardWithTags[],
  targetedTags: string[]
): TrelloCard[] =>
  cardsWithTags
    .filter(({ tags }) =>
      targetedTags.some(targetedTag => tags.includes(targetedTag))
    )
    .map(({ card }) => card)

const wrap = (func: Function) => async (
  message: ParsedMessageEntities,
  messageHandlerOptions: MessageHandlerOptions
) => {
  const options = checkOptions(messageHandlerOptions) // may throw
  const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
  const cards = await trello.getCards(options.trelloBoardId)
  const cardsWithTags = cards.map(card => ({
    card,
    tags: ((card.desc.match(RE_TRELLO_CARD_BINDING) || [])[1] || '').split(','),
  }))
  const noteTags = message.tags.map(tagEntity => tagEntity.text)
  if (!noteTags.length) {
    const validTags = listValidTags(cardsWithTags)
    return { text: `🤔  Please specify at least one hashtag: ${validTags}` }
  }
  const targetedCards = getCardsBoundToTags(cardsWithTags, noteTags)
  if (!targetedCards.length) {
    const validTags = listValidTags(cardsWithTags)
    return { text: `🤔  No cards match. Please pick another tag: ${validTags}` }
  } else return await func(message, trello, targetedCards)
}

const _addAsTrelloComment = async (
  message: ParsedMessageEntities,
  trello: Trello,
  targetedCards: TrelloCard[]
) => {
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
}

const _addAsTrelloTask = async (
  message: ParsedMessageEntities,
  trello: Trello,
  targetedCards: TrelloCard[]
) => {
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
  if (!populatedCards.length)
    return {
      text:
        '🤔  No checklists were found for these tags. Please retry without another tag.',
    }
  return {
    text: `✅  Added task at the top of these Trello cards' unique checklists: ${populatedCards
      .map(c => c.cardName)
      .join(', ')}`,
  }
}

export const addAsTrelloComment = wrap(_addAsTrelloComment)
export const addAsTrelloTask = wrap(_addAsTrelloTask)
