import Octokit from '@octokit/rest'

// load credentials from config file
const { github } = require(`${__dirname}/../../.config.json`) // eslint-disable-line @typescript-eslint/no-var-requires

const octokit = new Octokit({
  auth: github.token,
  userAgent: 'telegram-scribe-bot',
  // log: console, // uncomment this line to trace debug info
})

const { owner, repo } = { owner: 'adrienjoly', repo: 'album-shelf' }

async function getLastCommit() {
  const { data, status } = await octokit.repos
    //.listBranches()
    .listCommits({
      owner,
      repo,
    })
  if (status !== 200) {
    throw new Error(`GitHub API -> ${status}: ${data.toString()}`)
  } else {
    return data[0]
  }
}

async function main() {
  const { sha, commit } = await getLastCommit()
  console.log(`last commit: (${sha}) ${commit.message}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
