/**
 * Dedicated Recommendations Page
 * Full-featured page for displaying AI-powered music recommendations
 * with comprehensive music profile analysis
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { useMusicIntelligence } from '../hooks/useMusicIntelligence';
import type { PlaylistRecommendation} from '../services/musicIntelligenceService';
import { formatCount } from '../utils/numberFormat';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Tooltip, Fade, Grow, Skeleton } from '@mui/material';

const Recommendations: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const { recommendations, insights, isLoading, error, refreshRecommendations, clearError } = useMusicIntelligence();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showAllGenres, setShowAllGenres] = React.useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handlePlaylistPlay = async (recommendation: PlaylistRecommendation) => {
    try {
      navigate(`/playlist/${recommendation.playlist.id}`);
      toast.showToast(`Opening ${recommendation.playlist.name}`, 'success');
    } catch (error) {
      console.error('Play playlist error:', error);
      toast.showToast('Unable to open playlist', 'error');
    }
  };

  const handleRefresh = () => {
    clearError();
    refreshRecommendations();
  };

  const getScoreGradient = (score: number): string => {
    if (score >= 80) return 'from-violet-500 to-purple-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const getSimilarityIcon = (type: string): string => {
    switch (type) {
      case 'genre': return '🎵';
      case 'artist': return '🎤';
      case 'popularity': return '⭐';
      case 'user_pattern': return '🎯';
      default: return '💡';
    }
  };

  const getSimilarityTypeLabel = (type: string): string => {
    switch (type) {
      case 'genre': return 'Genre Match';
      case 'artist': return 'Artist Similarity';
      case 'popularity': return 'Popularity Based';
      case 'user_pattern': return 'Personal Pattern';
      default: return 'AI Recommendation';
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHomeClick={() => navigate('/dashboard')}
      />
      <Header 
        onSearch={(query) => console.log('Search:', query)}
        onMobileMenuToggle={() => setSidebarOpen(true)}
      />
      
      <div className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative w-full py-10 px-2 sm:px-8 lg:px-12 space-y-8">
          {/* Header */}
          <Fade in timeout={600}>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowBackIcon className="text-white" />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
                  <span className="text-4xl">🎯</span>
                  Smart Music Recommendations
                </h1>
                <p className="text-gray-400 mt-2">
                  AI-powered analysis and personalized playlist suggestions
                </p>
              </div>
              <Tooltip title="Refresh recommendations">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isLoading}
                  sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' } }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </div>
          </Fade>

          {/* Comprehensive Music Profile Analysis */}
          {insights && !isLoading && (
            <Fade in timeout={800}>
              <div className="space-y-6">
                {/* Profile Overview */}
                <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/20 backdrop-blur-lg p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🎵</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Your Music DNA</h2>
                      <p className="text-gray-400 text-sm">Comprehensive analysis of your listening patterns</p>
                    </div>
                  </div>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 rounded-2xl p-4 border border-violet-500/20">
                      <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-3">
                        <span className="text-2xl">🎵</span>
                      </div>
                      <div className="text-violet-400 font-mono text-2xl font-bold mb-1">
                        {insights.topGenres[0]?.genre || 'Mixed'}
                      </div>
                      <div className="text-gray-400 text-xs">Top Genre</div>
                      {insights.topGenres[0] && (
                        <div className="mt-2 text-xs text-violet-300">
                          {insights.topGenres[0].percentage}% of your music
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-blue-500/20">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
                        <span className="text-2xl">🎨</span>
                      </div>
                      <div className="text-blue-400 font-mono text-2xl font-bold mb-1">
                        {insights.artistDiversity}%
                      </div>
                      <div className="text-gray-400 text-xs">Artist Diversity</div>
                      <div className="mt-2 text-xs text-blue-300">
                        {insights.artistDiversity > 70 ? 'Very diverse' : insights.artistDiversity > 40 ? 'Moderate' : 'Focused'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-purple-500/20">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <div className="text-purple-400 font-mono text-2xl font-bold mb-1">
                        {insights.discoveryRate}%
                      </div>
                      <div className="text-gray-400 text-xs">Discovery Rate</div>
                      <div className="mt-2 text-xs text-purple-300">
                        {insights.discoveryRate > 70 ? 'Explorer' : insights.discoveryRate > 40 ? 'Balanced' : 'Loyalist'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-yellow-500/20">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-3">
                        <span className="text-2xl">⭐</span>
                      </div>
                      <div className="text-yellow-400 font-mono text-2xl font-bold mb-1 capitalize">
                        {insights.popularityBias}
                      </div>
                      <div className="text-gray-400 text-xs">Music Style</div>
                      <div className="mt-2 text-xs text-yellow-300">
                        {insights.popularityBias === 'mainstream' ? 'Chart hits' : insights.popularityBias === 'underground' ? 'Hidden gems' : 'Best of both'}
                      </div>
                    </div>
                  </div>

                  {/* Listening Patterns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-gray-400 text-xs mb-2">Avg Track Length</div>
                      <div className="text-white font-mono text-lg font-bold">
                        {formatDuration(insights.listeningPatterns.averageTrackLength)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {insights.listeningPatterns.averageTrackLength > 240000 ? 'Long tracks' : insights.listeningPatterns.averageTrackLength > 180000 ? 'Standard' : 'Short & sweet'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-gray-400 text-xs mb-2">Explicit Content</div>
                      <div className="text-white font-mono text-lg font-bold">
                        {insights.listeningPatterns.explicitContentRatio}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {insights.listeningPatterns.explicitContentRatio > 50 ? 'High' : insights.listeningPatterns.explicitContentRatio > 20 ? 'Moderate' : 'Low'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-gray-400 text-xs mb-2">Era Preference</div>
                      <div className="text-white font-mono text-lg font-bold capitalize">
                        {insights.listeningPatterns.recentVsOld}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {insights.listeningPatterns.recentVsOld === 'recent' ? 'New releases' : insights.listeningPatterns.recentVsOld === 'classic' ? 'Timeless hits' : 'All eras'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Genre Breakdown */}
                <div className="bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🎼</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Genre Distribution</h3>
                        <p className="text-gray-400 text-sm">Your top {showAllGenres ? insights.topGenres.length : 5} music genres</p>
                      </div>
                    </div>
                    {insights.topGenres.length > 5 && (
                      <button
                        onClick={() => setShowAllGenres(!showAllGenres)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/10 flex items-center gap-2"
                      >
                        {showAllGenres ? (
                          <>
                            <span>Show Less</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>View All ({insights.topGenres.length})</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {insights.topGenres.slice(0, showAllGenres ? insights.topGenres.length : 5).map((genreData, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <span className="text-white font-medium capitalize">{genreData.genre}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm">{Math.round(genreData.count)} tracks</span>
                            <span className="text-violet-400 font-mono text-sm min-w-[3rem] text-right">
                              {genreData.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${genreData.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Fade>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <Skeleton 
                variant="rectangular" 
                animation="wave"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.05)', 
                  borderRadius: '1.5rem',
                  height: '400px'
                }} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    variant="rectangular" 
                    animation="wave"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      borderRadius: '1rem',
                      height: '320px'
                    }} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8 text-center backdrop-blur-sm">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-red-400 text-lg mb-4">{error}</div>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Recommendations Section */}
          {!isLoading && !error && recommendations.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Personalized Playlists</h2>
                  <p className="text-gray-400 text-sm">{recommendations.length} playlists matched to your taste</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((recommendation, index) => (
                  <Grow key={recommendation.playlist.id} in timeout={400 + (index * 50)}>
                    <div
                      className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-5 border border-white/10 hover:border-purple-500/40 hover:from-white/15 hover:to-white/10 transition-all group cursor-pointer"
                      onClick={() => navigate(`/playlist/${recommendation.playlist.id}`)}
                    >
                      {/* Playlist Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={recommendation.playlist.images[0]?.url || '/vite.svg'}
                            alt={recommendation.playlist.name}
                            className="w-20 h-20 rounded-xl object-cover shadow-lg"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaylistPlay(recommendation);
                            }}
                            className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <PlayArrowIcon sx={{ color: 'white', fontSize: 32 }} />
                          </button>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base truncate mb-1 group-hover:text-purple-300 transition-colors">
                            {recommendation.playlist.name}
                          </h3>
                          <p className="text-gray-400 text-xs mb-2">
                            {formatCount(recommendation.playlist.followers?.total ?? 0)} followers
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{getSimilarityIcon(recommendation.similarityType)}</span>
                            <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                              {getSimilarityTypeLabel(recommendation.similarityType)}
                            </span>
                            {/* Match Score Badge beside type label */}
                            <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full bg-gradient-to-r ${getScoreGradient(recommendation.score)} text-white shadow-md`}>
                              {recommendation.score}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation Reasons */}
                      <div className="space-y-2 mb-4">
                        <h4 className="text-gray-300 font-medium text-xs">Why you'll love this:</h4>
                        {recommendation.reasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="text-xs text-gray-300 bg-white/5 rounded-lg px-3 py-2 flex items-start gap-2">
                            <span className="text-violet-400">•</span>
                            <span className="flex-1">{reason}</span>
                          </div>
                        ))}
                      </div>

                      {/* Matching Genres */}
                      {/* Matching Genres */}
                      {recommendation.matchingGenres.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="flex flex-wrap gap-1.5">
                            {recommendation.matchingGenres.slice(0, 4).map((genre, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30"
                              >
                                {genre}
                              </span>
                            ))}
                            {recommendation.matchingGenres.length > 4 && (
                              <span className="text-xs text-gray-400 px-2 py-1">
                                +{recommendation.matchingGenres.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Grow>
                ))}
              </div>
            </div>
          )}



          {/* Empty State */}
          {!isLoading && !error && recommendations.length === 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-12 text-center">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Recommendations Yet</h2>
              <p className="text-gray-400 mb-6">
                Listen to more music on Spotify to get personalized playlist recommendations
              </p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white rounded-lg font-medium transition-colors"
              >
                Generate Recommendations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;