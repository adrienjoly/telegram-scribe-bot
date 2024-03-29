// Wrappers to Trello API (https://developers.trello.com/reference)

import TrelloLib from 'trello' // lib reference: https://www.npmjs.com/package/trello

export class Trello {
  private trelloLib: TrelloLib

  constructor(apiKey: string, userToken: string) {
    this.trelloLib = new TrelloLib(apiKey, userToken)
  }

  async getBoards(owner = 'me'): Promise<TrelloBoard[]> {
    return await this.trelloLib.getBoards(owner)
  }

  async getCards(boardId: string): Promise<TrelloCard[]> {
    return await this.trelloLib.getCardsOnBoard(boardId)
  }

  async getChecklistIds(boardId: string, cardId: string): Promise<string[]> {
    const card = await this.trelloLib.getCard(boardId, cardId)
    return card.idChecklists
  }

  async getChecklist(checklistId: string): Promise<TrelloChecklist> {
    return (await this.trelloLib.makeRequest(
      'get',
      `/1/checklists/${checklistId}`
    )) as TrelloChecklist
  }

  async getNextTodoItem(checklistId: string): Promise<TrelloChecklistItem> {
    const { checkItems } = await this.getChecklist(checklistId)
    return checkItems
      .filter((a: TrelloChecklistItem) => a.state === 'incomplete')
      .sort(
        (a: TrelloChecklistItem, b: TrelloChecklistItem) => a.pos - b.pos
      )[0]
  }

  async addComment(
    cardId: string,
    { text }: { text: string }
  ): Promise<unknown> {
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
