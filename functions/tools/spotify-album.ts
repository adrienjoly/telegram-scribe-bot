import SpotifyWebApi from 'spotify-web-api-node'

// Load credentials from config file
const { clientid, secret } = require(`${__dirname}/../../.config.json`).spotify // eslint-disable-line @typescript-eslint/no-var-requires

async function main() {
  // Create the api object with the credentials
  const spotifyApi = new SpotifyWebApi({
    clientId: clientid,
    clientSecret: secret,
  })

  // Retrieve an access token.
  const data = await spotifyApi.clientCredentialsGrant()

  // Save the access token so that it's used in future calls
  spotifyApi.setAccessToken(data.body['access_token'])

  console.warn(`✅ Done.`)
}

main().catch(err => {
  console.error(`❌ `, err)
  process.exit(1)
})
