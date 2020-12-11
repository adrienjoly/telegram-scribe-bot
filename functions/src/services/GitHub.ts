import { Octokit } from '@octokit/core'
import { createPullRequest } from 'octokit-plugin-create-pull-request'

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
    const OctokitWithPlugin = Octokit.plugin(createPullRequest)
    this.octokit = new OctokitWithPlugin({
      auth: token,
      userAgent,
      // log: console, // uncomment this line to trace debug info
    })
  }

  async proposeFileChangePR({
    owner,
    repo,
    filePath,
    contentToAdd,
    branchName,
    prTitle,
    prBody,
  }: {
    owner: string
    repo: string
    filePath: string
    contentToAdd: string
    branchName: string
    prTitle: string
    prBody: string
  }): Promise<{ url: string; html_url: string }> {
    // Returns a normal Octokit PR response
    // See https://octokit.github.io/rest.js/#octokit-routes-pulls-create
    const res = await this.octokit.createPullRequest({
      owner,
      repo,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: 'master' /* optional: defaults to default branch */,
      changes: [
        {
          files: {
            // update file based on current content
            [filePath]: ({
              exists,
              encoding,
              content,
            }: {
              exists: boolean
              encoding: BufferEncoding
              content: string
            }) => {
              if (!exists) return null // do not create the file if it does not exist
              return (
                Buffer.from(content, encoding).toString('utf-8') + contentToAdd
              )
            },
          },
          commit: `add content to ${filePath}`,
        },
      ],
    })
    return res.data
  }
}
