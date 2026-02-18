// Load environment variables from .env file
require('dotenv').config({ path: `${__dirname}/../.env` }) // eslint-disable-line @typescript-eslint/no-var-requires

const { version } = require(`${__dirname}/../package.json`) // eslint-disable-line @typescript-eslint/no-var-requires

// Map environment variables to the config structure expected by the bot
module.exports = {
  openwhyd: {
    api_client_id: process.env.OPENWHYD_API_CLIENT_ID || '',
    api_client_secret: process.env.OPENWHYD_API_CLIENT_SECRET || '',
    username: process.env.OPENWHYD_USERNAME || '',
    password: process.env.OPENWHYD_PASSWORD || '',
    youtube_api_key: process.env.OPENWHYD_YOUTUBE_API_KEY || '',
  },
  spotify: {
    clientid: process.env.SPOTIFY_CLIENT_ID || '',
    secret: process.env.SPOTIFY_SECRET || '',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  telegram: {
    onlyfromuserid: process.env.TELEGRAM_ONLY_FROM_USER_ID || '',
  },
  ticktick: {
    email: process.env.TICKTICK_EMAIL || '',
    password: process.env.TICKTICK_PASSWORD || '',
  },
  trello: {
    apikey: process.env.TRELLO_API_KEY || '',
    usertoken: process.env.TRELLO_USER_TOKEN || '',
    boardid: process.env.TRELLO_BOARD_ID || '',
  },
  bot: { version },
}
