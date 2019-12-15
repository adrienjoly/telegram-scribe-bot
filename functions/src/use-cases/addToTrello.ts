import { MessageHandlerOptions } from './../types'
import { ParsedMessageEntities } from './../Telegram'
import { Trello } from './../Trello'

export const addAsTrelloComment = async (
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
}

export const addAsTrelloTask = async (
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
}
