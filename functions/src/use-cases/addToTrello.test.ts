/// <reference types="mocha" />

import expect from 'expect'
import nock from 'nock'
import {
  TrelloOptions,
  addAsTrelloComment,
  addAsTrelloTask,
  getNextTrelloTasks,
} from './addToTrello'
import { ParsedMessageEntities } from '../Telegram'

const FAKE_CREDS: TrelloOptions = {
  trello: {
    apikey: 'trelloApiKey',
    boardid: 'trelloBoardId',
    usertoken: 'trelloUserToken',
  },
}

const trelloCardWithTag = (tag: string) => ({
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

const mockTrelloBoard = (boardId: string, cards: Partial<TrelloCard>[]) =>
  nock('https://api.trello.com')
    .get(`/1/boards/${boardId}/cards`)
    .query(true)
    .reply(200, cards)

const mockTrelloCard = (boardId: string, card: Partial<TrelloCard>) =>
  nock('https://api.trello.com')
    .get(`/1/boards/${boardId}/cards/${card.id}`)
    .query(true)
    .reply(200, card)

const mockTrelloChecklist = (checklist: Partial<TrelloChecklist>) =>
  nock('https://api.trello.com')
    .get(`/1/checklists/${checklist.id}`)
    .query(true)
    .reply(200, checklist)

// simulate the response of adding a comment to a card
const mockTrelloComment = () =>
  nock('https://api.trello.com')
    .post((uri) => uri.includes('/actions/comments'))
    .query(true)
    .reply(200, {})

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
      const options: TrelloOptions = {
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
      const cards = tags.map((tag) => trelloCardWithTag(tag))
      mockTrelloBoard(FAKE_CREDS.trello.boardid, cards)
      const message = createMessage({ rest: 'coucou' })
      await expect(addAsTrelloComment(message, FAKE_CREDS)).rejects.toThrow(
        `Please specify at least one hashtag: ${tags.join(', ')}`
      )
    })

    it('suggests existing tags if no card matches the tag', async () => {
      const tagName = '#anActualTag'
      mockTrelloBoard(FAKE_CREDS.trello.boardid, [trelloCardWithTag(tagName)])
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: '#aRandomTag' }],
      })
      await expect(addAsTrelloComment(message, FAKE_CREDS)).rejects.toThrow(
        `No cards match. Please pick another tag: ${tagName.toLowerCase()}`
      )
    })

    it('tolerates cards that are not associated with a tag', async () => {
      mockTrelloBoard(FAKE_CREDS.trello.boardid, [
        trelloCardWithTag('#anActualTag'),
        { id: 'cardWithoutTag', name: `Card without tag`, desc: `` },
      ])
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: '#aRandomTag' }],
      })
      await expect(addAsTrelloComment(message, FAKE_CREDS)).rejects.toThrow(
        'No cards match'
      )
    })

    it('invites to bind tags to card, if none were found', async () => {
      mockTrelloBoard(FAKE_CREDS.trello.boardid, [
        { id: 'cardWithoutTag', name: `Card without tag`, desc: `` },
      ])
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: '#aRandomTag' }],
      })
      await expect(addAsTrelloComment(message, FAKE_CREDS)).rejects.toThrow(
        'Please bind tags to your cards'
      )
    })
  })

  describe('addAsTrelloComment', () => {
    it('succeeds', async () => {
      const tagName = '#myTag'
      // run test
      mockTrelloBoard(FAKE_CREDS.trello.boardid, [trelloCardWithTag(tagName)])
      mockTrelloComment()
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: tagName }],
      })
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      // check expectations
      expect(res.text).toMatch('Sent to Trello cards')
      expect(res.text).toMatch(tagName)
    })

    it('succeeds if tag is specified without hash, in the card', async () => {
      const tagName = 'myTag'
      // run test
      mockTrelloBoard(FAKE_CREDS.trello.boardid, [trelloCardWithTag(tagName)])
      mockTrelloComment()
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: `#${tagName}` }],
      })
      const res = await addAsTrelloComment(message, FAKE_CREDS)
      // check expectations
      expect(res.text).toMatch('Sent to Trello cards')
      expect(res.text).toMatch(tagName)
    })
  })

  describe('addAsTrelloTask', () => {
    it('fails if matching card has no checklist', async () => {
      // run test
      const tagName = '#myTag'
      const card = trelloCardWithTag(tagName)
      mockTrelloBoard(FAKE_CREDS.trello.boardid, [card])
      mockTrelloCard(FAKE_CREDS.trello.boardid, { ...card, idChecklists: [] }) // simulate the absence of checklists in that trello card
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/note' }],
        tags: [{ type: 'hashtag', text: tagName }],
      })
      // check expectations
      await expect(addAsTrelloTask(message, FAKE_CREDS)).rejects.toThrow(
        'No checklists were found for these tags'
      )
    })

    it('succeeds', async () => {
      const tagName = '#myTag'
      const card = trelloCardWithTag(tagName)
      // run test
      const checklistId = 'myChecklistId'
      mockTrelloBoard(FAKE_CREDS.trello.boardid, [card])
      mockTrelloCard(FAKE_CREDS.trello.boardid, {
        ...card,
        idChecklists: [checklistId],
      })
      mockTrelloChecklist({ id: checklistId, name: 'My checklist' })
      nock('https://api.trello.com') // simulate the response of adding a task to that checklist
        .post((uri) => uri.includes(`/1/checklists/${checklistId}/checkitems`))
        .reply(200)
      const message = createMessage({
        rest: 'coucou',
        commands: [{ type: 'bot_command', text: '/next' }],
        tags: [{ type: 'hashtag', text: tagName }],
      })
      const res = await addAsTrelloTask(message, FAKE_CREDS)
      // check expectations
      expect(res.text).toMatch('Added task at the top of these Trello cards')
      expect(res.text).toMatch(tagName)
      expect(res.text).toMatch(card.name)
    })
  })

  describe('getNextTrelloTasks', () => {
    it('returns the first incomplete task of the only card of a board', async () => {
      const cardName = `🌿 Santé`
      const expectedNextStep = 'prendre rdv checkup dentiste'
      const expectedResult = `${cardName}: ${expectedNextStep}`
      const checklistItems = [
        {
          pos: 3,
          state: 'incomplete',
          name: 'faire bilan santé',
        },
        {
          pos: 1,
          state: 'complete',
          name: 'prendre rdv checkup médecin traitant',
        },
        {
          pos: 2,
          state: 'incomplete',
          name: expectedNextStep,
        },
      ]
      // run test
      const card = { ...trelloCardWithTag('someTag'), name: cardName }
      const checklist = {
        id: 'myChecklistId',
        checkItems: checklistItems as TrelloChecklistItem[],
      }
      mockTrelloBoard(FAKE_CREDS.trello.boardid, [card])
      mockTrelloCard(FAKE_CREDS.trello.boardid, {
        ...card,
        idChecklists: [checklist.id],
      })
      mockTrelloChecklist(checklist)
      const message = createMessage({
        commands: [{ type: 'bot_command', text: '/next' }],
        tags: [],
        rest: '',
      })
      const res = await getNextTrelloTasks(message, FAKE_CREDS)
      // check expectation
      expect(res.text).toEqual(expectedResult)
    })

    it('returns the first tasks of both cards of a board', async () => {
      const testCases = [
        { cardName: 'Health', itemName: 'go to dentist' },
        { cardName: 'Home', itemName: 'buy new kitch lights' },
      ]
      const expectedResult = testCases
        .map((step) => `${step.cardName}: ${step.itemName}`)
        .join('\n')
      // run test
      const cards = testCases.map((testCase, i) => ({
        ...trelloCardWithTag('someTag'),
        id: `card${i}`,
        name: testCase.cardName,
      }))
      mockTrelloBoard(FAKE_CREDS.trello.boardid, cards)
      testCases.forEach((testCase, i) => {
        mockTrelloCard(FAKE_CREDS.trello.boardid, {
          ...cards[i],
          idChecklists: [`checklist${i}`],
        })
        mockTrelloChecklist({
          id: `checklist${i}`,
          checkItems: [
            { pos: 1, state: 'incomplete', name: testCase.itemName },
          ] as TrelloChecklistItem[],
        })
      })
      const message = createMessage({
        commands: [{ type: 'bot_command', text: '/next' }],
        tags: [],
        rest: '',
      })
      const res = await getNextTrelloTasks(message, FAKE_CREDS)
      // check expectation
      expect(res.text).toEqual(expectedResult)
    })

    it(`skips cards that don't have a checklist`, async () => {
      const testCases = [
        { cardName: 'Health' },
        { cardName: 'Home', itemName: 'buy new kitch lights' },
      ]
      const expectedResult = `${testCases[1].cardName}: ${testCases[1].itemName}`
      // run test
      const cards = testCases.map((testCase, i) => ({
        ...trelloCardWithTag('someTag'),
        id: `card${i}`,
        name: testCase.cardName,
      }))
      mockTrelloBoard(FAKE_CREDS.trello.boardid, cards)
      testCases.forEach((testCase, i) => {
        mockTrelloCard(FAKE_CREDS.trello.boardid, {
          ...cards[i],
          idChecklists: testCase.itemName ? [`checklist${i}`] : [],
        })
        if (testCase.itemName) {
          mockTrelloChecklist({
            id: `checklist${i}`,
            checkItems: [
              { pos: 1, state: 'incomplete', name: testCase.itemName },
            ] as TrelloChecklistItem[],
          })
        }
      })
      const message = createMessage({
        commands: [{ type: 'bot_command', text: '/next' }],
        tags: [],
        rest: '',
      })
      const res = await getNextTrelloTasks(message, FAKE_CREDS)
      // check expectation
      expect(res.text).toEqual(expectedResult)
    })

    it(`skips cards that don't have a hashtag`, async () => {
      const testCases = [
        { cardName: 'Health', itemName: 'go to dentist', tag: 'myTag' },
        { cardName: 'Home', itemName: 'buy new kitch lights' },
      ]
      const expectedResult = `${testCases[0].cardName}: ${testCases[0].itemName}`
      // run test
      const cards = testCases.map((testCase, i) => ({
        ...(testCase.tag ? trelloCardWithTag(testCase.tag) : undefined),
        id: `card${i}`,
        name: testCase.cardName,
      }))
      mockTrelloBoard(FAKE_CREDS.trello.boardid, cards)
      testCases.forEach((testCase, i) => {
        mockTrelloCard(FAKE_CREDS.trello.boardid, {
          ...cards[i],
          idChecklists: [`checklist${i}`],
        })
        mockTrelloChecklist({
          id: `checklist${i}`,
          checkItems: [
            { pos: 1, state: 'incomplete', name: testCase.itemName },
          ] as TrelloChecklistItem[],
        })
      })
      const message = createMessage({
        commands: [{ type: 'bot_command', text: '/next' }],
        tags: [],
        rest: '',
      })
      const res = await getNextTrelloTasks(message, FAKE_CREDS)
      // check expectation
      expect(res.text).toEqual(expectedResult)
    })
  })
})
