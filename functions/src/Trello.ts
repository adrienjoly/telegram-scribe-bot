import * as TrelloNodeAPI from 'trello-node-api'
import * as TrelloLib from 'trello'

// string to include in Trello card(s), to bind them with some tags
const RE_TRELLO_CARD_BINDING = /telegram\-scribe\-bot\:addCommentsFromTaggedNotes\(([^\)]+)\)/

export type TrelloCard = {
  id: string
  name: string
  desc: string
}

type TrelloBoard = {
  id: string
  name: string
}

type TrelloChecklist = {
  id: string
  name: string
}

const cleanTag = (tag: string) => tag.replace(/^\#/, '')

export class Trello extends TrelloNodeAPI {
  private trelloLib: {
    addItemToChecklist: Function
    makeRequest: Function
  }

  constructor(apiKey: string, userToken: string) {
    if (!apiKey) {
      throw new Error('missing TRELLO_API_KEY, see README for more info')
    }
    if (!userToken) {
      throw new Error('missing TRELLO_USER_TOKEN, see README for more info')
    }
    super(apiKey, userToken)
    this.trelloLib = new TrelloLib(apiKey, userToken)
  }

  async getBoards(): Promise<TrelloBoard[]> {
    return await this.member.searchBoards('me')
  }

  async getCards(boardId: string): Promise<TrelloCard[]> {
    return await this.board.searchCards(boardId)
  }

  async getCardsBoundToTags(
    tags: string[],
    trelloBoardId: string
  ): Promise<TrelloCard[]> {
    const targetedTags = tags.map(cleanTag)
    const cards = await this.getCards(trelloBoardId)
    return cards.filter(card => {
      const cardTags = (card.desc.match(RE_TRELLO_CARD_BINDING) || [])[1]
      return (
        cardTags &&
        targetedTags.some(targetedTag => cardTags.includes(targetedTag))
      )
    })
  }

  async getChecklistIds(cardId: string): Promise<string[]> {
    return (await this.card.search(cardId)).idChecklists
  }

  async getChecklist(checklistId: string): Promise<TrelloChecklist> {
    return await this.trelloLib.makeRequest(
      'get',
      `/1/checklists/${checklistId}`
    )
  }

  async addChecklistItem(
    checklistId: string,
    name: string,
    pos: 'top' | 'bottom'
  ) {
    await this.trelloLib.addItemToChecklist(checklistId, name, pos)
    return { checklistId, name, pos }
  }
}

// API reference: https://developers.trello.com/reference
// lib reference: https://github.com/bhushankumarl/trello-node-api/wiki/Members-TypeScript
