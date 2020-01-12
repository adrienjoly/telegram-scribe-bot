import Octokit from '@octokit/rest'
import assert from 'assert'

// Load credentials from config file
const { github } = require(`${__dirname}/../../.config.json`) // eslint-disable-line @typescript-eslint/no-var-requires
// Note: In order to write to the repo, user must be authenticated with a token
// that has the "public_repo" permission.

// type GitHubRepo = { owner: string; repo: string }

const octokit = new Octokit({
  auth: github.token,
  userAgent: 'telegram-scribe-bot',
  // log: console, // uncomment this line to trace debug info
})

const { owner, repo } = { owner: 'adrienjoly', repo: 'album-shelf' }
/*

async function getLastCommit(ghRepo: GitHubRepo) {
  return (await octokit.repos.listCommits(ghRepo)).data[0]
}

async function createBranch({
  owner,
  repo,
  name,
}: GitHubRepo & {
  name: string
}) {
  const { sha } = await getLastCommit({ owner, repo })
  return (
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${name}`,
      sha,
    })
  ).data
}

async function createCommit({
  owner,
  repo,
  name,
  message,
  tree,
  parents
}: GitHubRepo & {
  name?: string
  message:string
  tree:
  parents:
}) { 
  octokit.git.createCommit({
    owner,
    repo,
    message,
    tree,
    parents
  })
}
*/

async function main() {
  /*
  const {
    ref,
    node_id,
    object: { sha },
  } = await createBranch({ owner, repo, name: `scribe-bot-test` })
  console.log('=>', { ref, node_id, sha })
  */

  type ExtendedContent = Octokit.ReposGetContentsResponseItem & {
    encoding: string
    content: string
  }
  const res = await octokit.repos.getContents({
    owner,
    repo,
    path: '_data/albums.yaml',
  })
  const data = res.data as ExtendedContent
  assert.equal(data.encoding, 'base64')
  const fileContent = Buffer.from(data.content, 'base64').toString()
  console.log('=> data:', fileContent)
  console.log('=>', { sha: data.sha })
}

main().catch(err => {
  console.error(
    `❌  ${err.message} <-- ${err.request?.url}\n   ${err.request?.body}`
  )
  console.error(err.stack)
  process.exit(1)
})
