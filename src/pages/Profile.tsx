import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useSpotifyApi, buildSpotifyUrl } from '../hooks/useSpotifyApi';
import { useToast } from '../context/toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Avatar, Typography, CircularProgress, Grow } from '@mui/material';
import { MusicNote } from '@mui/icons-material';
import type { User, Playlist } from '../types/spotify';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { makeRequest } = useSpotifyApi();
  const toast = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!id || !token) return;

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const { data: userData, error: userError } = await makeRequest(buildSpotifyUrl(`users/${id}`));
        
        if (userError || !userData) {
          throw new Error('Failed to fetch user profile');
        }
        setUser(userData);

        // Fetch user's public playlists
        const { data: playlistsData, error: playlistsError } = await makeRequest(
          buildSpotifyUrl(`users/${id}/playlists`)
        );

        if (playlistsData && !playlistsError) {
          setPlaylists(playlistsData.items || []);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, token, makeRequest, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <CircularProgress color="success" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Typography variant="h5">User not found</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onHomeClick={() => navigate('/dashboard')}
      />
      
      <div className="flex-1 flex flex-col lg:ml-72 relative">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        
        <main className="flex-1 pb-24">
          {/* Header Section */}
          <div className="relative pt-32 pb-8 px-8 md:px-12 bg-gradient-to-b from-gray-800 to-black">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              <Avatar 
                src={user.images?.[0]?.url} 
                alt={user.display_name || 'User'}
                sx={{ width: 232, height: 232, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
              >
                {(user.display_name || 'U')[0]}
              </Avatar>
              
              <div className="flex flex-col items-center md:items-start gap-4">
                <span className="uppercase text-xs font-bold tracking-wider text-white/80">
                  Profile
                </span>
                <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none">
                  {user.display_name}
                </h1>
                
                {user.followers && (
                  <span className="text-white/70">
                    {user.followers.total.toLocaleString()} followers
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Public Playlists */}
          <div className="px-8 md:px-12 py-8">
            <h2 className="text-2xl font-bold text-white mb-6">Public Playlists</h2>
            
            {playlists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {playlists.map((playlist, index) => (
                  <Grow key={playlist.id} in timeout={300 + (index * 50)}>
                    <div 
                      className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-all cursor-pointer group"
                      onClick={() => navigate(`/playlist/${playlist.id}`)}
                    >
                      <div className="relative aspect-square mb-4 shadow-lg rounded-md overflow-hidden bg-gray-800">
                        {playlist.images?.[0]?.url ? (
                          <img 
                            src={playlist.images[0].url} 
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MusicNote className="text-white/20" sx={{ fontSize: 48 }} />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-white truncate mb-1">{playlist.name}</h3>
                      <p className="text-sm text-white/50 line-clamp-2">
                        By {playlist.owner.display_name}
                      </p>
                    </div>
                  </Grow>
                ))}
              </div>
            ) : (
              <div className="text-white/50">No public playlists found.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
