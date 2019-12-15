/// <reference types="mocha" />

require('dotenv').config({ path: `${__dirname}/../.env` }) // load environment variables
import * as expect from 'expect'
import { Trello } from './../lib/src/Trello'

const { TRELLO_API_KEY, TRELLO_USER_TOKEN } = process.env

const trello = new Trello(TRELLO_API_KEY, TRELLO_USER_TOKEN)

describe('trello lib', () => {
  it('returns at least one board', async () => {
    const boards = await trello.member.searchBoards('me')
    expect(boards.length).toBeGreaterThan(0)
  })
})
