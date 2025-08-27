const Login = () => {
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = "http://localhost:5173/callback";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";

  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <a
        href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private user-read-email`}
        className="px-6 py-3 bg-green-500 rounded-lg shadow-lg"
      >
        Login with Spotify
      </a>
    </div>
  );
};
export default Login;
