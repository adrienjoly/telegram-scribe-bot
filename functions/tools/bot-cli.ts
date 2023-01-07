#!./node_modules/.bin/ts-node

// To test the chatbot locally, run this command from the parent directory:
// $ tools/bot-cli.ts

import readline from 'readline'
import { TelegramMessage, MessageEntity, TelegramUser } from './../src/Telegram'
import { processMessage } from './../src/messageHandler'

// load credentials from config file
const options = require(`${__dirname}/bot-config.js`) // eslint-disable-line @typescript-eslint/no-var-requires
delete options.telegram.onlyfromuserid // disable telegram user-id restriction

// Mimic the way Telegram clients turn a full-text chat message into a TelegramMessage
const makeTelegramMessage = (rawMessage: string): TelegramMessage => {
  const user: TelegramUser = { id: 2, first_name: 'cli' }
  const entities: MessageEntity[] = []
  const command = rawMessage.match(/\/(\w+)/)
  if (command && command.index !== undefined) {
    entities.push({
      type: 'bot_command',
      offset: command.index,
      length: command[0].length,
      url: '',
      user,
    })
  }
  const tags = rawMessage.match(/#(\w+)/g) || []
  tags.forEach((tag) => {
    entities.push({
      type: 'hashtag',
      offset: rawMessage.indexOf(tag),
      length: tag.length,
      url: '',
      user,
    })
  })
  return {
    chat: { id: 1 },
    text: rawMessage,
    date: Date.now() / 1000,
    entities,
    from: user,
    location: { latitude: -1, longitude: -1 },
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const getAnswer = (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(`${prompt}\n`, resolve))

const main = async (): Promise<void> => {
  console.warn(
    `ℹ️  This bot client is connected to the accounts specified in .config.json`
  )
  for (;;) {
    const rawMessage = await getAnswer('\nSend a message to the chatbot:')
    try {
      const message = makeTelegramMessage(rawMessage)
      const responsePayload = await processMessage(message, options)
      console.warn(`=> Response: ${responsePayload.text}`)
      // TODO: also write a CLI that reacts exactly like a Telegram client => let app.ts do the error handling
    } catch (error) {
      const err = error as Error
      console.warn('=> ❌ Error:', err.stack) // the stack includes the error message
    }
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
