/*
declare class TrelloLib {
  constructor(apiKey: string, userToken: string)
  getBoards: Function
  addItemToChecklist: Function
  makeRequest: Function
}

declare module 'trello' {
  export default TrelloLib
}

*/

declare class TrelloLib {
  constructor(apiKey: string, userToken: string)
  //search(needle: string): T[];
  getBoards: Function
  getCardsOnBoard: Function
  getCard: Function
  addItemToChecklist: Function
  makeRequest: Function
}

//declare var trelloLibClass = TrelloLib

declare module 'trello' {
  export = TrelloLib
}
