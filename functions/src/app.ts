import * as express from 'express'
import * as cors from 'cors'
import { TelegramMessage } from './types'
import { parseMessage, processMessage } from './messageHandler'

export const app = express()

app.use(express.json()) // Firebase already does that, but it's required for tests

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

// default/root entry point for testing from web browsers
app.get('/', (req, res) => res.send({ ok: true }))

// our single entry point for every message
app.post('/', async (req, res) => {
  try {
    const message: TelegramMessage = parseMessage(req.body) // can throw 'not a telegram message'
    const responsePayload = await processMessage({ message })
    res.status(200).send(responsePayload)
  } catch (err) {
    res
      .status(err.message.match(/not allowed/) ? 403 : 400)
      .send({ status: err.message })
  }
})

export const startApp = ({ port }: { port: Number }) =>
  new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () =>
        resolve({
          destroy: () => server.close(),
        })
      )
    } catch (err) {
      reject(err)
    }
  })

export default app
