const expect = require('expect')
const Trello = require('trello')

require('dotenv').config({ path: '../.env' }) // load environment variables

const TRELLO_API_KEY = process.env.TRELLO_API_KEY
const TRELLO_USER_TOKEN = process.env.TRELLO_USER_TOKEN

const trello = new Trello(TRELLO_API_KEY, TRELLO_USER_TOKEN)

describe('trello lib', () => {
  it('returns at least one board', async () => {
    const boards = await trello.getBoards('me')
    expect(boards.length).toBeGreaterThan(0)
  })
})
