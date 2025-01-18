// To setup the chatbot on Firebase Functions, run this command from the parent directory:
// $ node tools/bot-config-for-firebase.js

const { execSync } = require('child_process') // eslint-disable-line @typescript-eslint/no-var-requires
const botConfig = require(`${__dirname}/bot-config.js`) // eslint-disable-line @typescript-eslint/no-var-requires

/**
 * Escape single quotes and wrap in single quotes,
 * to prevent special characters from being interpreted by the shell.
 */
function escapeShellValue(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`
}

const flattened = Object.entries(botConfig)
  .map(([key, value]) =>
    Object.entries(value)
      .map(([k, v]) => `config.${key}.${k}=${escapeShellValue(v)}`)
      .join(' ')
  )
  .join(' ')

execSync(`npx firebase-tools functions:config:set ${flattened}`, {
  stdio: 'inherit',
})
