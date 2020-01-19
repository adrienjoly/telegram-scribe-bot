/// <reference types="mocha" />

import expect from 'expect'
import { parseAlbumId } from './../src/use-cases/addSpotifyAlbumToShelfRepo'

describe('spotify use cases', () => {
  describe('parseAlbumId', () => {
    it('detects album id from URL', async () => {
      expect(
        parseAlbumId(
          'https://open.spotify.com/album/62KA8cUOqlIg1gxbVqBieD?si=aggz_NaqSle0D0rsRLpGgA'
        )
      ).toEqual('62KA8cUOqlIg1gxbVqBieD')
    })
  })
})
