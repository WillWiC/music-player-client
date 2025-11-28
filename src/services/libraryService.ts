/**
 * Library Service
 * Handles Spotify library operations: saving/removing tracks, following/unfollowing playlists
 */

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface LibraryService {
  // Track operations
  checkSavedTracks: (trackIds: string[]) => Promise<boolean[]>;
  saveTrack: (trackId: string) => Promise<boolean>;
  removeTrack: (trackId: string) => Promise<boolean>;
  
  // Playlist follow operations
  checkFollowingPlaylists: (playlistIds: string[]) => Promise<boolean[]>;
  followPlaylist: (playlistId: string) => Promise<boolean>;
  unfollowPlaylist: (playlistId: string) => Promise<boolean>;
  
  // Add track to playlist
  addTrackToPlaylist: (playlistId: string, trackUri: string) => Promise<boolean>;
  removeTrackFromPlaylist: (playlistId: string, trackUri: string) => Promise<boolean>;
}

/**
 * Check if tracks are saved in user's library
 */
export const checkSavedTracks = async (token: string, trackIds: string[]): Promise<boolean[]> => {
  if (!token || trackIds.length === 0) return [];
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/tracks/contains?ids=${trackIds.join(',')}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to check saved tracks:', response.status);
      return trackIds.map(() => false);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking saved tracks:', error);
    return trackIds.map(() => false);
  }
};

/**
 * Save a track to user's library (Like)
 */
export const saveTrack = async (token: string, trackId: string): Promise<boolean> => {
  if (!token || !trackId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/tracks?ids=${trackId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error saving track:', error);
    return false;
  }
};

/**
 * Remove a track from user's library (Unlike)
 */
export const removeTrack = async (token: string, trackId: string): Promise<boolean> => {
  if (!token || !trackId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/tracks?ids=${trackId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error removing track:', error);
    return false;
  }
};

/**
 * Check if user follows playlists
 */
export const checkFollowingPlaylists = async (
  token: string, 
  playlistId: string,
  userId: string
): Promise<boolean> => {
  if (!token || !playlistId || !userId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/followers/contains?ids=${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to check playlist follow status:', response.status);
      return false;
    }
    
    const results = await response.json();
    return results[0] ?? false;
  } catch (error) {
    console.error('Error checking playlist follow status:', error);
    return false;
  }
};

/**
 * Follow a playlist (Add to library)
 */
export const followPlaylist = async (token: string, playlistId: string): Promise<boolean> => {
  if (!token || !playlistId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/followers`,
      {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ public: false })
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error following playlist:', error);
    return false;
  }
};

/**
 * Unfollow a playlist (Remove from library)
 */
export const unfollowPlaylist = async (token: string, playlistId: string): Promise<boolean> => {
  if (!token || !playlistId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/followers`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error unfollowing playlist:', error);
    return false;
  }
};

/**
 * Check if user has saved albums
 */
export const checkSavedAlbums = async (token: string, albumIds: string[]): Promise<boolean[]> => {
  if (!token || albumIds.length === 0) return [];
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/albums/contains?ids=${albumIds.join(',')}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to check saved albums:', response.status);
      return albumIds.map(() => false);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking saved albums:', error);
    return albumIds.map(() => false);
  }
};

/**
 * Save an album to user's library
 */
export const saveAlbum = async (token: string, albumId: string): Promise<boolean> => {
  if (!token || !albumId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/albums?ids=${albumId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error saving album:', error);
    return false;
  }
};

/**
 * Remove an album from user's library
 */
export const removeAlbum = async (token: string, albumId: string): Promise<boolean> => {
  if (!token || !albumId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/albums?ids=${albumId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error removing album:', error);
    return false;
  }
};

/**
 * Check if user follows artists
 */
export const checkFollowingArtists = async (token: string, artistIds: string[]): Promise<boolean[]> => {
  if (!token || artistIds.length === 0) return [];
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/following/contains?type=artist&ids=${artistIds.join(',')}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to check following artists:', response.status);
      return artistIds.map(() => false);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking following artists:', error);
    return artistIds.map(() => false);
  }
};

/**
 * Follow an artist
 */
export const followArtist = async (token: string, artistId: string): Promise<boolean> => {
  if (!token || !artistId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/following?type=artist&ids=${artistId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error following artist:', error);
    return false;
  }
};

/**
 * Unfollow an artist
 */
export const unfollowArtist = async (token: string, artistId: string): Promise<boolean> => {
  if (!token || !artistId) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/following?type=artist&ids=${artistId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error unfollowing artist:', error);
    return false;
  }
};

/**
 * Add a track to a playlist
 */
export const addTrackToPlaylist = async (
  token: string, 
  playlistId: string, 
  trackUri: string
): Promise<boolean> => {
  if (!token || !playlistId || !trackUri) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [trackUri] })
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return false;
  }
};

/**
 * Remove a track from a playlist
 */
export const removeTrackFromPlaylist = async (
  token: string, 
  playlistId: string, 
  trackUri: string
): Promise<boolean> => {
  if (!token || !playlistId || !trackUri) return false;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
      {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tracks: [{ uri: trackUri }] })
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    return false;
  }
};

/**
 * Get user's playlists (for adding tracks to)
 */
export const getUserPlaylists = async (token: string, limit = 50): Promise<any[]> => {
  if (!token) return [];
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/playlists?limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch user playlists:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    return [];
  }
};

/**
 * Create a new playlist
 */
export const createPlaylist = async (
  token: string,
  userId: string,
  name: string,
  description?: string,
  isPublic: boolean = false
): Promise<{ id: string; name: string } | null> => {
  if (!token || !userId || !name) return null;
  
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/users/${userId}/playlists`,
      {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name,
          description: description || '',
          public: isPublic
        })
      }
    );
    
    if (!response.ok) {
      console.error('Failed to create playlist:', response.status);
      return null;
    }
    
    const data = await response.json();
    return { id: data.id, name: data.name };
  } catch (error) {
    console.error('Error creating playlist:', error);
    return null;
  }
};

/**
 * Add multiple tracks to a playlist
 */
export const addTracksToPlaylist = async (
  token: string, 
  playlistId: string, 
  trackUris: string[]
): Promise<boolean> => {
  if (!token || !playlistId || trackUris.length === 0) return false;
  
  try {
    // Spotify API allows max 100 tracks per request
    const chunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100));
    }
    
    for (const chunk of chunks) {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: chunk })
        }
      );
      
      if (!response.ok) {
        console.error('Failed to add tracks to playlist:', response.status);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    return false;
  }
};
