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
      <div className="min-h-[100dvh] bg-black flex items-center justify-center safe-area-bottom">
        <CircularProgress color="success" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white safe-area-bottom">
        <Typography variant="h5" className="text-lg sm:text-xl">User not found</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black flex safe-area-bottom">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onHomeClick={() => navigate('/dashboard')}
      />
      
      <div className="flex-1 flex flex-col xl:ml-80 relative">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        
        <main className="flex-1 pb-28">
          {/* Header Section */}
          <div className="relative pt-20 sm:pt-32 pb-6 sm:pb-8 px-4 sm:px-8 md:px-12 bg-gradient-to-b from-gray-800 to-black">
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:items-end md:gap-8">
              <Avatar 
                src={user.images?.[0]?.url} 
                alt={user.display_name || 'User'}
                sx={{ 
                  width: { xs: 160, sm: 200, md: 232 }, 
                  height: { xs: 160, sm: 200, md: 232 }, 
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5)' 
                }}
              >
                {(user.display_name || 'U')[0]}
              </Avatar>
              
              <div className="flex flex-col items-center md:items-start gap-2 sm:gap-4 text-center md:text-left">
                <span className="uppercase text-[10px] sm:text-xs font-bold tracking-wider text-white/80">
                  Profile
                </span>
                <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
                  {user.display_name}
                </h1>
                
                {user.followers && (
                  <span className="text-white/70 text-sm sm:text-base">
                    {user.followers.total.toLocaleString()} followers
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Public Playlists */}
          <div className="px-3 sm:px-6 md:px-12 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Public Playlists</h2>
            
            {playlists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {playlists.map((playlist, index) => (
                  <Grow key={playlist.id} in timeout={300 + (index * 50)}>
                    <div 
                      className="bg-white/5 p-2 sm:p-4 rounded-lg hover:bg-white/10 transition-all cursor-pointer group touch-target"
                      onClick={() => navigate(`/playlist/${playlist.id}`)}
                    >
                      <div className="relative aspect-square mb-2 sm:mb-4 shadow-lg rounded-md overflow-hidden bg-gray-800">
                        {playlist.images?.[0]?.url ? (
                          <img 
                            src={playlist.images[0].url} 
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MusicNote className="text-white/20" sx={{ fontSize: { xs: 32, sm: 48 } }} />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-white truncate mb-0.5 sm:mb-1 text-sm sm:text-base">{playlist.name}</h3>
                      <p className="text-xs sm:text-sm text-white/50 line-clamp-2">
                        By {playlist.owner.display_name}
                      </p>
                    </div>
                  </Grow>
                ))}
              </div>
            ) : (
              <div className="text-white/50 text-sm sm:text-base">No public playlists found.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
