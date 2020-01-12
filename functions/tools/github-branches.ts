import Octokit from '@octokit/rest'

// Load credentials from config file
const { github } = require(`${__dirname}/../../.config.json`) // eslint-disable-line @typescript-eslint/no-var-requires
// Note: In order to write to the repo, user must be authenticated with a token
// that has the "public_repo" permission.

type GitHubRepo = { owner: string; repo: string }

const octokit = new Octokit({
  auth: github.token,
  userAgent: 'telegram-scribe-bot',
  // log: console, // uncomment this line to trace debug info
})

const { owner, repo } = { owner: 'adrienjoly', repo: 'album-shelf' }

async function getLastCommit(ghRepo: GitHubRepo) {
  return (await octokit.repos.listCommits(ghRepo)).data[0]
}

async function createBranch({
  owner,
  repo,
  name = `scribe-bot-test`,
}: GitHubRepo & {
  name?: string
}) {
  const { sha, commit } = await getLastCommit({ owner, repo })
  console.log(`last commit: (${sha}) ${commit.message}`)
  const { data } = await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${name}`,
    sha,
  })
  return data
}

async function main() {
  const {
    ref,
    node_id,
    object: { sha },
  } = await createBranch({ owner, repo })
  console.log('=>', { ref, node_id, sha })
}

main().catch(err => {
  console.error(
    `❌  ${err.message} <-- ${err.request?.url}\n   ${err.request?.body}`
  )
  console.error(err.stack)
  process.exit(1)
})
