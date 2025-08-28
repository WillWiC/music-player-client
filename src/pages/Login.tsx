import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
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
      await login();
    } finally {
      setIsButtonLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto animate-pulse shadow-lg"></div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Alternative Spotify Music Player
            </h1>
            <p className="text-gray-400 text-lg">
              Connect your Spotify account to start your musical journey
            </p>
          </div>

          {/* Login Button */}
          <div className="space-y-6">
            <button
              onClick={handleLogin}
              disabled={isButtonLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-green-500/25 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
            >
              {isButtonLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
                  Connecting...
                </>
              ) : (
                "Continue with Spotify"
              )}
            </button>

            {/* Features Section */}
            <div className="space-y-4">
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-white font-semibold mb-4 text-center">What you can do:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Stream your favorite music</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Control playback from anywhere</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Discover new music</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-yellow-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <p className="text-yellow-400 text-sm font-medium">Spotify Premium Required</p>
                  <p className="text-yellow-300/80 text-xs mt-1">
                    You need an active Spotify Premium subscription to use playback features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Secure authentication powered by Spotify
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
