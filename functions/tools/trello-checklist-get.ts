#!./node_modules/.bin/ts-node

// To test this Trello API, run this command from the parent directory:
// $ tools/trello-checklist-get.ts # to get the list of boards
// $ tools/trello-checklist-get.ts <board_id>

import { Trello } from '../src/services/Trello'

// load credentials from config file
const config = require(`${__dirname}/bot-config.js`) // eslint-disable-line @typescript-eslint/no-var-requires

const USAGE = `tools/trello-checklist-get.ts <board_id>`

const boardId = process.argv[2]

const main = async (): Promise<string> => {
  const trello = new Trello(
    config.trello.apikey as string,
    config.trello.usertoken as string
  )
  if (!boardId) {
    console.error(`❌ missing board_id`)
    console.error(`ℹ️ USAGE: ${USAGE}`)
    const boards = await trello.getBoards()
    boards.map(({ id, name }) => console.log(`${id} \t ${name}`))
    throw `Please run the command again with the board_id of your choice`
  }
  const cards = await trello.getCards(boardId)
  for (const card of cards) {
    const [checklistId] = await trello.getChecklistIds(boardId, card.id)
    if (!checklistId) continue
    const checklist = await trello.getChecklist(checklistId)
    console.log(checklist) // temporary: display the full API response, to find useful properties
    return `first checklist for card ${card.name}: ${checklist.name}`
  }
  throw `no cards with checklists were found of board ${boardId}`
}

main()
  .then((res) => {
    console.log(`✅ ${res}`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌', err)
    process.exit(1)
  })
