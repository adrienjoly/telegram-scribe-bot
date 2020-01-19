import { MessageHandlerOptions, BotResponse } from './../types'
import { ParsedMessageEntities } from './../Telegram'
import { Spotify, SpotifyCreds, formatAlbum } from './../Spotify'
import { GitHub } from './../GitHub'
import yaml from 'js-yaml'

const PR_TARGET = {
  owner: 'adrienjoly',
  repo: 'album-shelf',
  filePath: '_data/albums.yaml',
}

export type Options = {
  spotify: {
    clientid: string
    secret: string
  }
  github: {
    token: string
  }
}

export const parseAlbumId = (str: string): string | undefined =>
  (
    str.match(/https:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9_-]+)/) || []
  ).pop()

export const addSpotifyAlbumToShelfRepo = async (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
): Promise<BotResponse> => {
  if (!options.github?.token) throw new Error('missing github.token')
  if (!options.spotify?.clientid) throw new Error('missing spotify.clientid')
  if (!options.spotify?.secret) throw new Error('missing spotify.secret')

  const albumId = parseAlbumId(message.rest)
  if (!albumId) throw new Error('failed to find albumId in this URL')

  const spotify = new Spotify(options.spotify as SpotifyCreds)
  const album = await spotify.fetchAlbumMetadata({ albumId })
  const metadata = formatAlbum(album)
  const yamlMeta = yaml.dump([metadata])

  const github = new GitHub({ token: options.github.token })
  const pr = await github.proposeFileChangePR({
    ...PR_TARGET,
    contentToAdd: `\n${yamlMeta}\n`,
    branchName: `scribe-bot-${Date.now()}`,
    prTitle: `add "${metadata.title}" to ${PR_TARGET.filePath}`,
    prBody: `Sent from Telegram-scribe-bot, on ${message.date}`,
    log: console.warn,
  })

  return { text: `✅  Submitted PR on ${pr.url}` }
}
