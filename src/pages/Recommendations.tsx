/**
 * Dedicated Recommendations Page
 * Full-featured page for displaying AI-powered music recommendations
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/toast';
import { useMusicIntelligence } from '../hooks/useMusicIntelligence';
import type { PlaylistRecommendation } from '../services/musicIntelligenceService';
import { formatCount } from '../utils/numberFormat';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CircularProgress, IconButton, Tooltip, Chip } from '@mui/material';

const Recommendations: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { recommendations, insights, isLoading, error, refreshRecommendations, clearError } = useMusicIntelligence();

  const handlePlaylistPlay = async (recommendation: PlaylistRecommendation) => {
    try {
      navigate(`/playlist/${recommendation.playlist.id}`);
      toast.showToast(`Playing ${recommendation.playlist.name}`, 'success');
    } catch (error) {
      console.error('Play playlist error:', error);
      toast.showToast('Unable to play playlist', 'error');
    }
  };

  const handleRefresh = () => {
    clearError();
    refreshRecommendations();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-gray-400';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Sidebar />
      <Header />
      
      <div className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-7xl mx-auto py-10 px-2 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowBackIcon className="text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">🤖</span>
                Smart Playlist Recommendations
              </h1>
              <p className="text-gray-400 mt-2">
                AI-powered playlist suggestions curated for your music taste
              </p>
            </div>
            <Tooltip title="Refresh recommendations">
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-gray-400 hover:text-white"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>

          {/* Music Insights */}
          {insights && (
            <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Your Music Profile</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div className="text-green-400 font-mono text-lg font-bold">
                    {insights.topGenres[0]?.genre || 'Mixed'}
                  </div>
                  <div className="text-gray-400 text-sm">Top Genre</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <div className="text-blue-400 font-mono text-lg font-bold">{insights.artistDiversity}%</div>
                  <div className="text-gray-400 text-sm">Diversity Score</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div className="text-purple-400 font-mono text-lg font-bold">{insights.discoveryRate}%</div>
                  <div className="text-gray-400 text-sm">Discovery Rate</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="text-yellow-400 font-mono text-lg font-bold capitalize">{insights.popularityBias}</div>
                  <div className="text-gray-400 text-sm">Music Style</div>
                </div>
              </div>

              {/* Top Genres */}
              <div className="mt-6">
                <h3 className="text-white font-medium mb-3">Your Top Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {insights.topGenres.slice(0, 8).map((genreData, index) => (
                    <Chip
                      key={index}
                      label={`${genreData.genre} (${genreData.count})`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-12 text-center">
              <CircularProgress size={60} sx={{ color: '#22c55e' }} />
              <div className="text-white text-xl mt-4">Analyzing your music taste...</div>
              <div className="text-gray-400 text-sm mt-2">This may take a few moments</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8 text-center backdrop-blur-sm">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-red-400 text-lg mb-4">{error}</div>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Recommendations Grid */}
          {!isLoading && !error && recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation.playlist.id}
                  className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-green-500/30 hover:bg-white/10 transition-all group cursor-pointer"
                  onClick={() => navigate(`/playlist/${recommendation.playlist.id}`)}
                >
                  {/* Playlist Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={recommendation.playlist.images[0]?.url || '/placeholder-playlist.png'}
                        alt={recommendation.playlist.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaylistPlay(recommendation);
                        }}
                        className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <PlayArrowIcon className="text-white text-2xl" />
                      </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate mb-1">
                        {recommendation.playlist.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate mb-2">
                        {formatCount(recommendation.playlist.followers.total)} followers • {recommendation.playlist.tracks.total} tracks
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getSimilarityIcon(recommendation.similarityType)}
                        </span>
                        <span className={`text-sm font-mono font-bold ${getScoreColor(recommendation.score)}`}>
                          {recommendation.score}% match
                        </span>
                        <span className="text-xs text-gray-500">
                          {getSimilarityTypeLabel(recommendation.similarityType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Reasons */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-white font-medium text-sm">Why this matches you:</h4>
                    {recommendation.reasons.slice(0, 3).map((reason, index) => (
                      <div key={index} className="text-xs text-gray-300 bg-white/10 rounded-lg px-3 py-2">
                        {reason}
                      </div>
                    ))}
                  </div>

                  {/* Matching Genres */}
                  {recommendation.matchingGenres.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-white font-medium text-sm">Matching Genres:</h4>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.matchingGenres.map((genre, index) => (
                          <span
                            key={index}
                            className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black rounded-lg font-medium transition-colors"
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