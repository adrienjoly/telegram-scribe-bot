import * as TrelloNodeAPI from 'trello-node-api'

// string to include in Trello card(s), to bind them with some tags
const RE_TRELLO_CARD_BINDING = /telegram\-scribe\-bot\:addCommentsFromTaggedNotes\(([^\)]+)\)/

type TrelloCard = {
  id: string
  name: string
  desc: string
}

type TrelloBoard = {
  id: string
  name: string
}

const cleanTag = (tag: string) => tag.replace(/^\#/, '')

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

  async getCardsBoundToTags(
    tags: string[],
    trelloBoardId: string
  ): Promise<TrelloCard[]> {
    const targetedTags = tags.map(cleanTag)
    const cards: TrelloCard[] = await this.board.searchCards(trelloBoardId)
    return cards.filter(card => {
      const cardTags = (card.desc.match(RE_TRELLO_CARD_BINDING) || [])[1]
      return (
        cardTags &&
        targetedTags.some(targetedTag => cardTags.includes(targetedTag))
      )
    })
  }

  async getBoards(): Promise<TrelloBoard[]> {
    return await this.member.searchBoards('me')
  }
}

// API reference: https://developers.trello.com/reference
// lib reference: https://github.com/bhushankumarl/trello-node-api/wiki/Members-TypeScript
