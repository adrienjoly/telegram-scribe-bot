import { describe, it, before, after, beforeEach } from 'node:test'
import expect from 'expect'
import nock from 'nock'
import { ParsedMessageEntities } from '../Telegram'
import {
  extractVideoInfo,
  Options,
  parseYouTubeURL,
  postYouTubeTrackOnOpenwhyd,
} from './postYouTubeTrackOnOpenwhyd'

const onCI = process.env.CI

const FAKE_CREDS: Options = {
  openwhyd: {
    api_client_id: 'dummy',
    api_client_secret: 'dummy',
    username: 'username',
    password: 'password',
    youtube_api_key: 'dummy',
  },
}

const createMessage = ({ ...overrides }): ParsedMessageEntities => ({
  date: new Date(),
  commands: [],
  tags: [],
  rest: '',
  ...overrides,
})

describe('openwhyd use cases', () => {
  describe('parseYouTubeURL', () => {
    it('parses a usual YouTube URL', async () => {
      const res = parseYouTubeURL('https://www.youtube.com/watch?v=GpBFOJ3R0M4')
      expect(res).toMatchObject({
        url: 'https://www.youtube.com/watch?v=GpBFOJ3R0M4',
        id: 'GpBFOJ3R0M4',
      })
    })
  })

  describe('extractVideoInfo', () => {
    it('extracts the metadata of the YouTube video', async () => {
      nock('https://www.googleapis.com')
        .get((uri) => uri.includes(`/youtube/v3/videos`))
        .reply(200, {
          items: [
            {
              snippet: {
                title: 'Garbage - Only Happy When It Rains',
                channelTitle: 'GarbageVEVO',
              },
            },
          ],
        })
      const res = await extractVideoInfo('GpBFOJ3R0M4', 'dummy')
      expect(res).toMatchObject({
        title: 'Garbage - Only Happy When It Rains',
        channelName: 'GarbageVEVO',
        thumbnailURL: expect.stringMatching(/^https:\/\/.*GpBFOJ3R0M4.*\.jpg/),
      })
    })
  })

  describe('postYouTubeTrackOnOpenwhyd', () => {
    before(() => {
      nock.emitter.on('no match', ({ method, host, path }) =>
        console.warn(`⚠ no match for ${method} ${host}${path}`)
      )
    })

    after(() => {
      nock.cleanAll()
      nock.enableNetConnect()
    })

    beforeEach(() => {
      nock.cleanAll()
    })

    it('fails if no youtube URL was found in the message', async () => {
      const message = createMessage({ rest: 'coucou' })
      await expect(
        postYouTubeTrackOnOpenwhyd(message, FAKE_CREDS)
      ).rejects.toThrow(/failed to find or parse YouTube URL/)
    })

    it('posts the YouTube video with description', { skip: onCI }, async () => {
      const message = createMessage({
        rest: 'https://www.youtube.com/watch?v=GpBFOJ3R0M4 I love this song',
      })
      const postId = 'dummy_post_id'
      nock('https://www.googleapis.com')
        .get((uri) => uri.includes(`/youtube/v3/videos`))
        .reply(200, {
          items: [
            {
              snippet: {
                title: 'Garbage - Only Happy When It Rains',
                channelTitle: 'GarbageVEVO',
              },
            },
          ],
        })
      nock('https://openwhyd.eu.auth0.com')
        .post((uri) => uri.includes(`/oauth/token`))
        .reply(200, { access_token: `dummy` })
      nock('https://openwhyd.org')
        .post((uri) => uri.includes(`/api/v2/postTrack`))
        .reply(200, { url: `https://openwhyd.org/c/${postId}` })
      const res = await postYouTubeTrackOnOpenwhyd(message, FAKE_CREDS)
      expect(res).toHaveProperty(
        'text',
        `✅  Posted track on https://openwhyd.org/c/${postId}`
      )
    })
  })
})
