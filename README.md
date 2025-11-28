# 🎵 FlowBeats - Intelligent Music Player

> A modern Spotify-style web client built with React, TypeScript, and Vite, featuring AI-powered music intelligence and personalized recommendations. **Desktop only.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)

This is a university capstone project that utilizes the Spotify API to build an advanced web client with AI-powered music intelligence and a modern, sleek UI/UX.

---

## ✨ Key Features

### 🎵 Core Music Experience
- **OAuth PKCE Authentication** - Secure Spotify login flow with automatic token refresh
- **Unified Search System** - Header and page search with recent search history
- **Advanced Search** - Tracks, albums, artists, and playlists with inline play controls
- **Personalized Dashboard** - Recently played tracks, your playlists, and top tracks
- **Comprehensive Library** - Playlists, saved tracks, albums, and followed artists
- **Web Playback SDK** - Full in-browser playback with shuffle, repeat, and progress control
- **Browse Categories** - Spotify-style rectangular category cards for genre exploration

### 🧠 AI-Powered Music Intelligence
- **Smart Genre Detection** - Pattern matching for 12+ music categories
- **Personalized Recommendations** - AI-driven playlist suggestions
- **Music Profile Analysis** - Insights into your listening preferences
- **Performance Optimized** - Smart caching with sub-100ms load times

### 🎨 Modern UI/UX
- **Dark Theme** - Spotify-inspired design with glassmorphism effects
- **Desktop Optimized** - Designed for desktop browsers (1024px+)
- **Collapsible Sidebar** - Smooth transitions with responsive layout
- **Smooth Animations** - Fade, grow, and hover effects throughout
- **Hidden Scrollbars** - Clean aesthetic with maintained scroll functionality
- **Paginated Sections** - Navigation arrows for playlists and tracks
- **Grid Layouts** - 6-card grids on Dashboard, 4-column Browse categories

---

## 📁 Project Structure

```
music-player-client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx       # Navigation header with search & back button
│   │   ├── Sidebar.tsx      # Navigation sidebar (collapsible)
│   │   ├── Player.tsx       # Music player controls
│   │   ├── MediaView.tsx    # Album/Playlist detail view
│   │   ├── TrackMenu.tsx    # Track context menu
│   │   ├── PlaylistMenu.tsx # Playlist context menu
│   │   ├── AlbumMenu.tsx    # Album context menu
│   │   ├── ArtistMenu.tsx   # Artist context menu
│   │   ├── SpotifyIcon.tsx  # Spotify branding component
│   │   └── PlaylistRecommendations.tsx  # AI recommendations widget
│   │
│   ├── pages/               # Route pages
│   │   ├── Dashboard.tsx    # Main landing page with 6-card grids
│   │   ├── Search.tsx       # Search results with tab filtering
│   │   ├── Browse.tsx       # Spotify-style category cards
│   │   ├── Category.tsx     # Category detail with pagination
│   │   ├── Library.tsx      # User's music library
│   │   ├── Recommendations.tsx  # Full recommendations page
│   │   ├── Artist.tsx       # Artist detail page
│   │   ├── Profile.tsx      # User profile page
│   │   ├── Account.tsx      # User account settings
│   │   ├── Settings.tsx     # App settings
│   │   ├── About.tsx        # About page
│   │   └── Login.tsx        # Authentication page
│   │
│   ├── context/             # React Context providers
│   │   ├── auth.tsx         # Authentication state & token refresh
│   │   ├── player.tsx       # Music player state
│   │   ├── playlists.tsx    # Playlist management
│   │   ├── search.tsx       # Search state & history
│   │   └── toast.tsx        # Notification system
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useMusicIntelligence.ts  # AI recommendations hook
│   │   ├── useLocalAnalysis.ts      # Local music analysis
│   │   └── useSpotifyApi.ts         # API request hook with auto-refresh
│   │
│   ├── services/            # Business logic & API services
│   │   ├── musicIntelligenceService.ts  # AI recommendation engine
│   │   ├── audioFeaturesService.ts      # Audio analysis
│   │   ├── libraryService.ts            # Library management
│   │   ├── localAnalysisService.ts      # Local analysis
│   │   └── recommendationEngine.ts      # Recommendation algorithms
│   │
│   ├── utils/               # Utility functions
│   │   ├── tokenRefresh.ts      # Token refresh utilities
│   │   ├── categoryMapping.ts   # Genre/category mappings
│   │   └── numberFormat.ts      # Number formatting (K, M)
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── spotify.ts               # Spotify API types
│   │   └── spotify-web-playback.d.ts # Web Playback SDK types
│   │
│   ├── store/               # Redux store
│   │   ├── index.ts         # Store configuration
│   │   ├── hooks.ts         # Typed Redux hooks
│   │   └── playerSlice.ts   # Player state slice
│   │
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles with Tailwind
│
├── server/                  # Backend auth server
│   └── index.ts             # Token refresh endpoint
│
├── public/                  # Static assets
│
└── package.json             # Dependencies & scripts
```

