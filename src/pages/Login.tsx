import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth';
import { useNavigate } from 'react-router-dom';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-spotify-green border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-spotify-green rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-32 -left-28 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-2xl opacity-10" />
      </div>

      <div className="relative z-10 max-w-3xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-gradient-to-br from-gray-800/60 to-black/40 backdrop-blur-md border border-gray-700 rounded-3xl p-8 shadow-2xl">
          {/* Left: Brand */}
          <div className="text-center md:text-left px-4">

            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">Spotify Lite</h1>
              <p className="text-gray-400 text-sm md:text-base">A lightweight, minimal player built on the Spotify API</p>
            </div>

            <p className="text-gray-300 mt-2">Sign in to access your playlists and control playback.</p>

            <div className="mt-6">
              <button
                onClick={handleLogin}
                disabled={isButtonLoading}
                className="w-full md:w-auto inline-flex items-center gap-3 bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 text-black font-semibold py-3 px-5 rounded-lg transition-transform transform hover:scale-105 disabled:cursor-not-allowed shadow-md"
              >
                {isButtonLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>Sign in with Spotify</>
                )}
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-400">
              <ul className="space-y-1">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mt-1 flex-shrink-0" />
                  <span><strong className="text-white">Note:</strong> Playback requires Spotify Premium. You can still browse and discover music without a subscription.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Features / Illustration */}
          <div className="px-4">
            <div className="bg-gradient-to-tr from-white/5 to-white/2 border border-gray-700 rounded-2xl p-6 h-full flex flex-col justify-center">
              <h3 className="text-white font-semibold mb-4">What Spotify Lite gives you</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-spotify-green rounded-full mt-1 flex-shrink-0" />
                  <span className="text-sm">Fast, minimal UI focused on listening.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-spotify-green rounded-full mt-1 flex-shrink-0" />
                  <span className="text-sm">Control playback across devices.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-spotify-green rounded-full mt-1 flex-shrink-0" />
                  <span className="text-sm">Discover curated playlists and recommendations.</span>
                </li>
              </ul>

              <div className="mt-6 text-xs text-gray-500">By signing in you agree to Spotify's Terms and the app's privacy policy. Authentication is handled by Spotify.</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">Secure authentication via Spotify • Built with Spotify Web API</p>
        </div>
      </div>
    </div>
  );
};

export default SpotifyLite;
