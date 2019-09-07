// This file is intended to run the app on a development/local environment

import { makeApp } from '../src/app'

require('dotenv').config({ path: `${__dirname}/../../.env` }) // load environment variables

const { PORT = 8000, TELEGRAM_USER_ID } = process.env

const options = {
  onlyFromUserId: TELEGRAM_USER_ID ? parseInt(TELEGRAM_USER_ID, 10) : undefined,
  trelloApiKey: process.env.TRELLO_API_KEY || '',
  trelloUserToken: process.env.TRELLO_USER_TOKEN || '',
}

makeApp(options).listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
)
