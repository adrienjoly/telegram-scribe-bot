// This file is intended to run the app in production

// Load environment variables from .env file
import 'dotenv/config'
import * as functions from 'firebase-functions/v1'
import { makeMessageHandler } from './app'
import { MessageHandlerOptions } from './types'

// Build configuration from environment variables
const config: MessageHandlerOptions = {
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
  bot: {
    version: require('../package.json').version, // eslint-disable-line @typescript-eslint/no-var-requires
  },
}

const handleMessage = makeMessageHandler(config)

// this is the only function it will be published in firebase
export const router = functions.https.onRequest(handleMessage)
