require('dotenv').config({ path: `${__dirname}/../../.env` }) // load environment variables
const { Trello } = require('./../lib/src/Trello')
const { TRELLO_API_KEY, TRELLO_USER_TOKEN } = process.env

const trello = new Trello(TRELLO_API_KEY, TRELLO_USER_TOKEN)

trello.member.searchBoards('me').then(boards => {
  boards.map(({ id, name }) => console.log(`${id} \t ${name}`))
})