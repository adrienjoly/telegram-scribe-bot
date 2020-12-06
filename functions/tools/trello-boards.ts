#!./node_modules/.bin/ts-node

// To test this API, run this command from the parent directory:
// $ tools/trello-boards.ts

import { Trello } from '../src/services/Trello'

// load credentials from config file
const { trello } = require(`${__dirname}/bot-config.js`) // eslint-disable-line @typescript-eslint/no-var-requires

new Trello(trello.apikey as string, trello.usertoken as string)
  .getBoards()
  .then((boards) => {
    boards.map(({ id, name }) => console.log(`${id} \t ${name}`))
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
