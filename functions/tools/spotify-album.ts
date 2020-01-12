import SpotifyWebApi from 'spotify-web-api-node'
import yaml from 'js-yaml'

// Load credentials from config file
const { clientid, secret } = require(`${__dirname}/../../.config.json`).spotify // eslint-disable-line @typescript-eslint/no-var-requires

const formatAlbum = (album: SpotifyApi.AlbumObjectSimplified) => ({
  title: album.name,
  artist: /*album.artistName ||*/ album.artists
    .map(artist => artist.name)
    .join(', '),
  release_date: album.release_date,
  img: album.images[0].url,
  url: `https://open.spotify.com/album/${album.id}`,
})

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
  const { body: album } = await spotifyApi.getAlbum('62KA8cUOqlIg1gxbVqBieD')
  console.log('Albums information', formatAlbum(album))
  console.log('=> YAML:', yaml.dump([formatAlbum(album)]))

  console.warn(`✅ Done.`)
}

main().catch(err => {
  console.error(`❌ `, err)
  process.exit(1)
})
