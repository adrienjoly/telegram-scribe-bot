// This file is intended to run the app on a development/local environment

import { makeApp } from '../src/app'

require('dotenv').config({ path: '../.env' }) // load environment variables

const { PORT = 8000, TELEGRAM_USER_ID } = process.env

const options = {
  onlyFromUserId: TELEGRAM_USER_ID ? parseInt(TELEGRAM_USER_ID, 10) : undefined,
}

makeApp(options).listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
)
