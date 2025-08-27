export interface Image {
  url: string;
  height?: number;
  width?: number;
}

export interface Artist {
  id: string;
  name: string;
}

export interface Album {
  id: string;
  name: string;
  images?: Image[];
}

export interface Track {
  id: string;
  name: string;
  artists?: Artist[];
  album: Album;
  duration_ms?: number;
  uri?: string;
}

export interface Playlist {
  id: string;
  name: string;
  images?: Image[];
}
