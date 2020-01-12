import Octokit from '@octokit/rest'

// load credentials from config file
// const { github } = require(`${__dirname}/../../.config.json`) // eslint-disable-line @typescript-eslint/no-var-requires

const octokit = new Octokit({
  userAgent: 'telegram-scribe-bot',
  log: console,
})

octokit.repos
  .listBranches({ owner: 'adrienjoly', repo: 'album-shelf' })
  .then(({ data, headers, status }) => {
    console.log({ data, headers, status })
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
