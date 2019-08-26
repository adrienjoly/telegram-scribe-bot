import * as express from 'express'
import * as cors from 'cors'

export const app = express()

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

// default/root entry point for testing from web browsers
app.get('/', (req, res) => res.send({ ok: true }))

// our single entry point for every message
app.post('/', async (req, res) => {
  /*
    You can put the logic you want here
    the message receive will be in this
    https://core.telegram.org/bots/api#update
  */
  console.log('received body:', typeof req.body, req.body)
  const isTelegramMessage = req.body
                          && req.body.message
                          && req.body.message.chat
                          && req.body.message.chat.id
                          && req.body.message.from
                          && req.body.message.from.first_name

  if (isTelegramMessage) {
    const chat_id = req.body.message.chat.id
    const { first_name } = req.body.message.from

    return res.status(200).send({
      method: 'sendMessage',
      chat_id,
      text: `Hello ${first_name}`
    })
  }

  return res.status(400).send({ status: 'not a telegram message' })
})

export const startApp = ({ port }: { port: Number }) => new Promise((resolve, reject) => {
  try {
    const server = app.listen(port, () => resolve({
      destroy: () => server.close()
    }))
  } catch (err) {
    reject(err)
  }
})

export default app
