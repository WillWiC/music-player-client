/**
 * Spotify Web API Type Definitions
 * Complete TypeScript interfaces for Spotify data models
 * 
 * COVERS:
 * - Core objects: User, Artist, Album, Track, Playlist
 * - Features: Followers, Images, External URLs
 * - Playback: Device, Playback State
 * - Search: Search Results
 * 
 * Used throughout the app for:
 * - Type-safe API responses
 * - Component prop typing
 * - Redux state
 * - Hook return values
 */

// Spotify Web API error response
export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

/** Image object from Spotify (used in multiple contexts) */
export interface Image {
  url: string;
  height: number | null;
  width: number | null;
}

/** External URL object (typically links to Spotify web player) */
export interface ExternalUrls {
  spotify: string;
}

/** Followers information object */
export interface Followers {
  href: string | null;
  total: number;
}

/**
 * User object from Spotify
 * Contains user profile information and settings
 */
export interface User {
  country?: string;
  display_name: string | null;
  email?: string;
  explicit_content?: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  product?: string; // "premium" or "free"
  type: 'user';
  uri: string;
}

/**
 * Artist object from Spotify
 * Contains artist profile, genres, popularity
 */
export interface Artist {
  external_urls: ExternalUrls;
  followers?: Followers;
  genres?: string[]; // Genre tags (e.g., "k-pop", "hip hop")
  href: string;
  id: string;
  images?: Image[];
  name: string;
  popularity?: number; // 0-100 popularity score
  type: 'artist';
  uri: string;
}

/**
 * Album object from Spotify
 * Contains album information and track list
 */
export interface Album {
  album_type: 'album' | 'single' | 'compilation';
  total_tracks: number;
  available_markets: string[];
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  restrictions?: {
    reason: string;
  };
  type: 'album';
  uri: string;
  copyrights?: {
    text: string;
    type: string;
  }[];
  external_ids?: {
    isrc?: string;
    ean?: string;
    upc?: string;
  };
  genres?: string[];
  label?: string;
  popularity?: number;
  artists: Artist[];
  tracks?: {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items: Track[];
  };
}

export interface Track {
  album?: Album;
  artists: Artist[];
  available_markets?: string[];
  disc_number?: number;
  duration_ms: number;
  explicit: boolean;
  external_ids?: {
    isrc?: string;
    ean?: string;
    upc?: string;
  };
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_playable?: boolean;
  linked_from?: {};
  restrictions?: {
    reason: string;
  };
  name: string;
  popularity?: number;
  preview_url: string | null;
  track_number?: number;
  type: 'track';
  uri: string;
  is_local?: boolean;
}

export interface PlaylistTrack {
  added_at: string;
  added_by: {
    external_urls: ExternalUrls;
    followers?: Followers;
    href: string;
    id: string;
    type: 'user';
    uri: string;
  };
  is_local: boolean;
  track: Track;
}

export interface Playlist {
  collaborative: boolean;
  description: string | null;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: {
    external_urls: ExternalUrls;
    followers?: Followers;
    href: string;
    id: string;
    type: 'user';
    uri: string;
    display_name?: string;
  };
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items?: PlaylistTrack[];
  };
  type: 'playlist';
  uri: string;
}

export interface RecentlyPlayedItem {
  track: Track;
  played_at: string;
  context: {
    type: string;
    href: string;
    external_urls: ExternalUrls;
    uri: string;
  } | null;
}

export interface Category {
  href: string;
  icons: Image[];
  id: string;
  name: string;
}

export interface Device {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
}

export interface PlaybackState {
  device: Device;
  repeat_state: 'off' | 'track' | 'context';
  shuffle_state: boolean;
  context: {
    type: string;
    href: string;
    external_urls: ExternalUrls;
    uri: string;
  } | null;
  timestamp: number;
  progress_ms: number | null;
  is_playing: boolean;
  item: Track | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
  actions: {
    interrupting_playback?: boolean;
    pausing?: boolean;
    resuming?: boolean;
    seeking?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
    toggling_repeat_context?: boolean;
    toggling_shuffle?: boolean;
    toggling_repeat_track?: boolean;
    transferring_playback?: boolean;
  };
}
