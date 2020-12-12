#!./node_modules/.bin/ts-node

// To test this API, run this command from the parent directory:
// $ tools/spotify-albums.ts

import { Spotify, formatAlbum } from '../src/services/Spotify'
import yaml from 'js-yaml'

// Load credentials from config file
const { clientid, secret } = require(`${__dirname}/bot-config.js`).spotify // eslint-disable-line @typescript-eslint/no-var-requires

async function main(): Promise<void> {
  const albumId = '62KA8cUOqlIg1gxbVqBieD'
  const spotify = new Spotify({ clientid, secret })
  const album = await spotify.fetchAlbumMetadata({ albumId })
  const metadata = formatAlbum(album)
  const yamlMeta = yaml.dump([metadata])
  console.warn(`✅ Album metadata in YAML:`)
  console.log(yamlMeta)
}

main().catch((err) => {
  console.error(`❌ `, err)
  process.exit(1)
})
