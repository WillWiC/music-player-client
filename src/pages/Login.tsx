import React from 'react';

const Login: React.FC = () => {
  const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;
  // If an auth server is present, hit its /login endpoint (Authorization Code flow).
  // Otherwise fall back to client-side implicit auth to Spotify.
  if (AUTH_SERVER) {
    var href = `${AUTH_SERVER.replace(/\/$/, '')}/login`;
  } else {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI ?? 'http://localhost:5173/callback';
    const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
    const RESPONSE_TYPE = 'token';
    const SCOPES = ['user-read-private', 'user-read-email', 'playlist-read-private'].join(' ');

    href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Spotify Lite</h1>
        <p className="mb-4">A minimal Spotify client demo.</p>
        <a href={href} className="px-4 py-2 bg-green-500 text-white rounded">
          Login with Spotify
        </a>
      </div>
    </div>
  );
};

export default Login;
