require('dotenv').config({ path: '../.env' }) // load environment variables
const expect = require('expect')
const { Trello } = require('./../lib/Trello')
const { TRELLO_API_KEY, TRELLO_USER_TOKEN } = process.env

const trello = new Trello(TRELLO_API_KEY, TRELLO_USER_TOKEN)

describe('trello lib', () => {
  it('returns at least one board', async () => {
    const boards = await trello.member.searchBoards('me')
    expect(boards.length).toBeGreaterThan(0)
  })
})
