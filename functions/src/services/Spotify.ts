import SpotifyWebApi from 'spotify-web-api-node'

export type SpotifyCreds = {
  clientid: string
  secret: string
}

export const formatAlbum = (album: SpotifyApi.AlbumObjectSimplified) => ({
  title: album.name,
  artist: /*album.artistName ||*/ album.artists
    .map((artist) => artist.name)
    .join(', '),
  release_date: album.release_date,
  img: album.images[0].url,
  url: `https://open.spotify.com/album/${album.id}`,
})

export class Spotify {
  spotifyApi: SpotifyWebApi

  constructor({ clientid, secret }: SpotifyCreds) {
    this.spotifyApi = new SpotifyWebApi({
      clientId: clientid,
      clientSecret: secret,
    })
  }

  async connect(): Promise<void> {
    // Retrieve an access token.
    const { body: auth } = await this.spotifyApi.clientCredentialsGrant()

    // Save the access token so that it's used in future calls
    await this.spotifyApi.setAccessToken(auth.access_token)
  }

  async fetchAlbumMetadata({
    albumId,
  }: {
    albumId: string
  }): Promise<SpotifyApi.SingleAlbumResponse> {
    await this.connect()
    const { body: album } = await this.spotifyApi.getAlbum(albumId)
    return album
  }
}
