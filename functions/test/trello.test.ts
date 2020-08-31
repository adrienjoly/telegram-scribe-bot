/// <reference types="mocha" />

import expect from 'expect'
import nock from 'nock'
import {
  Options,
  addAsTrelloComment,
  addAsTrelloTask,
} from './../src/use-cases/addToTrello'
import { ParsedMessageEntities } from '../src/Telegram'

const FAKE_CREDS: Options = {
  trello: {
    apikey: 'trelloApiKey',
    boardid: 'trelloBoardId',
    usertoken: 'trelloUserToken',
  },
}

const trelloCardWithTag = tag => ({
  id: 'myCardId',
  name: `Dummy card associated with ${tag}`,
  desc: `telegram-scribe-bot:addCommentsFromTaggedNotes(${tag})`,
})

const createMessage = ({ ...overrides }): ParsedMessageEntities => ({
  date: new Date(),
  commands: [],
  tags: [],
  rest: '',
  ...overrides,
})

describe('trello use cases', () => {
  before(() => {
    nock.emitter.on('no match', ({ method, path }) =>
      console.warn(`⚠ no match for ${method} ${path}`)
    )
  })

  after(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(() => {
    nock.cleanAll()
  })

  describe('(shared behaviors)', () => {
    it('fails if trello credentials are not provided', async () => {
      const message = createMessage({ rest: 'coucou' })
      const promise = addAsTrelloComment(message, {})
      expect(promise).rejects.toThrow('missing trello.apikey')
    })

    it('fails if trello credentials are empty', async () => {
      const message = createMessage({ rest: 'coucou' })
      const options: Options = {
        trello: {
          apikey: '',
          boardid: '',
          usertoken: '',
        },
      }
      const promise = addAsTrelloComment(message, options)
      expect(promise).rejects.toThrow('missing trello.apikey')
    })

    it('suggests existing tags if no tags were provided', async () => {
      const tags = ['#card1tag', '#card2tag']
      const cards = tags.map(tag => trelloCardWithTag(tag))
      const message = createMessage({ rest: 'coucou' })
      // simulate trello cards
      nock('https://api.trello.com')
        .get(uri =>
          uri.includes(`/1/boards/${FAKE_CREDS.trello.boardid}/cards`)
        )
        .reply(200, cards)
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      expect(res.text).toMatch('Please specify at least one hashtag')
      expect(res.text).toMatch(tags[0])
      expect(res.text).toMatch(tags[1])
    })

    it('suggests existing tags if no card matches the tag', async () => {
      const tagName = '#anActualTag'.toLowerCase()
      const card = trelloCardWithTag(tagName)
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: '#aRandomTag' }],
      })
      nock('https://api.trello.com')
        .get(uri => uri.includes('/cards')) // actual path: /1/boards/trelloBoardId/cards?key=trelloApiKey&token=trelloUserToken
        .reply(200, [card])
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      expect(res.text).toMatch('No cards match')
      expect(res.text).toMatch('Please pick another tag')
      expect(res.text).toMatch(tagName)
    })

    it('tolerates cards that are not associated with a tag', async () => {
      const tagName = '#anActualTag'
      const cards = [
        trelloCardWithTag(tagName),
        { id: 'cardWithoutTag', name: `Card without tag`, desc: `` },
      ]
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: '#aRandomTag' }],
      })
      nock('https://api.trello.com')
        .get(uri => uri.includes('/cards')) // actual path: /1/boards/trelloBoardId/cards?key=trelloApiKey&token=trelloUserToken
        .reply(200, cards)
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      expect(res.text).toMatch('No cards match')
    })

    it('invites to bind tags to card, if none were found', async () => {
      const cards = [
        { id: 'cardWithoutTag', name: `Card without tag`, desc: `` },
      ]
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: '#aRandomTag' }],
      })
      nock('https://api.trello.com')
        .get(uri => uri.includes('/cards')) // actual path: /1/boards/trelloBoardId/cards?key=trelloApiKey&token=trelloUserToken
        .reply(200, cards)
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      expect(res.text).toMatch('Please bind tags to your cards')
    })
  })

  describe('addAsTrelloComment', () => {
    it('succeeds', async () => {
      const tagName = '#myTag'
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: tagName }],
      })
      // simulate a trello card that is associated with the tag
      nock('https://api.trello.com')
        .get(uri => uri.includes('/cards'))
        .reply(200, [trelloCardWithTag(tagName)])
      // simulate the response of adding a comment to that card
      nock('https://api.trello.com')
        .post(uri => uri.includes('/actions/comments'))
        .reply(200, {})
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      expect(res.text).toMatch('Sent to Trello cards')
      expect(res.text).toMatch(tagName)
    })

    it('succeeds if tag is specified without hash, in the card', async () => {
      const tagName = 'myTag'
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: `#${tagName}` }],
      })
      // simulate a trello card that is associated with the tag
      nock('https://api.trello.com')
        .get(uri => uri.includes('/cards'))
        .reply(200, [trelloCardWithTag(tagName)])
      // simulate the response of adding a comment to that card
      nock('https://api.trello.com')
        .post(uri => uri.includes('/actions/comments'))
        .reply(200, {})
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      expect(res.text).toMatch('Sent to Trello cards')
      expect(res.text).toMatch(tagName)
    })
  })

  describe('addAsTrelloTask', () => {
    it('fails if matching card has no checklist', async () => {
      const tagName = '#myTag'
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: tagName }],
      })
      const card = trelloCardWithTag(tagName)
      // simulate a trello card that is associated with the tag
      nock('https://api.trello.com')
        .get(uri =>
          uri.includes(`/1/boards/${FAKE_CREDS.trello.boardid}/cards`)
        )
        .reply(200, [card])
      // simulate the absence of checklists in that trello card
      nock('https://api.trello.com')
        .get(uri =>
          uri.includes(
            `/1/boards/${FAKE_CREDS.trello.boardid}/cards/${card.id}`
          )
        )
        .reply(200, { idChecklists: [] })
      const res = await addAsTrelloTask(message, FAKE_CREDS)
      expect(res.text).toMatch('No checklists were found for these tags')
    })

    it('succeeds', async () => {
      const tagName = '#myTag'
      const checklistId = 'myChecklistId'
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/next' }],
        tags: [{ type: 'hashtag', text: tagName }],
      })
      const card = trelloCardWithTag(tagName)
      // simulate a trello card that is associated with the tag
      nock('https://api.trello.com')
        .get(uri =>
          uri.includes(`/1/boards/${FAKE_CREDS.trello.boardid}/cards`)
        )
        .reply(200, [card])
      // simulate a checklist of that trello card
      nock('https://api.trello.com')
        .get(uri =>
          uri.includes(
            `/1/boards/${FAKE_CREDS.trello.boardid}/cards/${card.id}`
          )
        )
        .reply(200, { idChecklists: [checklistId] })
      // simulate a checklist of that trello card
      nock('https://api.trello.com')
        .get(uri => uri.includes(`/1/checklists/${checklistId}`))
        .reply(200, { id: checklistId, name: 'My checklist' })
      // simulate the response of adding a task to that checklist
      nock('https://api.trello.com')
        .post(uri => uri.includes(`/1/checklists/${checklistId}/checkitems`))
        .reply(200)
      const res = await addAsTrelloTask(message, FAKE_CREDS)
      expect(res.text).toMatch('Added task at the top of these Trello cards')
      expect(res.text).toMatch(tagName)
      expect(res.text).toMatch(card.name)
    })
  })
})
