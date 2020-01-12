import Octokit from '@octokit/rest' // API Ref Doc: https://octokit.github.io/rest.js/
import { GitHub } from '../src/GitHub'

// Load credentials from config file
const { TOKEN } = require(`${__dirname}/../../.config.json`).github // eslint-disable-line @typescript-eslint/no-var-requires
// Note: In order to write to the repo, user must be authenticated with a token
// that has the "public_repo" permission.

const USER_AGENT = 'telegram-scribe-bot'

const PULL_REQUEST_DATA = {
  owner: 'adrienjoly',
  repo: 'album-shelf',
  filePath: '_data/albums.yaml',
  contentToAdd: '\ntest\n',
}

async function main() {
  const octokit = new Octokit({
    auth: TOKEN,
    userAgent: USER_AGENT,
    // log: console, // uncomment this line to trace debug info
  })
  const github = new GitHub(octokit)
  const pr = await github.proposeFileChangePR({
    ...PULL_REQUEST_DATA,
    branchName: `scribe-bot-${Date.now()}`,
    prTitle: `add test to ${PULL_REQUEST_DATA.filePath}`,
    prBody: 'Submitted by `telegram-scribe-bot`',
    log: console.warn,
  })
  console.warn(`✅ GitHub PR URL: ${pr.url}`)
}

main().catch(err => {
  console.error(
    `❌  ${err.message} <-- ${err.request?.url}\n   ${err.request?.body}`
  )
  console.error(err.stack)
  process.exit(1)
})
