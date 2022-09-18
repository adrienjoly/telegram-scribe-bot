import express from 'express'
import cors from 'cors'
import { parseMessage } from './Telegram'
import { processMessage } from './messageHandler'
import { MessageHandlerOptions, TelegramRequest } from './types'

const LOGGING = process.env.NODE_ENV !== 'test'

export function makeMessageHandler(options: MessageHandlerOptions) {
  return async function (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    let message
    try {
      LOGGING && console.log('▶ Request body:', req.body)
      message = parseMessage(req.body) // can throw 'not a telegram message'
    } catch (err) {
      LOGGING && console.error('◀ Telegram Error:', err, err.stack)
      res
        .status(err.message.includes('not a telegram message') ? 400 : 500)
        .send({ status: err.message })
      return
    }
    let responsePayload: TelegramRequest
    try {
      responsePayload = await processMessage(message, options)
      LOGGING && console.log('◀ Response payload:', responsePayload)
    } catch (err) {
      LOGGING && console.error('◀ Use Case Error:', err)
      responsePayload = {
        method: 'sendMessage',
        chat_id: message.chat.id,
        text: /*markdown*/ err.message, // we want to return this kind of errors back to the user
      }
    }
    res.status(200).send(responsePayload) // cf https://core.telegram.org/bots/api#making-requests-when-getting-updates
  }
}

export function makeApp(options: MessageHandlerOptions): express.Express {
  const app = express()

  app.use(express.json()) // Firebase already does that, but it's required for tests

  // Automatically allow cross-origin requests
  app.use(cors({ origin: true }))

  // default/root entry point for testing from web browsers
  app.get('/', (req, res) =>
    res.send({ ok: true, version: options.bot.version })
  )

  // our single entry point for every message
  app.post('/', makeMessageHandler(options))

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
