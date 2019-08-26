const expect = require('expect')
const { trello } = require('./../lib/trello')

describe('trello lib', () => {
  it('returns at least one board', async () => {
    const boards = await trello.member.searchBoards('me')
    expect(boards.length).toBeGreaterThan(0)
  })
})
