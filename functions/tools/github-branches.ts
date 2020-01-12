import Octokit from '@octokit/rest'
import assert from 'assert'

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

async function getFileContents({
  owner,
  repo,
  path,
}: GitHubRepo & {
  path: string
}): Promise<{ sha: string; buffer: Buffer }> {
  const res = await octokit.repos.getContents({
    owner,
    repo,
    path,
  })
  const data = res.data as Octokit.ReposGetContentsResponseItem & {
    encoding: string
    content: string
  }
  assert.equal(data.encoding, 'base64')
  return {
    sha: data.sha,
    buffer: Buffer.from(data.content, 'base64'),
  }
}

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

/*
async function createCommit({
  owner,
  repo,
  message,
  tree,
  parents,
}: GitHubRepo & {
  message: string
  tree: string // The SHA of the tree object this commit points to
  parents: string[] // The SHAs of the commits that were the parents of this commit. If omitted or empty, the commit will be written as a root commit. For a single parent, an array of one SHA should be provided; for a merge commit, an array of more than one should be provided.
}) {}
*/

async function main() {
  const { owner, repo } = { owner: 'adrienjoly', repo: 'album-shelf' }

  const fileName = '_data/albums.yaml'

  console.log(`___\nFetch contents of ${fileName}...`)
  const { sha: initialFileSha, buffer } = await getFileContents({
    owner,
    repo,
    path: fileName,
  })
  console.log('getFileContents =>', { initialFileSha })

  console.log(`___\nCreate blob with changed file contents...`)
  const content = buffer.toString() + 'test'
  const { data: blob } = await octokit.git.createBlob({
    owner,
    repo,
    content,
    encoding: 'utf-8',
  })
  console.log('createBlob =>', blob.sha)

  const branchName = `scribe-bot-test`
  console.log(`___\nCreate branch: ${branchName}...`)
  const {
    ref,
    node_id,
    object: { sha: branchSha },
  } = await createBranch({ owner, repo, name: branchName })
  console.log('createBranch =>', { ref, node_id, branchSha })

  console.log(`___\nCreate commit...`)
  const { data } = await octokit.git.createCommit({
    owner,
    repo,
    message: `add test content to ${fileName}`,
    tree: branchSha,
    parents: [initialFileSha, blob.sha],
  })
  console.log('createCommit =>', data)
}

main().catch(err => {
  console.error(
    `❌  ${err.message} <-- ${err.request?.url}\n   ${err.request?.body}`
  )
  console.error(err.stack)
  process.exit(1)
})
