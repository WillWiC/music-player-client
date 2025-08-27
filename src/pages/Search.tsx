import { useState } from "react";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const token = localStorage.getItem("spotify_token");

  const handleSearch = async () => {
    if (!query || !token) return;
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setResults(data.tracks.items);
  };

  return (
    <div className="p-6">
      <input
        type="text"
        placeholder="Search for songs..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border px-3 py-2 rounded w-2/3"
      />
      <button onClick={handleSearch} className="ml-2 px-4 py-2 bg-green-500 text-white rounded">
        Search
      </button>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {results.map(track => (
          <div key={track.id} className="p-4 bg-gray-100 rounded-lg">
            <img src={track.album.images[0].url} alt="album" className="rounded" />
            <p className="mt-2 font-semibold">{track.name}</p>
            <p className="text-sm text-gray-600">{track.artists[0].name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Search;
