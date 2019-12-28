// This file is intended to run the app on a development/local environment

import { makeApp } from '../src/app'

// load credentials from config file
const options = require(`${__dirname}/../../.config.json`) // eslint-disable-line @typescript-eslint/no-var-requires

const { PORT = 8000 } = process.env

makeApp(options).listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
)
