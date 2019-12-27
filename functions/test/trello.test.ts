/// <reference types="mocha" />

import * as expect from 'expect'
import { TelegramMessage, parseEntities } from './../src/Telegram'
import {
  addAsTrelloComment,
  addAsTrelloTask,
} from './../src/use-cases/addToTrello'
import { MessageHandlerOptions } from '../src/types'
import { ParsedMessageEntities } from '../src/Telegram'

const options = {}

const createMessage = ({ text }: { text: string }): ParsedMessageEntities =>
  parseEntities({
    chat: { id: 1 },
    from: { id: 2, first_name: 'sender_name' },
    text,
    date: Date.now(),
    location: { longitude: 3, latitude: 4 },
    entities: [],
  })

describe('trello use cases', () => {
  it('responds with error if failing to connect to trello', async () => {
    const message = createMessage({ text: 'coucou' })
    const options: MessageHandlerOptions = {}
    const promise = addAsTrelloComment(message, options)
    expect(promise).rejects.toThrow('missing trelloApiKey')
  })
})
