import { describe, it, before, after, beforeEach } from 'node:test'
import expect from 'expect'
import nock from 'nock'
import {
  Options,
  parseAlbumId,
  addSpotifyAlbumToShelfRepo,
} from './addSpotifyAlbumToShelfRepo'
import { ParsedMessageEntities } from '../Telegram'

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
    it('detects album id from URL that includes locale and query params', async () => {
      const albumId = '3fatZKCQZShmBuJMY4hvsY'
      const url = `https://open.spotify.com/intl-fr/album/${albumId}?si=H5uJywBDTxSGw_iOjzePnw&nd=1&dlsi=61e452ecb9384e53`
      expect(parseAlbumId(url)).toEqual(albumId)
    })
  })
  describe('addSpotifyAlbumToShelfRepo', () => {
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

    it('fails if no albumId was found in the message', async () => {
      const message = createMessage({ rest: 'coucou' })
      await expect(
        addSpotifyAlbumToShelfRepo(message, FAKE_CREDS)
      ).rejects.toThrow(/failed to find albumId in this URL/)
    })

    it('extracts the albumId and generates a pull request', async () => {
      const message = createMessage({ rest: SAMPLE_URL })
      nock('https://accounts.spotify.com')
        .post((uri) => uri.includes(`/api/token`))
        .reply(200, { token: 'token' })
      nock('https://api.spotify.com')
        .get((uri) => uri.includes(`/v1/albums/${SAMPLE_ALBUM_ID}`))
        .reply(200, {
          title: 'coucou',
          artists: [{ name: 'artist' }],
          images: [{ url: '' }],
        })
      nock('https://api.github.com')
        .get((uri) => uri.includes(`/repos/adrienjoly/album-shelf`)) // TODO: make the repo customizable
        .reply(200, { permissions: { push: true } })
      nock('https://api.github.com')
        .get((uri) => uri.includes(`/repos/adrienjoly/album-shelf/commits`)) // TODO: make the repo customizable
        .reply(200, [{ sha: 'sha', commit: { tree: { sha: 'treesha' } } }])
      nock('https://api.github.com')
        .get((uri) =>
          uri.includes(
            `/repos/adrienjoly/album-shelf/contents/_data%2Falbums.yaml`
          )
        )
        .reply(200, {
          encoding: 'base64',
          content: 'ABAB',
          sha: 'filesha',
        })
      nock('https://api.github.com')
        .post((uri) => uri.includes('/repos/adrienjoly/album-shelf/git/blobs'))
        .reply(200, { sha: 'blobsha' })
      nock('https://api.github.com')
        .post((uri) => uri.includes('/repos/adrienjoly/album-shelf/git/trees'))
        .reply(200, { sha: 'newtreesha' })
      nock('https://api.github.com')
        .post((uri) =>
          uri.includes('/repos/adrienjoly/album-shelf/git/commits')
        )
        .reply(200, { sha: 'commitsha' })
      nock('https://api.github.com')
        .post('/repos/adrienjoly/album-shelf/git/refs')
        .reply(200, {})
      nock('https://api.github.com')
        .post('/repos/adrienjoly/album-shelf/pulls')
        .reply(200, { html_url: '//successful-pr' })
      nock('https://api.github.com')
        .post('/graphql') // body: '{"query":"\n    query ($owner: String!, $repo: String!, $head: String!) {\n      repository(name: $repo, owner: $owner) {\n        ref(qualifiedName: $head) {\n          associatedPullRequests(first: 1, states: OPEN) {\n            edges {\n              node {\n                id\n                number\n                url\n              }\n            }\n          }\n        }\n      }\n    }","variables":{"owner":"adrienjoly","repo":"album-shelf","head":"scribe-bot-1673102657943"}}'
        .reply(200, { data: { repository: { ref: 'coucou' } } })
      nock('https://api.github.com')
        .patch((uri) =>
          uri.includes(
            '/repos/adrienjoly/album-shelf/git/refs/heads%2Fscribe-bot-'
          )
        )
        .reply(200, { data: {} })
      const res = await addSpotifyAlbumToShelfRepo(message, FAKE_CREDS)
      expect(res).toHaveProperty('text', '✅  Submitted PR on //successful-pr')
    })
  })
})
