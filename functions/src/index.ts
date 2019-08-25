import * as functions from 'firebase-functions'
import app from './app'

// this is the only function it will be published in firebase
export const router = functions.https.onRequest(app)
