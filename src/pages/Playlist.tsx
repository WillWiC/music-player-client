import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// ...existing code... (no type import needed here)
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';

const PlaylistPage: React.FC = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<any | null>(null);
  const { token } = useAuth();
  const { play } = usePlayer();

  useEffect(() => {
    if (!id || !token) return;
    fetch(`https://api.spotify.com/v1/playlists/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setPlaylist(data))
      .catch(() => setPlaylist(null));
  }, [id, token]);

  if (!playlist) return (
    <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 text-center">
      <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <div className="text-white">Loading playlist...</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Playlist Header */}
      <div className="flex items-start space-x-6 mb-8 p-6 music-card">
        <div className="relative group">
          <img 
            src={playlist.images?.[0]?.url} 
            alt="cover" 
            className="cover-img rounded-lg shadow-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="black">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm text-spotify-green uppercase font-medium mb-2">Playlist</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 break-words">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-muted-dark mb-4 text-sm">{playlist.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-dark">
            <span>{playlist.owner?.display_name}</span>
            <span>•</span>
            <span>{playlist.tracks?.total} songs</span>
          </div>
        </div>
      </div>

      {/* Play Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button className="btn-ghost-dark p-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className="btn-ghost-dark p-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
            <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
            <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      {/* Track List Header */}
      <div className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 text-sm text-muted-dark border-b border-gray-700 mb-2">
        <div>#</div>
        <div>Title</div>
        <div>Album</div>
        <div className="text-right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {playlist.tracks?.items?.map((item: any, index: number) => (
          <div key={item.track.id} className="track-item-dark group grid grid-cols-[16px_4fr_2fr_1fr] gap-4 items-center px-4 py-2 rounded">
            <div className="text-muted-dark text-sm group-hover:hidden">
              {index + 1}
            </div>
            <button 
              onClick={() => play(item.track)}
              className="hidden group-hover:block w-4 h-4 text-white hover:text-spotify-green"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={item.track.album?.images?.[0]?.url} 
                alt="track cover" 
                className="w-10 h-10 object-cover rounded" 
              />
              <div className="min-w-0">
                <div className="font-medium text-white truncate">{item.track.name}</div>
                <div className="text-sm text-muted-dark truncate">{item.track.artists[0].name}</div>
              </div>
            </div>
            
            <div className="text-sm text-muted-dark truncate">{item.track.album.name}</div>
            
            <div className="flex items-center justify-end gap-2">
              <button className="btn-ghost-dark p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              <div className="text-sm text-muted-dark">
                {Math.floor(item.track.duration_ms / 60000)}:{String(Math.floor((item.track.duration_ms % 60000) / 1000)).padStart(2, '0')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistPage;

