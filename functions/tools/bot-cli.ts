import * as dotenv from 'dotenv'
import * as readline from 'readline'
import { TelegramMessage, MessageEntity, TelegramUser } from './../src/Telegram'
import { processMessage } from './../src/messageHandler'
import { MessageHandlerOptions } from './../src/types'

dotenv.config({ path: `${__dirname}/../../.env` }) // load environment variables

const options: MessageHandlerOptions = {
  // onlyFromUserId: TELEGRAM_USER_ID ? parseInt(TELEGRAM_USER_ID, 10) : undefined,
  trelloApiKey: process.env.TRELLO_API_KEY || '',
  trelloUserToken: process.env.TRELLO_USER_TOKEN || '',
  trelloBoardId: process.env.TRELLO_BOARD_ID || '',
}

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
  new Promise(resolve => rl.question(`${prompt}\n`, resolve))

const main = async () => {
  console.warn(
    `ℹ️  This bot client is connected to the accounts specified in .env`
  )
  for (;;) {
    const rawMessage = await getAnswer('type a message for the chatbot:')
    try {
      const message = makeTelegramMessage(rawMessage)
      const responsePayload = await processMessage(message, options)
      console.warn(`=> ${responsePayload.text}`)
    } catch (err) {
      console.warn(`❌ => ${err.message}`)
    }
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
