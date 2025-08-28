import React from 'react';
import { usePlayer } from '../context/player';

const Player: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    position, 
    duration, 
    volume, 
    togglePlay, 
    nextTrack, 
    previousTrack, 
    seek, 
    setVolume 
  } = usePlayer();

  // Format time in mm:ss
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPosition = (clickX / width) * duration;
    seek(newPosition);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-4 text-gray-400">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">No track playing</div>
              <div className="text-xs">Play a song to see controls here</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            className="w-full h-1 bg-gray-700 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300 group-hover:bg-green-400"
              style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <img 
              src={currentTrack.album?.images?.[0]?.url} 
              alt={`${currentTrack.name} cover`}
              className="w-12 h-12 rounded-lg object-cover shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-semibold text-sm truncate hover:text-green-400 transition-colors cursor-pointer">
                {currentTrack.name}
              </h4>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack.artists?.map(artist => artist.name).join(', ')}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-mono">
              <span>{formatTime(position)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Previous Track */}
            <button 
              onClick={previousTrack}
              className="p-2 text-gray-400 hover:text-white transition-colors hover:scale-110 transform"
              title="Previous track"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="w-10 h-10 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next Track */}
            <button 
              onClick={nextTrack}
              className="p-2 text-gray-400 hover:text-white transition-colors hover:scale-110 transform"
              title="Next track"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 10l4-4v4h4l-4 4v-4H6z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
              }}
            />
            <span className="text-xs text-gray-400 font-mono w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Mobile Time Display */}
          <div className="flex sm:hidden items-center gap-2 text-xs text-gray-400 font-mono">
            <span>{formatTime(position)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
