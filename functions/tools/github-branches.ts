import Octokit from '@octokit/rest' // API Ref Doc: https://octokit.github.io/rest.js/
import assert from 'assert'

// Load credentials from config file
const { github } = require(`${__dirname}/../../.config.json`) // eslint-disable-line @typescript-eslint/no-var-requires
// Note: In order to write to the repo, user must be authenticated with a token
// that has the "public_repo" permission.

const octokit = new Octokit({
  auth: github.token,
  userAgent: 'telegram-scribe-bot',
  // log: console, // uncomment this line to trace debug info
})

async function getFileContents({
  owner,
  repo,
  path,
}: {
  owner: string
  repo: string
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

async function main() {
  const { owner, repo } = { owner: 'adrienjoly', repo: 'album-shelf' }
  const filePath = '_data/albums.yaml'
  const contentToAdd = '\ntest\n'
  const branchName = `scribe-bot-${Date.now()}`
  const prTitle = `add test to ${filePath}`
  const prBody = 'Submitted by `telegram-scribe-bot`'

  console.log(`___\nFetch last commit from ${owner}/${repo}...`)
  const lastCommit = await (await octokit.repos.listCommits({ owner, repo }))
    .data[0]

  console.log(`___\nFetch contents of ${filePath}...`)
  const initialFile = await getFileContents({
    owner,
    repo,
    path: filePath,
  })

  console.log(`___\nCreate blob with changed file contents...`)
  const { data: blob } = await octokit.git.createBlob({
    owner,
    repo,
    content: initialFile.buffer.toString() + contentToAdd,
    encoding: 'utf-8',
  })

  console.log(`___\nCreate tree with changed file contents...`)
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: lastCommit.commit.tree.sha,
    tree: [
      {
        type: 'blob',
        mode: '100644', // to match "blob", according to http://www.levibotelho.com/development/commit-a-file-with-the-github-api/
        path: filePath,
        sha: blob.sha,
      },
    ],
  })

  console.log(`___\nCreate commit...`)
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: `add test content to ${filePath}`,
    tree: tree.sha,
    parents: [lastCommit.sha],
  })

  console.log(`___\nCreate branch: ${branchName}...`)
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: newCommit.sha,
  })

  console.log(`___\nCreate pull request: ${prTitle}...`)
  await octokit.pulls.create({
    owner,
    repo,
    title: prTitle,
    head: branchName,
    base: 'master',
    body: prBody,
  })
}

main().catch(err => {
  console.error(
    `❌  ${err.message} <-- ${err.request?.url}\n   ${err.request?.body}`
  )
  console.error(err.stack)
  process.exit(1)
})
