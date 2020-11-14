import assert from 'assert'
import { Octokit } from '@octokit/rest' // API Ref Doc: https://octokit.github.io/rest.js/
import { PullsCreateResponseData, ReposGetContentResponseData } from '@octokit/types'

const USER_AGENT = 'telegram-scribe-bot'

export class GitHub {
  octokit: Octokit

  constructor({
    token,
    userAgent = USER_AGENT,
  }: {
    token: string
    userAgent?: string
  }) {
    this.octokit = new Octokit({
      auth: token,
      userAgent,
      // log: console, // uncomment this line to trace debug info
    })
  }

  async getFileContents({
    owner,
    repo,
    path,
  }: {
    owner: string
    repo: string
    path: string
  }): Promise<{ sha: string; buffer: Buffer }> {
    const res = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
    })
    const data = res.data as ReposGetContentResponseData & {
      encoding: string
      content: string
    }
    assert.equal(data.encoding, 'base64')
    return {
      sha: data.sha,
      buffer: Buffer.from(data.content, 'base64'),
    }
  }

  // Note: otherwise, I could have used https://www.npmjs.com/package/octokit-create-pull-request
  async proposeFileChangePR({
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
  }): Promise<PullsCreateResponseData> {
    const octokit = this.octokit
    log(`Fetch last commit from ${owner}/${repo}...`)
    const lastCommit = await (await octokit.repos.listCommits({ owner, repo }))
      .data[0]
    log(`Fetch contents of ${filePath}...`)
    const initialFile = await this.getFileContents({
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
}
