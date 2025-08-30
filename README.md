# Spotify-like Web Music Player (React + TypeScript + Vite)

This repository is a lightweight Spotify-style web client built with React, TypeScript, Vite and MUI.

It includes:

- OAuth PKCE authentication with Spotify
- Search (tracks, albums, artists) with inline play controls
- Dashboard with recently played, new releases and top tracks
- A `Library` page that shows your playlists, liked songs (saved tracks), saved albums and followed artists
- Integration with the Spotify Web Playback SDK for in-browser playback (requires Spotify Premium)

---

## Requirements

- Node.js 18+ and npm
- A Spotify account (Premium is required for playback)
- A Spotify application (Client ID) configured in the Spotify Developer Dashboard with a Redirect URI matching the app (e.g. `http://localhost:5173`)

---

## Quick start (development)

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

Create a `.env` file in the project root (or set environment variables). The app reads these via Vite (`import.meta.env`). Example:

```
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/
```

Make sure the Redirect URI is registered for your Spotify app in the Spotify Developer Dashboard.

3. Start the dev server

```bash
npm run dev
```

4. Open the app

- Visit the URL shown by Vite (usually `http://localhost:5173`).
- Click "Continue with Spotify" and complete the OAuth flow. The app requests scopes required to read your library and control playback.

---

## Important scope notes

To read saved tracks/albums and followed artists, the app requests extra scopes. If you previously logged-in before those scopes were added, you must re-login (use the Logout button in the app) so Spotify prompts you for the new scopes:

- `user-library-read` — read your saved tracks and albums
- `user-follow-read` — read the artists you follow

If the Library page is empty despite you having content, re-login to the app to ensure the token contains these scopes.

---

## Production build

Build the app for production:

```bash
npm run build
```

Preview the built site locally:

```bash
npm run preview
```

---

## Troubleshooting

- Playback doesn't work: verify you have Spotify Premium and that a Spotify playback device (desktop/mobile app or Web Playback SDK player) is active and logged into the same account.
- Library lists empty: re-authorize (logout & re-login) so the token includes `user-library-read` and `user-follow-read`.
- Token or CORS errors: ensure your `VITE_SPOTIFY_REDIRECT_URI` matches the redirect URI registered with your Spotify app.

---

## Developer notes

Key files to look at:

- `src/context/auth.tsx` — OAuth PKCE flow and scope configuration
- `src/context/player.tsx` — Spotify Web Playback SDK integration and playback helpers
- `src/pages/Search.tsx` — search UI and result rendering
- `src/pages/Library.tsx` — Library page (playlists, liked songs, saved albums, followed artists)
- `src/components/Header.tsx` — top search bar and dropdown (now includes play buttons)

If you'd like, I can add a visible "Re-authorize" button to force a fresh OAuth prompt after changing scopes.

Enjoy! 🎧
