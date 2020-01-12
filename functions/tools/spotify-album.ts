import { Spotify } from '../src/Spotify'
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
  const albumId = '62KA8cUOqlIg1gxbVqBieD'
  const spotify = new Spotify({ clientid, secret })
  const album = await spotify.fetchAlbumMetadata({ albumId })
  const metadata = formatAlbum(album)
  const yamlMeta = yaml.dump([metadata])
  console.warn(`✅ Album metadata in YAML:`)
  console.log(yamlMeta)
}

main().catch(err => {
  console.error(`❌ `, err)
  process.exit(1)
})
