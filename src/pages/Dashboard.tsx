import { useEffect, useState } from "react";

interface UserProfile {
  display_name: string;
  images: { url: string }[];
}

const Dashboard = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const token = localStorage.getItem("spotify_token");

  useEffect(() => {
    if (!token) return;
    fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setUser(data));
  }, [token]);

  return (
    <div className="p-6">
      {user && (
        <div className="flex items-center space-x-4">
          <img
            src={user.images?.[0]?.url}
            alt="profile"
            className="w-16 h-16 rounded-full"
          />
          <h1 className="text-xl font-bold">Welcome, {user.display_name}</h1>
        </div>
      )}
      <h2 className="mt-6 text-lg font-semibold">Featured Playlists</h2>
      {/* TODO: map over playlists */}
    </div>
  );
};
export default Dashboard;
