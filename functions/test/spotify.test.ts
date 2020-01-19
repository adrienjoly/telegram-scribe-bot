/// <reference types="mocha" />

import expect from 'expect'
import nock from 'nock'
import {
  Options,
  parseAlbumId,
  addSpotifyAlbumToShelfRepo,
} from './../src/use-cases/addSpotifyAlbumToShelfRepo'
import { ParsedMessageEntities } from './../src/Telegram'

const FAKE_CREDS: Options = {
  spotify: {
    clientid: 'clientid',
    secret: 'secret',
  },
  github: {
    token: 'token',
  },
}

const createMessage = ({ ...overrides }): ParsedMessageEntities => ({
  date: new Date(),
  commands: [],
  tags: [],
  rest: '',
  ...overrides,
})

const SAMPLE_ALBUM_ID = '62KA8cUOqlIg1gxbVqBieD'
const SAMPLE_URL = `https://open.spotify.com/album/${SAMPLE_ALBUM_ID}?si=aggz_NaqSle0D0rsRLpGgA`

describe('spotify use cases', () => {
  describe('parseAlbumId', () => {
    it('detects album id from URL', async () => {
      expect(parseAlbumId(SAMPLE_URL)).toEqual(SAMPLE_ALBUM_ID)
    })
  })
  describe('addSpotifyAlbumToShelfRepo', () => {
    before(() => {
      nock.emitter.on('no match', ({ method, path }) =>
        console.warn(`⚠ no match for ${method} ${path}`)
      )
    })

    after(() => {
      nock.cleanAll()
      nock.enableNetConnect()
    })

    beforeEach(() => {
      nock.cleanAll()
    })

    it('fails if no albumId was found in the message', async () => {
      const message = createMessage({ rest: 'coucou' })
      expect(addSpotifyAlbumToShelfRepo(message, FAKE_CREDS)).rejects.toThrow(
        /failed to find albumId in this URL/
      )
    })

    it('extracts the albumId and generates a pull request', async () => {
      const message = createMessage({ rest: SAMPLE_URL })
      await addSpotifyAlbumToShelfRepo(message, FAKE_CREDS)
    })
  })
})
