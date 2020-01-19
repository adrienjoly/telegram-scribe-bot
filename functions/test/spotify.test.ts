/// <reference types="mocha" />

import expect from 'expect'
import { parseAlbumId } from './../src/use-cases/addSpotifyAlbumToShelfRepo'

const SAMPLE_ALBUM_ID = '62KA8cUOqlIg1gxbVqBieD'
const SAMPLE_URL = `https://open.spotify.com/album/${SAMPLE_ALBUM_ID}?si=aggz_NaqSle0D0rsRLpGgA`

describe('spotify use cases', () => {
  describe('parseAlbumId', () => {
    it('detects album id from URL', async () => {
      expect(parseAlbumId(SAMPLE_URL)).toEqual(SAMPLE_ALBUM_ID)
        )
      ).toEqual('62KA8cUOqlIg1gxbVqBieD')
    })
  })
})
