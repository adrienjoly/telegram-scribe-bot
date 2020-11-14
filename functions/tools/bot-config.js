const { version } = require(`${__dirname}/../package.json`) // eslint-disable-line @typescript-eslint/no-var-requires

module.exports = {
  ...require(`${__dirname}/../../.config.json`),
  bot: { version },
}
