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
  artists: Artist[];
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
  description?: string;
  tracks: {
    total: number;
  };
}

export interface User {
  id: string;
  display_name: string;
  email?: string;
  images?: Image[];
  followers?: {
    total: number;
  };
}

export interface RecentlyPlayedItem {
  track: Track;
  played_at: string;
}

export interface Category {
  id: string;
  name: string;
  icons?: Image[];
}
