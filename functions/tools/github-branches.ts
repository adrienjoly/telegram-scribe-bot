import Octokit from '@octokit/rest'

// load credentials from config file
const { github } = require(`${__dirname}/../../.config.json`) // eslint-disable-line @typescript-eslint/no-var-requires

const octokit = new Octokit({
  auth: github.token,
  userAgent: 'telegram-scribe-bot',
  // log: console, // uncomment this line to trace debug info
})

const { owner, repo } = { owner: 'adrienjoly2', repo: 'album-shelf' }

async function getLastCommit({ owner, repo }: { owner: string; repo: string }) {
  const { data } = await octokit.repos
    //.listBranches()
    .listCommits({
      owner,
      repo,
    })
  return data[0]
}

async function createBranch({ owner, repo }: { owner: string; repo: string }) {
  const { sha, commit } = await getLastCommit({ owner, repo })
  console.log(`last commit: (${sha}) ${commit.message}`)
  const { data } = await octokit.git.createRef({
    owner,
    repo,
    ref: 'refs/heads/invalid branch name XXX',
    sha,
  })
  return data
}

async function main() {
  const data = await createBranch({ owner, repo })
  console.log('=>', data)
}

main().catch(err => {
  console.error(
    `❌  ${err.message} <-- ${err.request?.url}\n   ${err.request?.body}`
  )
  process.exit(1)
})
