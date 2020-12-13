import express from 'express'
import cors from 'cors'
import { parseMessage } from './Telegram'
import { processMessage } from './messageHandler'
import { MessageHandlerOptions } from './types'

const LOGGING = process.env.NODE_ENV !== 'test'

const errorCodes: { [s: string]: number } = {
  'not a telegram message': 400,
  'this sender is not allowed': 403,
}

export function makeApp(options: MessageHandlerOptions): express.Express {
  const app = express()

  app.use(express.json()) // Firebase already does that, but it's required for tests

  // Automatically allow cross-origin requests
  app.use(cors({ origin: true }))

  // default/root entry point for testing from web browsers
  app.get('/', (req, res) => res.send({ ok: true }))

  // our single entry point for every message
  app.post('/', async (req, res) => {
    try {
      LOGGING && console.log('▶ Request body:', req.body)
      const message = parseMessage(req.body) // can throw 'not a telegram message'
      const responsePayload = await processMessage(message, options)
      LOGGING && console.log('◀ Response payload:', responsePayload)
      res.status(200).send(responsePayload)
    } catch (err) {
      LOGGING && console.error('◀ Error:', err, err.stack)
      res.status(errorCodes[err.message] || 500).send({ status: err.message })
    }
  })

  return app
}

type StarterParams = {
  port: number
  options: MessageHandlerOptions
}

type Destroyable = {
  destroy: () => unknown
}

export const startApp = ({
  port,
  options,
}: StarterParams): Promise<Destroyable> =>
  new Promise((resolve, reject) => {
    try {
      const server = makeApp(options).listen(port, () =>
        resolve({
          destroy: () => server.close(),
        })
      )
    } catch (err) {
      reject(err)
    }
  })
