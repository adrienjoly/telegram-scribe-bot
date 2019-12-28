// This file is intended to run the app in production

import functions from 'firebase-functions'
import { makeApp } from './app'

const options = functions.config().config // load credentials and options from firebase config

const app = makeApp(options)

// this is the only function it will be published in firebase
export const router = functions.https.onRequest(app)
