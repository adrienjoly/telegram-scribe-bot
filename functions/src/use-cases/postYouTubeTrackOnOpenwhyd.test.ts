import { describe, it, before, after, beforeEach } from 'node:test'
import expect from 'expect'
import nock from 'nock'
import { ParsedMessageEntities } from '../Telegram'
import {
  Options,
  parseYouTubeURL,
  postYouTubeTrackOnOpenwhyd,
} from './postYouTubeTrackOnOpenwhyd'

const FAKE_CREDS: Options = {
  openwhyd: {
    username: 'username',
    password: 'password',
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

    it('posts the YouTube video with description to Openwhyd', async () => {
      const message = createMessage({
        rest: 'https://www.youtube.com/watch?v=GpBFOJ3R0M4 I love this song',
      })
      const postId = 'dummy_post_id'
      nock('https://openwhyd.org')
        .post((uri) => uri.includes(`/api/post`))
        .reply(200, { _id: postId })
      const res = await postYouTubeTrackOnOpenwhyd(message, FAKE_CREDS)
      expect(res).toHaveProperty(
        'text',
        `✅  Posted track on https://openwhyd.org/c/${postId}`
      )
    })
  })
})
