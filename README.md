# FlowBeats - Intelligent Music Player (React + TypeScript + Vite)

An advanced Spotify-style web client built with React, TypeScript, Vite and Material-UI, featuring AI-powered music intelligence and personalized recommendations.

## ✨ Key Features

### 🎵 **Core Music Experience**
- **OAuth PKCE Authentication** with Spotify - Secure login flow
- **Unified Search System** - Seamless header and page search with recent searches
- **Advanced Search** - Tracks, albums, artists with inline play controls and instant previews
- **Personalized Dashboard** - Recently played, new releases, and top tracks
- **Comprehensive Library** - Playlists, saved tracks, albums, and followed artists
- **Web Playback Integration** - In-browser playback with Spotify Web Playback SDK

### 🧠 **AI-Powered Music Intelligence** ⚡ **NEW: 3-5x FASTER!**
- **Smart Genre Detection** - Advanced pattern matching for 12+ music categories
- **K-pop Specialization** - Enhanced detection for Korean music and major K-pop artists
- **Personalized Recommendations** - AI-driven playlist suggestions based on listening history
- **Music Profile Analysis** - Detailed insights into your musical preferences
- **Popular Playlist Filtering** - Curated selection of high-quality, well-followed playlists
- **Performance Optimized** - Parallel execution, smart caching, and 50% fewer API calls
- **Instant Cache** - Sub-100ms load times for cached recommendations

### 🎨 **Enhanced User Experience**
- **Unified Search** - Synchronized header and page search with instant results
- **Recent Search History** - Quick access to your last 10 searches
- **Modern Dark UI** - Sleek, Spotify-inspired interface with glassmorphism effects
- **Hidden Scrollbars** - Clean aesthetic with maintained scroll functionality
- **Keyboard Navigation** - Arrow keys and shortcuts for efficient browsing
- **Responsive Design** - Optimized for desktop and mobile devices
- **Real-time Updates** - Live music data and recommendation updates

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Framework**: Material-UI (MUI) v7
- **State Management**: Redux Toolkit
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom components
- **API Integration**: Spotify Web API
- **Authentication**: OAuth 2.0 PKCE flow
- **Deployment**: Docker support with multi-stage builds

---

## 📋 Requirements

- **Node.js** 18+ and npm
- **Spotify Account** (Premium required for playback functionality)
- **Spotify App Registration** - Client ID configured in Spotify Developer Dashboard
- **Redirect URI** - Must match your app URL (e.g., `http://localhost:5173`)

---

## 🚀 Quick Start (Development)

### 1. **Install Dependencies**
```bash
npm install
# or for legacy peer deps compatibility
npm run install:legacy
```

### 2. **Environment Configuration**
Create a `.env` file in the project root:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/
```

> **Important**: Register the redirect URI in your Spotify Developer Dashboard

### 3. **Development Server**
```bash
# Start frontend only
npm run dev

# Start both frontend and backend
npm run dev:all
```

### 4. **Access the Application**
- Open `http://localhost:5173` in your browser
- Click "Continue with Spotify" to authenticate
- Grant required permissions for full functionality

## 🐳 Docker Support

### Development with Docker
```bash
# Build development image
npm run docker:build:dev

# Run with live reload
npm run docker:run:dev        # Windows
npm run docker:run:dev:unix   # Linux/macOS

# Docker Compose (recommended)
npm run docker:compose:dev
```

### Production Deployment
```bash
# Build production image
npm run docker:build:prod

# Run production container
npm run docker:run

# Docker Compose production
npm run docker:compose:prod
```

## 🎯 Music Intelligence Features

### **Smart Recommendations**
- **Genre-Aware Suggestions**: Detects 12+ music categories including K-pop, Electronic, Hip-hop, Rock, Classical, and more
- **Popular Playlist Curation**: Filters for high-quality playlists with substantial follower counts
- **Personalized Discovery**: AI-powered recommendations based on your listening history
- **Cultural Specialization**: Enhanced detection for K-pop artists, Korean music, and Asian pop

