import * as TrelloNodeAPI from 'trello-node-api'

export class Trello extends TrelloNodeAPI {
  constructor(apiKey: string, userToken: string) {
    if (!apiKey) {
      throw new Error('missing TRELLO_API_KEY, see README for more info')
    }
    if (!userToken) {
      throw new Error('missing TRELLO_USER_TOKEN, see README for more info')
    }
    super(apiKey, userToken)
  }
}

// API reference: https://developers.trello.com/reference
// lib reference: https://github.com/bhushankumarl/trello-node-api/wiki/Members-TypeScript
