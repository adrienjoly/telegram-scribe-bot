import Octokit from '@octokit/rest'

// load credentials from config file
const { github } = require(`${__dirname}/../../.config.json`) // eslint-disable-line @typescript-eslint/no-var-requires

const octokit = new Octokit({
  auth: github.token,
  userAgent: 'telegram-scribe-bot',
  // log: console, // uncomment this line to trace debug info
})

octokit.repos
  .listBranches({ owner: 'adrienjoly', repo: 'album-shelf' })
  .then(({ data, status }) => {
    if (status !== 200) {
      console.error({ data, status })
    } else {
      console.log({ data, status })
    }
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