### **Advanced Analytics**
- **Music Profile Analysis**: Detailed breakdown of your musical preferences
- **Listening Pattern Recognition**: Identifies trends in your music consumption
- **Diversity Scoring**: Measures the variety in your music taste
- **Genre Distribution**: Visual representation of your musical preferences

---

## 🔧 Production Build

### Standard Build
```bash
# Build for production
npm run build

# Preview locally
npm run preview
```

### Docker Production
```bash
# Build and run production container
npm run docker:build:prod
npm run docker:run

# Or use Docker Compose
npm run docker:compose:prod
```

---

## 🔑 Spotify API Scopes

The application requests these Spotify permissions:

### **Required Scopes**
- `streaming` — Control Spotify playback
- `user-read-email` — Access user profile
- `user-read-private` — Access user account details
- `user-library-read` — Read saved tracks and albums
- `user-follow-read` — Read followed artists
- `user-read-recently-played` — Access listening history
- `user-top-read` — Access top artists and tracks
- `playlist-read-private` — Read private playlists
- `playlist-read-collaborative` — Read collaborative playlists

> **Note**: If you previously authorized the app before new scopes were added, logout and re-login to grant additional permissions.

---

## 🔍 Troubleshooting

### **Playback Issues**
- ✅ Verify **Spotify Premium** subscription
- ✅ Ensure Spotify app is **active** on a device
- ✅ Check that both accounts are **logged into the same Spotify account**
- ✅ Try refreshing the **Web Playback SDK** connection

### **Empty Library/Data**
- ✅ **Re-authorize** the application (logout → login)
- ✅ Ensure all **required scopes** are granted
- ✅ Check **internet connection** and API availability

### **Authentication Errors**
- ✅ Verify `VITE_SPOTIFY_REDIRECT_URI` matches **registered URI**
- ✅ Check **Client ID** is correct
- ✅ Ensure redirect URI is properly **registered** in Spotify Dashboard
- ✅ Clear browser **cache and cookies**

### **Recommendation Issues**
- ✅ Allow time for **music intelligence** to analyze your listening history
- ✅ Ensure you have **sufficient listening data** (recommended: 20+ tracks)
- ✅ Check that **genre detection** is working by viewing your music profile

---

## 🎨 UI Features

- **Modern Dark Theme** - Spotify-inspired design with glassmorphism effects
- **Hidden Scrollbars** - Clean interface with maintained scroll functionality  
- **Responsive Layout** - Optimized for desktop and mobile viewing
- **Interactive Components** - Smooth animations and transitions
- **Accessibility** - WCAG compliant design patterns

---

## 📚 Additional Documentation

### Core Features
- [Docker Setup Guide](./additional_readme/DOCKER.md)
- [Authentication Flow](./additional_readme/README_AUTH.md)
- [Token Refresh Implementation](./additional_readme/TOKEN_REFRESH_IMPLEMENTATION.md)
- [Category Improvements](./additional_readme/CATEGORY_IMPROVEMENTS.md)

### Recent Improvements ⚡
- [**Search System Optimization**](./SEARCH_RELEVANCE_FIX.md) - Top result relevance fix + auto-navigation
- [**Null Safety Enhancement**](./NULL_SAFETY_FIX.md) - Comprehensive error handling for Spotify API
- [**Smart Playlist Performance**](./SMART_PLAYLIST_OPTIMIZATION.md) - **3-5x faster recommendations!** 🚀

### Search Features
- [Search System Improvements](./additional_readme/SEARCH_IMPROVEMENTS.md)
- [Search Usage Guide](./additional_readme/SEARCH_USAGE_GUIDE.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Spotify** for their comprehensive Web API and Web Playback SDK
- **Material-UI** for the excellent React component library
- **Vite** for the fast development experience
- **React Team** for the powerful frontend framework

