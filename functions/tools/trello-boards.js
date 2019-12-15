require('dotenv').config({ path: `${__dirname}/../../.env` }) // load environment variables
const { Trello } = require('./../lib/src/Trello')
const { TRELLO_API_KEY, TRELLO_USER_TOKEN } = process.env

new Trello(TRELLO_API_KEY, TRELLO_USER_TOKEN)
  .getBoards()
  .then(boards => {
    boards.map(({ id, name }) => console.log(`${id} \t ${name}`))
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
