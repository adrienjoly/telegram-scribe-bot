import * as dotenv from 'dotenv'
import { Trello } from './../src/Trello'

dotenv.config({ path: `${__dirname}/../../.env` }) // load environment variables

const { TRELLO_API_KEY, TRELLO_USER_TOKEN } = process.env

new Trello(TRELLO_API_KEY as string, TRELLO_USER_TOKEN as string)
  .getBoards()
  .then(boards => {
    boards.map(({ id, name }) => console.log(`${id} \t ${name}`))
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
