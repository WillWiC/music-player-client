# 🎵 FlowBeats - Intelligent Music Player

> A modern Spotify-powered web client built with React, TypeScript, and Vite, featuring AI-powered music intelligence, personalized recommendations, and a fully responsive design for all devices.

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)

This is a university capstone project that utilizes the Spotify API to build an advanced web client with AI-powered music intelligence and a modern, sleek UI/UX.

---

## ✨ Key Features

### 🎵 Core Music Experience
- **OAuth PKCE Authentication** - Secure Spotify login flow with automatic token refresh
- **Full Playback Controls** - Play, pause, skip, previous, shuffle, repeat modes (off/all/one)
- **Cross-Device Playback** - Transfer playback between devices with device picker
- **Volume Control** - Adjustable volume with mute toggle
- **Progress Seeking** - Click or drag to seek within tracks
- **Queue Management** - View and control upcoming tracks

### 🔍 Search & Discovery
- **Unified Search System** - Header search bar with instant results
- **Recent Search History** - Quick access to previous searches
- **Tabbed Search Results** - Filter by All, Songs, Artists, Albums, or Playlists
- **Top Result Highlighting** - Featured result with quick play action
- **Inline Play Controls** - Play any result directly from search

### 📚 Library Management
- **Playlists Tab** - View all your playlists with cover art
- **Liked Songs Tab** - Full tracklist with MediaView-style layout
- **Albums Tab** - Saved albums with artist info
- **Artists Tab** - Followed artists with follower counts
- **Context Menus** - Right-click actions for tracks, playlists, albums, and artists

### 🎨 Browse & Categories
- **Spotify-Style Categories** - Rectangular cards with gradient backgrounds
- **Category Detail Pages** - Popular artists, songs, and related playlists
- **Navigation Arrows** - Paginated browsing for large collections
- **Genre Exploration** - Discover music by genre and mood

### 🧠 AI-Powered Music Intelligence
- **Smart Playlist Recommendations** - AI-driven suggestions based on listening habits
- **Match Score System** - Percentage-based relevance scoring
- **Music Profile Analysis** - Insights into top genres and discovery rate
- **Performance Optimized** - Smart caching with fast load times

### 👤 User Profile & Settings
- **Profile Page** - View your Spotify profile information
- **Account Details** - Subscription status, country, and account info
- **Settings Page** - App configuration options
- **About Page** - Application information and credits

### 📱 Responsive Design
- **Mobile Optimized** - Full functionality on phones (320px+)
- **Tablet Support** - Adapted layouts for medium screens
- **Desktop Experience** - Rich interface for large screens
- **Adaptive Grids** - Auto-adjusting card layouts per screen size
- **Touch Friendly** - Mobile-optimized controls and interactions

### 🎨 Modern UI/UX
- **Dark Theme** - Spotify-inspired design with glassmorphism effects
- **Smooth Animations** - Fade, grow, scale, and hover transitions
- **Collapsible Sidebar** - Navigation with Your Library section
- **Hidden Scrollbars** - Clean aesthetic with scroll functionality
- **Active Track Highlighting** - Visual indicators for currently playing
- **Hover States** - Interactive feedback throughout the app
- **Toast Notifications** - User feedback for actions and errors

### 🎛️ Player Features
- **Persistent Player Bar** - Always-visible controls at bottom
- **Mobile Player** - Compact layout with essential controls
- **Desktop Player** - Full-featured with volume and progress
- **Now Playing Info** - Album art, track name, and artist
- **Remote Playback Indicator** - Shows when playing on external device
- **Track Context Menu** - Quick actions from player

---

## 📱 Page Features

### Dashboard
- Time-based personalized greeting
- Quick action buttons (Playlists, Recent, Top Tracks, Browse)
- Your Playlists section with pagination
- Recently Played grid with navigation
- Top Tracks list
- AI-powered playlist recommendations widget

### Search
- Real-time search with debouncing
- Tab-based result filtering
- Infinite scroll for results
- Track, album, artist, and playlist results
- Quick play actions on hover

### Browse
- Category grid with Spotify-style cards
- Hover animations and gradients
- Click to explore category content

### Category
- Popular Artists carousel (single row, paginated)
- Popular Songs list (MediaView-style tracklist)
- Related Playlists grid (paginated)
- Play any artist, track, or playlist

### Library
- Tab navigation (Playlists, Liked, Albums, Artists)
- Responsive card grids
- Full tracklist for liked songs
- Clickable artist names navigate to artist page
- Album names link to album page

### Artist
- Artist header with image and stats
- Top tracks list
- Albums and singles
- Related artists

