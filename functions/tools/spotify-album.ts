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
  const { body: auth } = await spotifyApi.clientCredentialsGrant()

  // Save the access token so that it's used in future calls
  await spotifyApi.setAccessToken(auth.access_token)

  // Get multiple albums
  const { body: album } = await spotifyApi.getAlbums(['62KA8cUOqlIg1gxbVqBieD'])
  console.log('Albums information', album)

  console.warn(`✅ Done.`)
}

main().catch(err => {
  console.error(`❌ `, err)
  process.exit(1)
})
