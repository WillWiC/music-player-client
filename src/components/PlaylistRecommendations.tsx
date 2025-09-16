/**
 * Smart Playlist Recommendations Component
 * Displays AI-powered playlist suggestions based on user's music taste
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/toast';
import { useMusicIntelligence } from '../hooks/useMusicIntelligence';
import type { PlaylistRecommendation } from '../services/musicIntelligenceService';
import { formatCount } from '../utils/numberFormat';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';

const PlaylistRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { recommendations, insights, isLoading, error, refreshRecommendations, clearError } = useMusicIntelligence();

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

  if (!recommendations || !Array.isArray(recommendations) || !recommendations.length) {
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
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black rounded-lg font-medium transition-colors"
          >
            Generate Recommendations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            Smart Playlist Recommendations
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Curated for your music taste • Based on {insights?.topGenres.length || 0} genres
          </p>
        </div>
        <Tooltip title="Refresh recommendations">
          <IconButton
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* Music Insights Summary */}
      {insights && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Your Music Profile</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <div className="text-green-400 font-mono text-lg">{insights.topGenres[0]?.genre || 'Mixed'}</div>
              <div className="text-gray-400">Top Genre</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-mono text-lg">{insights.artistDiversity}%</div>
              <div className="text-gray-400">Diversity</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-mono text-lg">{insights.discoveryRate}%</div>
              <div className="text-gray-400">Discovery</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-mono text-lg capitalize">{insights.popularityBias}</div>
              <div className="text-gray-400">Style</div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations
          .filter(rec => rec?.playlist?.id && rec?.playlist?.name)
          .slice(0, 9)
          .map((recommendation) => (
          <div
            key={recommendation.playlist.id}
            className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-green-500/30 hover:bg-white/10 transition-all group cursor-pointer"
            onClick={() => navigate(`/playlist/${recommendation.playlist.id}`)}
          >
            {/* Playlist Image and Info */}
            <div className="flex items-start gap-3 mb-3">
              <div className="relative">
                <img
                  src={recommendation.playlist.images[0]?.url || '/placeholder-playlist.png'}
                  alt={recommendation.playlist.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaylistPlay(recommendation);
                  }}
                  className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <PlayArrowIcon className="text-white text-lg" />
                </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white text-sm truncate">
                  {recommendation.playlist.name}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {recommendation.playlist.followers?.total 
                    ? formatCount(recommendation.playlist.followers.total) 
                    : '0'} followers
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">
                    {getSimilarityIcon(recommendation.similarityType)}
                  </span>
                  <span className={`text-xs font-mono ${getScoreColor(recommendation.score)}`}>
                    {recommendation.score}% match
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation Reasons */}
            <div className="space-y-1">
              {recommendation.reasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="text-xs text-gray-400 bg-white/5 rounded px-2 py-1">
                  {reason}
                </div>
              ))}
            </div>

            {/* Matching Genres */}
            {recommendation.matchingGenres.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {recommendation.matchingGenres.slice(0, 2).map((genre, index) => (
                  <span
                    key={index}
                    className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {recommendations.length > 9 && (
        <div className="text-center">
          <button
            onClick={() => navigate('/recommendations')}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/10"
          >
            View All {recommendations.length} Recommendations
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2 border-t border-white/10">
        <p className="text-xs text-gray-500">
          Recommendations update automatically every 30 minutes based on your listening activity
        </p>
      </div>
    </div>
  );
};

export default PlaylistRecommendations;