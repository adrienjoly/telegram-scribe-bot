// To setup the chatbot on Firebase Functions, run this command from the parent directory:
// $ node tools/bot-config-for-firebase.js

const { execSync } = require('child_process') // eslint-disable-line @typescript-eslint/no-var-requires
const botConfig = require(`${__dirname}/bot-config.js`) // eslint-disable-line @typescript-eslint/no-var-requires

const flattened = Object.entries(botConfig)
  .map(([key, value]) =>
    Object.entries(value)
      .map(([k, v]) => `${key}.${k}=${v}`)
      .join(' ')
  )
  .join(' ')

execSync(`npx firebase functions:config:set ${flattened}`, {
  stdio: 'inherit',
})
