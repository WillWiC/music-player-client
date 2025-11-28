import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth';
import { useNavigate } from 'react-router-dom';
import SpotifyIcon from '../components/SpotifyIcon';

const SpotifyLite: React.FC = () => {
  const { token, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleLogin = async () => {
    setIsButtonLoading(true);
    try {
      console.log('Starting login process...');
      console.log('Environment variables:', {
        CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID ? 'Set' : 'Missing',
        REDIRECT_URI: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'Using default'
      });
      await login();
    } finally {
      setIsButtonLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-dark-bg via-gray-900 to-black px-4" style={{ minHeight: '100dvh' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-spotify-green border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-lg sm:text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-3 sm:px-4 py-8 sm:py-4" style={{ minHeight: '100dvh' }}>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 bg-spotify-green rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-32 -left-28 w-56 sm:w-80 h-56 sm:h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-2xl opacity-10" />
      </div>

      <div className="relative z-10 max-w-3xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center bg-gradient-to-br from-gray-800/60 to-black/40 backdrop-blur-md border border-gray-700 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
          {/* Left: Brand */}
          <div className="text-center md:text-left px-2 sm:px-4">

            <div className="mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">Flowbeats</h1>
              <p className="text-gray-400 text-xs sm:text-sm">A lightweight, minimal player built on the Spotify API</p>
            </div>

            <p className="text-gray-300 mt-2 text-sm sm:text-base">Sign in to access your playlists and control playback.</p>

            <div className="mt-4 sm:mt-6 space-y-3">
              <button
                onClick={handleLogin}
                disabled={isButtonLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 text-black font-semibold py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg transition-transform transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-md text-sm sm:text-base"
              >
                {isButtonLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-black border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <SpotifyIcon size={18} />
                    Sign in with Spotify
                  </>
                )}
              </button>

              {/* Explore as guest removed from Login page - guests should use the Dashboard welcome card to enter guest mode */}
            </div>

            <div className="mt-4 sm:mt-6 text-xs text-gray-400">
              <ul className="space-y-1">
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full mt-1 flex-shrink-0" />
                  <span>Playback requires Spotify Premium. You can still browse and discover music without a subscription.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Features / Illustration */}
          <div className="px-2 sm:px-4">
            <div className="bg-gradient-to-tr from-white/5 to-white/2 border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 h-full flex flex-col justify-center">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">What Spotify Lite gives you</h3>
              <ul className="space-y-2 sm:space-y-3 text-gray-300">
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-spotify-green rounded-full mt-1.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Fast, minimal UI focused on listening.</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-spotify-green rounded-full mt-1.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Control playback across devices.</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-spotify-green rounded-full mt-1.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Discover curated playlists and recommendations.</span>
                </li>
              </ul>

            </div>
          </div>
        </div>

        <div className="text-center mt-4 sm:mt-6">
          <p className="text-gray-500 text-xs sm:text-sm">Secure authentication via Spotify • Built with Spotify Web API</p>
        </div>
      </div>
    </div>
  );
};

export default SpotifyLite;
