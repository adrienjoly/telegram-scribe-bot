declare module 'trello'

type TrelloCard = {
  id: string
  name: string
  desc: string
  idChecklists: string[]
}

type TrelloBoard = {
  id: string
  name: string
}

type TrelloChecklist = {
  id: string
  name: string
  checkItems: TrelloChecklistItem[]
}

// cf https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-checkitemstates-get
type TrelloChecklistItem = {
  name: string
  pos: number
  state: 'incomplete' & 'complete'
}

declare class TrelloLib {
  constructor(apiKey: string, userToken: string)
  getBoards(owner: string): Promise<TrelloBoard[]>
  getCardsOnBoard(boardId: string): Promise<TrelloCard[]>
  getCard(boardId: string, cardId: string): Promise<TrelloCard>
  addItemToChecklist(
    checklistId: string,
    name: string,
    pos: 'top' | 'bottom'
  ): Promise<unknown>
  makeRequest(verb: string, url: string, payload?: unknown): unknown
}

declare module 'trello' {
  export = TrelloLib
}
