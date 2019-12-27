/// <reference types="mocha" />

import * as expect from 'expect'
import * as nock from 'nock'
import {
  Options,
  addAsTrelloComment,
  addAsTrelloTask,
} from './../src/use-cases/addToTrello'
import { MessageHandlerOptions } from '../src/types'
import { ParsedMessageEntities } from '../src/Telegram'

// nock.disableNetConnect() // block HTTP requests
// nock.recorder.rec() // useful to trace HTTP requests that would be sent
nock.emitter.on('no match', ({ method, path }) =>
  console.warn(`⚠ no match for ${method} ${path}`)
)

const FAKE_CREDS: Options = {
  trelloApiKey: 'trelloApiKey',
  trelloBoardId: 'trelloBoardId',
  trelloUserToken: 'trelloUserToken',
}

const createMessage = ({ ...overrides }): ParsedMessageEntities => ({
  date: new Date(),
  commands: [],
  tags: [],
  rest: '',
  ...overrides,
})

describe('trello use cases', () => {
  describe('addAsTrelloComment', () => {
    it('fails if trello credentials are not provided', async () => {
      const message = createMessage({ rest: 'coucou' })
      const options: MessageHandlerOptions = {}
      const promise = addAsTrelloComment(message, options)
      expect(promise).rejects.toThrow('missing trelloApiKey')
    })

    it('fails if trello credentials are empty', async () => {
      const message = createMessage({ rest: 'coucou' })
      const options: Options = {
        trelloApiKey: '',
        trelloBoardId: '',
        trelloUserToken: '',
      }
      const promise = addAsTrelloComment(message, options)
      expect(promise).rejects.toThrow('missing trelloApiKey')
    })

    it('fails if no hashtag was provided', async () => {
      const message = createMessage({ rest: 'coucou' })
      const promise = addAsTrelloComment(message, FAKE_CREDS)
      expect(promise).rejects.toThrow(
        'please specify at least one card as a hashtag'
      )
    })

    it('fails if no card matches the tag', async () => {
      const message = createMessage({
        text: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: '#tag' }],
      })
      nock('https://api.trello.com')
        .get(uri => uri.includes('/cards')) // actual path: /1/boards/trelloBoardId/cards?key=trelloApiKey&token=trelloUserToken
        .reply(200, [])
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      expect(res.text).toMatch('No cards match these tags')
    })
  })
})
