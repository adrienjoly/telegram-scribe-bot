#!./node_modules/.bin/ts-node

// To test this API, run this command from the parent directory:
// $ tools/github-pr.ts

import { GitHub } from '../src/services/GitHub'

// Load credentials from config file
const { token } = require(`${__dirname}/bot-config.js`).github // eslint-disable-line @typescript-eslint/no-var-requires
// Note: In order to write to the repo, user must be authenticated with a token
// that has the "public_repo" permission.

const PULL_REQUEST_DATA = {
  owner: 'adrienjoly',
  repo: 'album-shelf',
  filePath: '_data/albums.yaml',
  contentToAdd: '\ntest\n',
}

async function main(): Promise<void> {
  const github = new GitHub({ token })
  const pr = await github.proposeFileChangePR({
    ...PULL_REQUEST_DATA,
    branchName: `scribe-bot-${Date.now()}`,
    prTitle: `add test to ${PULL_REQUEST_DATA.filePath}`,
    prBody: 'Submitted by `telegram-scribe-bot`',
  })
  console.warn(`✅ GitHub PR URL: ${pr.html_url}`)
}

main().catch((err) => {
  console.error(
    `❌  ${err.message} <-- ${err.request?.url}\n   ${err.request?.body}`
  )
  console.error(err.stack)
  process.exit(1)
})
