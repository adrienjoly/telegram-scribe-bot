// To setup the chatbot on Firebase Functions, run this command from the parent directory:
// $ node tools/bot-config-for-firebase.js

const { execSync } = require('child_process') // eslint-disable-line @typescript-eslint/no-var-requires
const botConfig = require(`${__dirname}/bot-config.js`) // eslint-disable-line @typescript-eslint/no-var-requires
const json = JSON.stringify(botConfig, null, 2)
execSync(`npx firebase functions:config:set config='${json}'`, {
  stdio: 'inherit',
})
