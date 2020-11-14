import express from 'express'
import cors from 'cors'
import { TelegramMessage, parseMessage } from './Telegram'
import { processMessage } from './messageHandler'
import { MessageHandlerOptions } from './types'

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
      const message: TelegramMessage = parseMessage(req.body) // can throw 'not a telegram message'
      const responsePayload = await processMessage(message, options)
      res.status(200).send(responsePayload)
    } catch (err) {
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