### MediaView (Album/Playlist)
- Large cover art with play button
- Track list with sorting options
- Duration and date added columns
- Shuffle and repeat controls
- Playlist/album context menu

### Recommendations
- Full music profile analysis
- Top genres breakdown
- Discovery rate statistics
- Curated playlist suggestions

---

## 📁 Project Structure

```
music-player-client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx       # Navigation header with search
│   │   ├── Sidebar.tsx      # Collapsible sidebar with library
│   │   ├── Player.tsx       # Music player (mobile + desktop)
│   │   ├── MediaView.tsx    # Album/Playlist detail view
│   │   ├── NavigationButton.tsx  # Pagination arrows
│   │   ├── TrackMenu.tsx    # Track context menu
│   │   ├── PlaylistMenu.tsx # Playlist context menu
│   │   ├── AlbumMenu.tsx    # Album context menu
│   │   ├── ArtistMenu.tsx   # Artist context menu
│   │   ├── SpotifyIcon.tsx  # Spotify branding component
│   │   └── PlaylistRecommendations.tsx  # AI recommendations widget
│   │
│   ├── pages/               # Route pages
│   │   ├── Dashboard.tsx    # Main landing with grids
│   │   ├── Search.tsx       # Search results with tabs
│   │   ├── Browse.tsx       # Category cards grid
│   │   ├── Category.tsx     # Category detail page
│   │   ├── Library.tsx      # User's music library
│   │   ├── Recommendations.tsx  # Full recommendations page
│   │   ├── Artist.tsx       # Artist detail page
│   │   ├── Profile.tsx      # User profile page
│   │   ├── Account.tsx      # Account settings
│   │   ├── Settings.tsx     # App settings
│   │   ├── About.tsx        # About page
│   │   └── Login.tsx        # Authentication page
│   │
│   ├── context/             # React Context providers
│   │   ├── auth.tsx         # Authentication state & token refresh
│   │   ├── player.tsx       # Music player state & controls
│   │   ├── playlists.tsx    # Playlist management
│   │   ├── search.tsx       # Search state & history
│   │   └── toast.tsx        # Notification system
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useMusicIntelligence.ts  # AI recommendations hook
│   │   ├── useLocalAnalysis.ts      # Local music analysis
│   │   └── useSpotifyApi.ts         # API requests with auto-refresh
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
| **Frontend** | React 18, TypeScript 5.6, Vite 6 |
| **UI Framework** | Material-UI (MUI) v7, Tailwind CSS 3.4 |
| **State Management** | React Context, Redux Toolkit |
| **Routing** | React Router v7 |
| **API Integration** | Spotify Web API, Web Playback SDK |
| **Authentication** | OAuth 2.0 PKCE Flow |
| **Deployment** | Vercel (with SPA routing support) |

---

## 📋 Requirements

### Device Requirements
- **Mobile** - 320px minimum width (iOS Safari, Chrome Mobile)
- **Tablet** - Full functionality on 600px+ screens
- **Desktop** - Optimized experience on 1024px+ screens
- **Modern Browser** - Chrome, Firefox, Safari, or Edge (latest versions)

### Development Requirements
- **Node.js** 18+ and npm
- **Spotify Account** (Premium required)
- **Spotify Developer App** - Register at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- **Redirect URI** - Must match your app URL (e.g., `http://localhost:5173`)

### End-User Requirement
- **Spotify Account** (Premium Requirement)

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

## 🚀 Deployment

### Vercel Deployment
The project includes `vercel.json` for proper SPA routing:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SPOTIFY_CLIENT_ID`
   - `VITE_SPOTIFY_REDIRECT_URI` (your Vercel URL)
   - `VITE_AUTH_SERVER_URL`
3. Add the Vercel URL to your Spotify app's redirect URIs
4. Deploy!

---

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
| `user-read-playback-state` | Read playback state |
| `user-modify-playback-state` | Control playback |

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Playback not working** | Verify Spotify Premium subscription |
| **Empty library** | Re-authorize the app (logout → login) |
| **Auth errors** | Check redirect URI matches Spotify Dashboard |
| **No recommendations** | Need 20+ tracks in listening history |
| **Player controls missing** | Ensure Web Playback SDK is loaded |
| **404 on refresh (Vercel)** | Ensure `vercel.json` is present with rewrites |
| **Mobile controls not showing** | Check viewport meta tag is set correctly |

---

## 🎯 Responsive Breakpoints

| Breakpoint | Width | Description |
|------------|-------|-------------|
| **xs** | < 600px | Mobile phones |
| **sm** | 600-900px | Large phones, small tablets |
| **md** | 900-1200px | Tablets, small laptops |
| **lg** | 1200px+ | Desktops and larger screens |

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

