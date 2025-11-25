/**
 * Smart Playlist Recommendations Component
 * Displays AI-powered playlist suggestions based on user's music taste
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/toast';
import { useMusicIntelligence } from '../hooks/useMusicIntelligence';
import type { PlaylistRecommendation } from '../services/musicIntelligenceService';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { CircularProgress, Tooltip } from '@mui/material';

const PlaylistRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { recommendations, insights, isLoading, error, refreshRecommendations, clearError } = useMusicIntelligence();
  const [, setLastRefreshTime] = React.useState<number | null>(null);

  const handlePlaylistPlay = async (recommendation: PlaylistRecommendation) => {
    try {
      // Navigate to playlist page to get tracks and start playing
      navigate(`/playlist/${recommendation.playlist.id}`);
      toast.showToast(`Playing ${recommendation.playlist.name}`, 'success');
    } catch (error) {
      console.error('Play playlist error:', error);
      toast.showToast('Unable to play playlist', 'error');
    }
  };

  const handleRefresh = async () => {
    const startTime = Date.now();
    clearError();
    await refreshRecommendations();
    setLastRefreshTime(Date.now() - startTime);
  };



  if (isLoading) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center py-8">
          <CircularProgress size={40} sx={{ color: '#22c55e' }} />
          <span className="ml-3 text-gray-300">Analyzing your music taste...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6">
        <div className="text-center py-6">
          <div className="text-red-400 mb-2">⚠️ {error}</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6">
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎵</div>
          <h3 className="text-lg font-medium text-white mb-2">No Recommendations Yet</h3>
          <p className="text-gray-400 mb-4">
            Listen to more music to get personalized playlist recommendations
          </p>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Recommendations'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header & Insights Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✨</span>
            <h2 className="text-xl font-bold text-white">For You</h2>
          </div>
          <p className="text-sm text-gray-400">
            AI-curated playlists based on your listening history
          </p>
        </div>

        {/* Insights Chips & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {insights && (
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-2">
                <span className="text-violet-400">●</span> {insights.topGenres.slice(0, 2).map(g => g.genre).join(' + ') || 'Mixed'}
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                {insights.discoveryRate}% Discovery
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 capitalize">
                {insights.popularityBias}
              </div>
            </div>
          )}
          
          <div className="h-6 w-px bg-white/10 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <Tooltip title="Refresh recommendations">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshIcon sx={{ fontSize: 16 }} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </Tooltip>
            
            <button 
              onClick={() => navigate('/recommendations')}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-colors whitespace-nowrap"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {recommendations.slice(0, 6).map((rec) => (
           <div 
             key={rec.playlist.id}
             className="group cursor-pointer"
             onClick={() => navigate(`/playlist/${rec.playlist.id}`)}
           >
             <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/5 to-white/5 border border-white/5 hover:border-violet-500/30 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
               {/* Image Container */}
               <div className="aspect-square relative">
                  <img 
                    src={rec.playlist.images[0]?.url || '/placeholder-playlist.png'} 
                    alt={rec.playlist.name}
                    className="w-full h-full object-cover" 
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handlePlaylistPlay(rec);
                       }}
                       className="w-12 h-12 bg-violet-500 hover:bg-violet-400 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all translate-y-4 group-hover:translate-y-0 duration-300"
                     >
                       <PlayArrowIcon className="text-white" sx={{ fontSize: 24 }} />
                     </button>
                  </div>
                  
                  {/* Score Badge */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-violet-400 border border-violet-500/30 shadow-lg">
                     {rec.score}%
                  </div>
               </div>

               {/* Text Content */}
               <div className="p-3">
                  <h3 className="font-semibold text-white truncate text-sm mb-1" title={rec.playlist.name}>
                    {rec.playlist.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed h-8">
                     {rec.reasons.join(' • ')}
                  </p>
               </div>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistRecommendations;