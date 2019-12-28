import * as TrelloNodeAPI from 'trello-node-api'
import * as TrelloLib from 'trello'

export type TrelloCard = {
  id: string
  name: string
  desc: string
}

export type TrelloBoard = {
  id: string
  name: string
}

export type TrelloChecklist = {
  id: string
  name: string
}

export class Trello {
  private trelloApi: TrelloNodeAPI
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
    this.trelloApi = new TrelloNodeAPI(apiKey, userToken)
    this.trelloLib = new TrelloLib(apiKey, userToken)
  }

  async getBoards(): Promise<TrelloBoard[]> {
    return await this.trelloApi.member.searchBoards('me')
    // TODO: return await this.trelloLib.getBoards('me')
  }

  async getCards(boardId: string): Promise<TrelloCard[]> {
    return await this.trelloApi.board.searchCards(boardId)
    // TODO: return await this.trelloLib.getCardsOnBoard(boardId)
  }

  async getChecklistIds(cardId: string): Promise<string[]> {
    return (await this.trelloApi.card.search(cardId)).idChecklists
    // TODO: return (await this.trelloLib.getCard(cardId)).idChecklists
  }

  async getChecklist(checklistId: string): Promise<TrelloChecklist> {
    return await this.trelloLib.makeRequest(
      'get',
      `/1/checklists/${checklistId}`
    )
  }

  async addComment(cardId: string, { text }: { text: string }) {
    return await this.trelloApi.card.addComment(cardId, { text })
    // TODO: this.trelloLib.makeRequest('post', `/actions/comments` card.id, { text: message.rest })
  }

  async addChecklistItem(
    checklistId: string,
    name: string,
    pos: 'top' | 'bottom'
  ): Promise<{ checklistId: string; name: string; pos: 'top' | 'bottom' }> {
    await this.trelloLib.addItemToChecklist(checklistId, name, pos)
    return { checklistId, name, pos }
  }
}

// API reference: https://developers.trello.com/reference
// lib reference: https://github.com/bhushankumarl/trello-node-api/wiki/Members-TypeScript
