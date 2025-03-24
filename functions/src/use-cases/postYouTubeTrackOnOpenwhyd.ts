import { MessageHandlerOptions, BotResponse } from './../types'
import { ParsedMessageEntities } from './../Telegram'

export type Options = {
  openwhyd: {
    /** Credentials of "telegram bot" application, on Openwhyd's Auth0 account */
    api_client_id: string
    /** Credentials of "telegram bot" application, on Openwhyd's Auth0 account */
    api_client_secret: string
    /** Username/handle of the Openwhyd account to which the track must be posted */
    username: string
    /** Password of the Openwhyd account to which the track must be posted */
    password: string
    /** API key to request the YouTube API: https://console.cloud.google.com/apis/api/youtube.googleapis.com */
    youtube_api_key: string
  }
}

/** Information needed to request an access_token to Openwhyd's Auth0 API */
type OpenwhydTokenRequest = {
  /** Credentials of "telegram bot" application, on Openwhyd's Auth0 account */
  clientId: string
  /** Credentials of "telegram bot" application, on Openwhyd's Auth0 account */
  clientSecret: string
  /** Username/handle of the Openwhyd account to which the track must be posted */
  username: string
  /** Password of the Openwhyd account to which the track must be posted */
  password: string
}

/** Expected payload/body of requests to `POST https://openwhyd.org/api/v2/postTrack` */
type OpenwhydPostRequest = {
  url: string
  title: string
  thumbnail?: string
  description?: string
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

export const extractVideoInfo = async (
  videoId: string,
  youtubeApiKey: string
) => {
  const params = new URLSearchParams({
    part: 'snippet',
    id: videoId,
    key: youtubeApiKey,
  })
  const reqURL = `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
  const req = await fetch(reqURL)
  const res = await req.json()
  if (res.error)
    throw new Error(
      `failed to fetch video info from YouTube, cause: ${res.error.message}`
    )
  const { snippet } = res.items[0]
  return {
    title: snippet.title,
    channelName: snippet.channelTitle,
    thumbnailURL: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    // ... or we could pick a URL from the thumbnails array
  }
}

const requestOpenwhydToken = async (req: OpenwhydTokenRequest) => {
  const issuerBaseURL = 'https://openwhyd.eu.auth0.com'
  const tokenRequest = await fetch(`${issuerBaseURL}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      audience: 'https://openwhyd.org/api/v2/', // identifier of Openwhyd API v2, as set on Auth0
      client_id: req.clientId,
      client_secret: req.clientSecret,
      grant_type: 'password', // "password" option must be checked, in the configuration of the client application: https://manage.auth0.com/dashboard/eu/openwhyd/applications
      username: req.username,
      password: req.password,
    }),
  })
  const tokenResponse = await tokenRequest.json()
  if (tokenResponse.error)
    throw new Error(
      `failed to get openwhyd token, cause: ${tokenResponse.error}, ${tokenResponse.error_description}`
    )
  return { accessToken: tokenResponse.access_token }
}

export const postYouTubeTrackOnOpenwhyd = async (
  message: ParsedMessageEntities,
  options: MessageHandlerOptions
): Promise<BotResponse> => {
  // crude validation of required options: credentials to post on Openwhyd
  if (!options.openwhyd?.username) throw new Error('missing openwhyd.username')
  if (!options.openwhyd?.password) throw new Error('missing openwhyd.password')
  if (!options.openwhyd?.api_client_id)
    throw new Error('missing openwhyd.api_client_id')
  if (!options.openwhyd?.api_client_secret)
    throw new Error('missing openwhyd.api_client_secret')
  if (!options.openwhyd?.youtube_api_key)
    throw new Error('missing openwhyd.youtube_api_key')

  const youtubeVideo = parseYouTubeURL(message.rest)
  if (!youtubeVideo?.id) {
    throw new Error('failed to find or parse YouTube URL')
  }
  console.info(`YouTube track id parsed from message: ${youtubeVideo.id}`)

  const metadata = await extractVideoInfo(
    youtubeVideo.id,
    options.openwhyd.youtube_api_key
  )
  console.info(`YouTube track metadata: ${JSON.stringify(metadata)}`)

  const openwhydPostRequest: OpenwhydPostRequest = {
    url: `https://youtube.com/watch?v=${youtubeVideo.id}`,
    title: metadata.title,
    thumbnail: metadata.thumbnailURL,
    description: message.rest.replace(youtubeVideo.url, '').trim(),
  }
  console.info(`Openwhyd API request: ${JSON.stringify(openwhydPostRequest)}`)

  const { accessToken } = await requestOpenwhydToken({
    clientId: options.openwhyd.api_client_id,
    clientSecret: options.openwhyd.api_client_secret,
    username: options.openwhyd.username,
    password: options.openwhyd.password,
  })

  const res = await fetch('https://openwhyd.org/api/v2/postTrack', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
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
