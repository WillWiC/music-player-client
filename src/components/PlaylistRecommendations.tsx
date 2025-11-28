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
import { CircularProgress, Tooltip, useMediaQuery, useTheme, Grow } from '@mui/material';
import NavigationButton from './NavigationButton';

const PlaylistRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const { recommendations, insights, isLoading, error, refreshRecommendations, clearError } = useMusicIntelligence();
  const [, setLastRefreshTime] = React.useState<number | null>(null);
  const [startIndex, setStartIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Responsive card count based on screen size
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));  // < 600px
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-900px
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 900-1200px
  
  const visibleCount = isXs ? 3 : isSm ? 4 : isMd ? 5 : 6;
  const maxStartIndex = Math.max(0, (recommendations?.length || 0) - visibleCount);
  
  // Navigation with animation
  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setStartIndex(s => Math.max(0, s - visibleCount));
    setTimeout(() => setIsAnimating(false), 260);
  };
  const handleNext = () => {
    if (isAnimating) return;
    if (startIndex >= maxStartIndex) return;
    setIsAnimating(true);
    setStartIndex(s => Math.min(s + visibleCount, maxStartIndex));
    setTimeout(() => setIsAnimating(false), 260);
  };

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
    <div className="w-full space-y-4">
      {/* Compact Header Row */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h2 className="text-base sm:text-lg font-bold text-white">For You</h2>
          {insights && (
            <span className="text-[10px] text-gray-500 hidden sm:inline">
              {insights.topGenres[0]?.genre} · {insights.discoveryRate}% new
            </span>
          )}
        </div>

        {/* Right side: Nav + Actions */}
        <div className="flex items-center gap-1">
          {/* Navigation Buttons */}
          {recommendations && recommendations.length > visibleCount && (
            <>
              <NavigationButton
                direction="left"
                onClick={handlePrev}
                disabled={startIndex <= 0 || isAnimating}
                size="small"
              />
              <NavigationButton
                direction="right"
                onClick={handleNext}
                disabled={startIndex >= maxStartIndex || isAnimating}
                size="small"
              />
            </>
          )}
          
          <Tooltip title="Refresh">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <RefreshIcon sx={{ fontSize: 16 }} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
          
          <Tooltip title="View music profile">
            <button 
              onClick={() => navigate('/recommendations')}
              className="p-1 text-gray-500 hover:text-violet-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>
      {/* Cards Row - responsive grid */}
      <div className={`grid grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 sm:gap-4 transition-all duration-300 ease-in-out ${isAnimating ? 'opacity-75 transform scale-95' : 'opacity-100 transform scale-100'}`}>
        {recommendations.slice(startIndex, startIndex + visibleCount).map((rec, index) => (
          <Grow in timeout={300 + index * 50} key={`${rec.playlist.id}-${startIndex}`}>
           <div 
             className={`group cursor-pointer transition-all duration-300 ease-out ${isAnimating ? 'animate-pulse' : ''}`}
             style={{ 
               animationDelay: `${index * 50}ms`,
               transform: isAnimating ? 'translateY(10px)' : 'translateY(0px)'
             }}
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
                       className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-500 hover:bg-violet-400 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all translate-y-4 group-hover:translate-y-0 duration-300"
                     >
                       <PlayArrowIcon className="text-white" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                     </button>
                  </div>
                  
                  {/* Score Badge */}
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 px-1 sm:px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[8px] sm:text-[10px] font-bold text-violet-400 border border-violet-500/30 shadow-lg">
                     {rec.score}%
                  </div>
               </div>

               {/* Text Content */}
               <div className="p-2 sm:p-3">
                  <h3 className="font-semibold text-white truncate text-xs sm:text-sm mb-0.5 sm:mb-1" title={rec.playlist.name}>
                    {rec.playlist.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2 leading-relaxed h-6 sm:h-8">
                     {rec.reasons.join(' • ')}
                  </p>
               </div>
             </div>
           </div>
          </Grow>
        ))}
      </div>
    </div>
  );
};

export default PlaylistRecommendations;