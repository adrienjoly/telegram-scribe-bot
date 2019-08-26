import * as TrelloNodeAPI from 'trello-node-api'

export class Trello {
  constructor(apiKey: string, userToken: string) {
    if (!apiKey) {
      throw new Error('missing TRELLO_API_KEY, see README for more info')
    }
    if (!userToken) {
      throw new Error('missing TRELLO_USER_TOKEN, see README for more info')
    }
    return new TrelloNodeAPI(apiKey, userToken)
  }
}