---

## 🛠 Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19, TypeScript 5.6, Vite 6 |
| **UI Framework** | Material-UI (MUI) v7, Tailwind CSS |
| **State Management** | React Context, Redux Toolkit |
| **Routing** | React Router v7 |
| **API Integration** | Spotify Web API, Web Playback SDK |
| **Authentication** | OAuth 2.0 PKCE Flow |

---

## 📋 Requirements

### Device Requirements
- **Desktop Only** - Minimum screen width of 1024px
- **Modern Browser** - Chrome, Firefox, Safari, or Edge (latest versions)

### Development Requirements
- **Node.js** 18+ and npm
- **Spotify Account** (Premium required for playback)
- **Spotify Developer App** - Register at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- **Redirect URI** - Must match your app URL (e.g., `http://localhost:5173`)

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/WillWiC/music-player-client.git
cd music-player-client
npm install
```

### 2. Environment Setup
Create a `.env` file in the project root:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/
VITE_AUTH_SERVER_URL=http://localhost:3001
```

### 3. Start Development
```bash
# Frontend only
npm run dev

# Frontend + Backend (recommended)
npm run dev:all
```

### 4. Open in Browser
Navigate to `http://localhost:5173` and click "Continue with Spotify"

---

## 📸 Screenshots

### Dashboard
- Personalized greeting with time-based messages
- Your Playlists section with navigation arrows (6 cards)
- Recently Played Tracks grid (6 cards)
- Top 10 Tracks list

### Browse
- Spotify-style rectangular category cards (aspect 2:1)
- 4-column grid layout with hover effects
- Category icons with rotation animation

### Category
- Popular Artists carousel with navigation arrows
- Popular Songs list with album art
- Related Playlists with pagination controls

### Search
- Tab-based filtering (All, Songs, Artists, Albums, Playlists)
- Top result highlighting
- Inline play controls

---

## 🔑 Spotify API Scopes

| Scope | Description |
|-------|-------------|
| `streaming` | Control Spotify playback |
| `user-read-email` | Access user profile |
| `user-read-private` | Access account details |
| `user-library-read` | Read saved tracks/albums |
| `user-library-modify` | Save/remove tracks/albums |
| `user-follow-read` | Read followed artists |
| `user-read-recently-played` | Access listening history |
| `user-top-read` | Access top artists/tracks |
| `playlist-read-private` | Read private playlists |
| `playlist-read-collaborative` | Read collaborative playlists |
| `playlist-modify-public` | Modify public playlists |
| `playlist-modify-private` | Modify private playlists |

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Playback not working** | Verify Spotify Premium subscription |
| **Empty library** | Re-authorize the app (logout → login) |
| **Auth errors** | Check redirect URI matches Spotify Dashboard |
| **No recommendations** | Need 20+ tracks in listening history |
| **Player controls missing** | Ensure Web Playback SDK is loaded |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is for personal use and educational purposes only. Not intended for commercial use.

---

## 🙏 Acknowledgments

- [Spotify](https://developer.spotify.com/) - Web API & Web Playback SDK
- [Material-UI](https://mui.com/) - React component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Next-gen frontend tooling
- [React](https://react.dev/) - UI framework

