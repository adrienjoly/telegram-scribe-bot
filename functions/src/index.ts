// This file is intended to run the app in production

import * as functions from 'firebase-functions'
import { makeMessageHandler } from './app'

const { config } = functions.config() // load credentials and options from firebase config

const handleMessage = makeMessageHandler(config)

// this is the only function it will be published in firebase
export const router = functions.https.onRequest(handleMessage)
