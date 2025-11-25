# 🎵 FlowBeats - Intelligent Music Player

> A modern Spotify-style web client built with React, TypeScript, and Vite, featuring AI-powered music intelligence and personalized recommendations.

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
- **Advanced Search** - Tracks, albums, artists with inline play controls
- **Personalized Dashboard** - Recently played, new releases, and top tracks
- **Comprehensive Library** - Playlists, saved tracks, albums, and followed artists
- **Web Playback SDK** - Full in-browser playback control

### 🧠 AI-Powered Music Intelligence
- **Smart Genre Detection** - Pattern matching for 12+ music categories
- **K-pop Specialization** - Enhanced detection for Korean music and artists
- **Personalized Recommendations** - AI-driven playlist suggestions
- **Music Profile Analysis** - Insights into your listening preferences
- **Performance Optimized** - Smart caching with sub-100ms load times

### 🎨 Modern UI/UX
- **Dark Theme** - Spotify-inspired design with glassmorphism effects
- **Responsive Design** - Optimized for desktop and mobile
- **Smooth Animations** - Transitions and hover effects
- **Hidden Scrollbars** - Clean aesthetic with maintained scroll functionality

---

## 📁 Project Structure

```
music-player-client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx       # Navigation header with search
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── Player.tsx       # Music player controls
│   │   ├── MediaView.tsx    # Album/Playlist detail view
│   │   └── PlaylistRecommendations.tsx  # AI recommendations widget
│   │
│   ├── pages/               # Route pages
│   │   ├── Dashboard.tsx    # Main landing page
│   │   ├── Search.tsx       # Search results page
│   │   ├── Browse.tsx       # Browse categories
│   │   ├── Library.tsx      # User's music library
│   │   ├── Recommendations.tsx  # Full recommendations page
│   │   ├── Artist.tsx       # Artist detail page
│   │   ├── Account.tsx      # User account settings
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
│   │   └── useSpotifyApi.ts         # API request hook with auto-refresh
│   │
│   ├── services/            # Business logic & API services
│   │   ├── musicIntelligenceService.ts  # AI recommendation engine
│   │   ├── audioFeaturesService.ts      # Audio analysis
│   │   └── recommendationEngine.ts      # Recommendation algorithms
│   │
│   ├── utils/               # Utility functions
│   │   ├── tokenRefresh.ts      # Token refresh utilities
│   │   ├── categoryMapping.ts   # Genre/category mappings
│   │   └── numberFormat.ts      # Number formatting (K, M)
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── spotify.ts       # Spotify API types
│   │
│   ├── store/               # Redux store (if needed)
│   │   └── playerSlice.ts   # Player state slice
│   │
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
│
├── server/                  # Backend auth server
│   └── index.ts             # Token refresh endpoint
│
├── docker/                  # Docker configuration
│   ├── Dockerfile           # Production build
│   ├── docker-compose.yml   # Production compose
│   └── docker-compose.dev.yml  # Development compose
│
├── additional_readme/       # Extended documentation
│   ├── AUTHENTICATION.md    # Auth flow details
│   ├── SEARCH.md            # Search implementation
│   ├── CATEGORIES.md        # Category system
│   ├── DOCKER.md            # Docker setup
│   └── ANIMATIONS.md        # Animation system
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
| **Deployment** | Docker, Nginx |

---

## 📋 Requirements

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

## 🐳 Docker Deployment

### Development
```bash
npm run docker:compose:dev
```

### Production
```bash
npm run docker:build:prod
npm run docker:compose:prod
```

---

---

## 🔑 Spotify API Scopes

| Scope | Description |
|-------|-------------|
| `streaming` | Control Spotify playback |
| `user-read-email` | Access user profile |
| `user-read-private` | Access account details |
| `user-library-read` | Read saved tracks/albums |
| `user-follow-read` | Read followed artists |
| `user-read-recently-played` | Access listening history |
| `user-top-read` | Access top artists/tracks |
| `playlist-read-private` | Read private playlists |
| `playlist-read-collaborative` | Read collaborative playlists |

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Playback not working** | Verify Spotify Premium subscription |
| **Empty library** | Re-authorize the app (logout → login) |
| **Auth errors** | Check redirect URI matches Spotify Dashboard |
| **No recommendations** | Need 20+ tracks in listening history |

---

## 📚 Additional Documentation

| Document | Description |
|----------|-------------|
| [AUTHENTICATION.md](./additional_readme/AUTHENTICATION.md) | OAuth 2.0 PKCE flow & token management |
| [SEARCH.md](./additional_readme/SEARCH.md) | Search implementation details |
| [CATEGORIES.md](./additional_readme/CATEGORIES.md) | Music categorization system |
| [DOCKER.md](./additional_readme/DOCKER.md) | Docker deployment guide |
| [ANIMATIONS.md](./additional_readme/ANIMATIONS.md) | UI animation system |

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
- [Vite](https://vitejs.dev/) - Next-gen frontend tooling
- [React](https://react.dev/) - UI framework

