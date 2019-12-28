// Wrappers to Trello API (https://developers.trello.com/reference)

import TrelloLib from 'trello' // lib reference: https://www.npmjs.com/package/trello

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
  private trelloLib: {
    getBoards: Function
    getCardsOnBoard: Function
    getCard: Function
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
    this.trelloLib = new TrelloLib(apiKey, userToken)
  }

  async getBoards(): Promise<TrelloBoard[]> {
    return await this.trelloLib.getBoards('me')
  }

  async getCards(boardId: string): Promise<TrelloCard[]> {
    return await this.trelloLib.getCardsOnBoard(boardId)
  }

  async getChecklistIds(boardId: string, cardId: string): Promise<string[]> {
    const card = await this.trelloLib.getCard(boardId, cardId)
    return card.idChecklists
  }

  async getChecklist(checklistId: string): Promise<TrelloChecklist> {
    return await this.trelloLib.makeRequest(
      'get',
      `/1/checklists/${checklistId}`
    )
  }

  async addComment(cardId: string, { text }: { text: string }) {
    return await this.trelloLib.makeRequest(
      'post',
      `/1/cards/${cardId}/actions/comments`,
      { text }
    )
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
