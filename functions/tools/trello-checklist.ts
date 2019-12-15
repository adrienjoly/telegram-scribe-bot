import * as dotenv from 'dotenv'
import * as readline from 'readline'
import { Trello } from './../src/Trello'

dotenv.config({ path: `${__dirname}/../../.env` }) // load environment variables

const { TRELLO_API_KEY, TRELLO_USER_TOKEN } = process.env

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const getAnswer = (prompt: string): Promise<string> =>
  new Promise(resolve => rl.question(`${prompt}\n`, resolve))

const main = async () => {
  const trello = new Trello(
    TRELLO_API_KEY as string,
    TRELLO_USER_TOKEN as string
  )
  const boards = await trello.getBoards()
  boards.map(({ id, name }) => console.log(`${id} \t ${name}`))
  const boardId = await getAnswer('enter a board id: ')
  const cards = await trello.getCards(boardId)
  cards.map(({ id, name }) => console.log(`${id} \t ${name}`))
  const cardId = await getAnswer('enter a card id: ')
  const [checklistId] = await trello.getChecklistIds(cardId)
  const checklist = await trello.getChecklist(checklistId)
  console.log('=> checklist:', checklist)
  const taskName = await getAnswer('enter the name of a task to add: ')
  if (taskName) await trello.addChecklistItem(checklistId, taskName, 'top')
}

main()
  .then(() => {
    console.log('✅  Successfully added checklist item')
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
