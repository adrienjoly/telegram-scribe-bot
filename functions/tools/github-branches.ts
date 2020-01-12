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

async function proposeFileChangePR({
  owner,
  repo,
  filePath,
  contentToAdd,
  branchName,
  prTitle,
  prBody,
  log = () => {},
}: {
  owner: string
  repo: string
  filePath: string
  contentToAdd: string
  branchName: string
  prTitle: string
  prBody: string
  log?: (s: string) => void
}): Promise<Octokit.PullsCreateResponse> {
  log(`Fetch last commit from ${owner}/${repo}...`)
  const lastCommit = await (await octokit.repos.listCommits({ owner, repo }))
    .data[0]

  log(`Fetch contents of ${filePath}...`)
  const initialFile = await getFileContents({
    owner,
    repo,
    path: filePath,
  })

  log(`Create blob with changed file contents...`)
  const { data: blob } = await octokit.git.createBlob({
    owner,
    repo,
    content: initialFile.buffer.toString() + contentToAdd,
    encoding: 'utf-8',
  })

  log(`Create tree with changed file contents...`)
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: lastCommit.commit.tree.sha,
    tree: [
      {
        type: 'blob',
        mode: '100644',
        path: filePath,
        sha: blob.sha,
      },
    ],
  })

  log(`Create commit...`)
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: `add test content to ${filePath}`,
    tree: tree.sha,
    parents: [lastCommit.sha],
  })

  log(`Create branch: ${branchName}...`)
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: newCommit.sha,
  })

  log(`Create pull request: ${prTitle}...`)
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title: prTitle,
    head: branchName,
    base: 'master',
    body: prBody,
  })
  return data
}

async function main() {
  const filePath = '_data/albums.yaml'
  const pr = await proposeFileChangePR({
    owner: 'adrienjoly',
    repo: 'album-shelf',
    filePath,
    contentToAdd: '\ntest\n',
    branchName: `scribe-bot-${Date.now()}`,
    prTitle: `add test to ${filePath}`,
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
