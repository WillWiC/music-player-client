// Minimal typings for Spotify Web Playback SDK
interface Spotify {
  Player: any;
}

declare global {
  interface Window {
    Spotify?: Spotify;
  }
}

export {};
