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
  ): Promise<object>
  makeRequest(verb: string, url: string, payload?: object): object
}

declare module 'trello' {
  export = TrelloLib
}
