// This file is intended to run the app in production

import * as functions from 'firebase-functions'
import { makeApp } from './app'

const { config } = functions.config() // load credentials and options from firebase config

const app = makeApp(config)

// this is the only function it will be published in firebase
export const router = functions.https.onRequest(app)
