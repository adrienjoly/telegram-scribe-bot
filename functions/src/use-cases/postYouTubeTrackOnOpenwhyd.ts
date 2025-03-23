import { MessageHandlerOptions, BotResponse } from './../types'
import { ParsedMessageEntities } from './../Telegram'
import ytdl from '@distube/ytdl-core'

export type Options = {
  openwhyd: {
    username: string
    password: string
  }
}

type OpenwhydPostRequest = {
  eId: string
  url: string
  name: string
  img?: string
  desc?: string
}

export const parseYouTubeURL = (str: string) => {
  const url = str.match(/https?:\/\/[^\s]+/)?.[0]
  if (!url) return null
  const match =
    url.match(/youtube\.com\/v\/|embed\/|(?:.*)?[?&]v=([a-zA-Z0-9_-]+)/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/) ||
    url.match(/^\/yt\/([a-zA-Z0-9_-]+)/) ||
    url.match(/youtube\.com\/attribution_link\?.*v%3D([^ %]+)/) ||
    url.match(/youtube.googleapis.com\/v\/([a-zA-Z0-9_-]+)/)
  if (!match) return null
  return { url, id: match.pop() }
}

export const extractVideoInfo = async (youtubeURL: string) => {
  const { videoDetails } = await ytdl.getBasicInfo(youtubeURL)
  return {
    id: videoDetails.videoId,
    title: videoDetails.title,
    channelName: videoDetails.ownerChannelName,
    thumbnailURL: `https://img.youtube.com/vi/${videoDetails.videoId}/hqdefault.jpg`,
    // ... or we could pick a URL from the videoDetails.thumbnails array
  }
}

export const postYouTubeTrackOnOpenwhyd = async (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
): Promise<BotResponse> => {
  if (!options.openwhyd?.username) throw new Error('missing openwhyd.username')
  if (!options.openwhyd?.password) throw new Error('missing openwhyd.password')

  const youtubeVideo = parseYouTubeURL(message.rest)
  if (!youtubeVideo) {
    throw new Error('failed to find or parse YouTube URL')
  }
  console.info(`YouTube track id parsed from message: ${youtubeVideo.id}`)

  const metadata = await extractVideoInfo(youtubeVideo.url)
  console.info(`YouTube track metadata: ${JSON.stringify(metadata)}`)

  const openwhydPostRequest: OpenwhydPostRequest = {
    eId: `/yt/${youtubeVideo.id}`,
    url: `https://youtube.com/watch?v=${youtubeVideo.id}`,
    name: metadata.title,
    img: metadata.thumbnailURL,
    desc: message.rest.replace(youtubeVideo.url, '').trim(),
  }
  console.info(`Openwhyd API request: ${JSON.stringify(openwhydPostRequest)}`)

  const res = await fetch('https://openwhyd.org/api/v2/postTrack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // TODO: add Auth bearer
    body: JSON.stringify(openwhydPostRequest),
  })

  const resBody = await res
    .json()
    .catch(async () =>
      console.warn(`failed to parse JSON response: ${await res.text()}`)
    )

  if (res.status !== 200) {
    throw new Error(
      `failed to post track on Openwhyd API, status: ${res.status}, error: ${resBody?.error}`
    )
  }

  console.info(`Success response from Openwhyd API: ${JSON.stringify(resBody)}`)

  return { text: `✅  Posted track on ${resBody.url}` }
}
