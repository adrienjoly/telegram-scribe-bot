// This file is intended to run the app in production

import * as functions from 'firebase-functions'
import { makeApp } from './app'

const { TELEGRAM_USER_ID } = process.env

const options = {
  onlyFromUserId: TELEGRAM_USER_ID ? parseInt(TELEGRAM_USER_ID, 10) : undefined,
}

const app = makeApp(options)

// this is the only function it will be published in firebase
export const router = functions.https.onRequest(app)
