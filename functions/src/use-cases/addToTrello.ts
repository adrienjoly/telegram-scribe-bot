import { MessageHandlerOptions } from './../types'
import { ParsedMessageEntities } from './../Telegram'
import { Trello, TrelloCard } from './../Trello'

export type Options = {
  trelloApiKey: string
  trelloUserToken: string
  trelloBoardId: string
}

const checkOptions = (options: MessageHandlerOptions) => {
  if (!options.trelloApiKey) throw new Error('missing trelloApiKey')
  if (!options.trelloUserToken) throw new Error('missing trelloUserToken')
  if (!options.trelloBoardId) throw new Error('missing trelloBoardId')
  return options as Options
}

const extractTags = (message: ParsedMessageEntities) => {
  return message.tags.map(tagEntity => tagEntity.text)
}

const wrap = (func: Function) => async (
  message: ParsedMessageEntities,
  messageHandlerOptions: MessageHandlerOptions
) => {
  const options = checkOptions(messageHandlerOptions) // may throw
  const trello = new Trello(options.trelloApiKey, options.trelloUserToken)
  const noteTags = extractTags(message)
  const cardsWithTags = await trello.getCardsWithTags(options.trelloBoardId)
  // console.warn(cardsWithTags)
  if (!noteTags.length) {
    const tagsPerCard = cardsWithTags.map(({ tags }) => tags)
    const allTags = tagsPerCard.reduce((allTags, tags: string[]) => {
      tags.forEach(tag => allTags.add(tag))
      return allTags
    }, new Set<string>())
    return {
      text: `🤔  please specify at least one card as a hashtag. Please specify at least one hashtag: ${[
        ...allTags,
      ].join(', ')}`,
    }
  }
  const targetedCards = trello.getCardsBoundToTags(noteTags, cardsWithTags)
  if (!targetedCards.length)
    return {
      text: `🤔  No cards match these tags. Please retry without another tag.`,
    }
  else return await func(message, trello, targetedCards)
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
