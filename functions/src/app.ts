import util from 'node:util'
import express from 'express'
import cors from 'cors'
import { TelegramMessage } from './Telegram'
import { processMessage } from './messageHandler'
import { MessageHandlerOptions, TelegramRequest } from './types'

const LOGGING = process.env.NODE_ENV !== 'test'

export function makeMessageHandler(options: MessageHandlerOptions) {
  return async function (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    let message: TelegramMessage | undefined
    let responsePayload: TelegramRequest
    try {
      LOGGING &&
        console.log(
          '▶ Request body:',
          util.inspect(req.body, false, null, false)
        )
      message =
        'message' in req.body ? req.body.message : req.body.edited_message
      if (!message?.from) throw new Error('missing property: message.from')
      if (!message?.text) throw new Error('missing property: message.text')
      responsePayload = await processMessage(message, options)
    } catch (error) {
      const err = error as Error
      LOGGING && console.error('◀ Error:', err, err.stack)
      responsePayload = {
        method: 'sendMessage',
        chat_id: message?.chat?.id ?? -1,
        text: /*markdown*/ err.message, // note: this error message may be technical
      }
    }
    LOGGING && console.log('◀ Response payload:', responsePayload)
    res.status(200).send(responsePayload) // cf https://core.telegram.org/bots/api#making-requests-when-getting-updates
  }
}

export function makeApp(options: MessageHandlerOptions): express.Express {
  const app = express()

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  app.use(express.json()) // Firebase already does that, but it's required for tests

  // Automatically allow cross-origin requests
  app.use(cors({ origin: true }))

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
