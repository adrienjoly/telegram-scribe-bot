import * as TrelloNodeAPI from 'trello-node-api'

require('dotenv').config({ path: '../.env' }) // load environment variables

const TRELLO_API_KEY = process.env.TRELLO_API_KEY
const TRELLO_USER_TOKEN = process.env.TRELLO_USER_TOKEN

if (!TRELLO_API_KEY) {
  throw new Error('please set TRELLO_API_KEY in .env, see README for more info')
}

if (!TRELLO_USER_TOKEN) {
  throw new Error('please set TRELLO_API_KEY in .env, see README for more info')
}

export const trello = new TrelloNodeAPI(TRELLO_API_KEY, TRELLO_USER_TOKEN)
