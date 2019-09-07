// This file is intended to run the app in production

import * as functions from 'firebase-functions'
import { makeApp } from './app'

const config = functions.config()

const options = {
  onlyFromUserId: config.telegram.userid
    ? parseInt(config.telegram.userid, 10)
    : undefined,
  trelloApiKey: config.trello.apikey,
  trelloUserToken: config.trello.usertoken,
  ticktickEmail: config.ticktick.email,
  ticktickPassword: config.ticktick.password,
}

const app = makeApp(options)

// this is the only function it will be published in firebase
export const router = functions.https.onRequest(app)
