import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../context/player';

const Icon = ({ name }: { name: 'play' | 'pause' | 'next' | 'prev' }) => {
  if (name === 'play')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3.868v16.264A1 1 0 0 0 6.52 21.02L20.5 12.5a1 1 0 0 0 0-1.732L6.52 2.98A1 1 0 0 0 5 3.868z" fill="currentColor" />
      </svg>
    );
  if (name === 'pause')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4h3v16H6zM15 4h3v16h-3z" fill="currentColor" />
      </svg>
    );
  if (name === 'next')
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18l8.5-6L6 6v12zm9-12h2v12h-2z" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L9.5 12 18 18V6zM7 6h2v12H7z" fill="currentColor" />
    </svg>
  );
};

const formatTime = (ms: number) => {
  if (!ms || ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const Player: React.FC = () => {
  const { current, playing, pause, resume, positionMs, durationMs, seek, next, previous, setVolume } = usePlayer();
  const [localPos, setLocalPos] = useState(positionMs);
  const [isSeeking, setIsSeeking] = useState(false);
  const [vol, setVol] = useState(1);
  const progressRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isSeeking) setLocalPos(positionMs);
  }, [positionMs, isSeeking]);

  if (!current) return null;


  return (
    <div className="music-player-bar">
      {/* Track Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative">
          <img 
            src={current.album.images?.[0]?.url} 
            alt="art" 
            className={`w-12 h-12 rounded ${playing ? 'playing-animation' : ''}`} 
          />
          {playing && (
            <div className="absolute inset-0 bg-spotify-green/20 rounded"></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-white truncate text-sm">{current.name}</div>
          <div className="text-muted-dark truncate text-xs">{current.artists?.[0]?.name}</div>
        </div>
        <button className="btn-ghost-dark p-1.5 hidden sm:block">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </button>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-lg">
        <div className="flex items-center gap-3">
          <button onClick={previous} className="btn-ghost-dark p-1.5" title="Previous">
            <Icon name="prev" />
          </button>
          {playing ? (
            <button onClick={pause} className="btn-spotify w-8 h-8 p-0 justify-center" title="Pause">
              <Icon name="pause" />
            </button>
          ) : (
            <button onClick={resume} className="btn-spotify w-8 h-8 p-0 justify-center" title="Play">
              <Icon name="play" />
            </button>
          )}
          <button onClick={next} className="btn-ghost-dark p-1.5" title="Next">
            <Icon name="next" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full">
          <div className="text-xs text-muted-dark font-mono w-10 text-right">{formatTime(localPos)}</div>
          <input
            ref={progressRef}
            type="range"
            min={0}
            max={durationMs || 0}
            value={localPos}
            onChange={e => {
              setLocalPos(Number(e.target.value));
              setIsSeeking(true);
            }}
            onMouseUp={async () => {
              setIsSeeking(false);
              await seek(localPos);
            }}
            className="progress-bar flex-1"
          />
          <div className="text-xs text-muted-dark font-mono w-10">{formatTime(durationMs)}</div>
        </div>
      </div>

      {/* Volume & Additional Controls */}
      <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
        <button className="btn-ghost-dark p-1.5 hidden lg:block">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 18V5l12-2v13M9 13l12-2" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </button>
        <div className="items-center gap-2 flex">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-dark">
            <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={vol}
            onChange={e => {
              const v = Number(e.target.value);
              setVol(v);
              setVolume(v).catch(() => {});
            }}
            className="volume-slider"
          />
          <div className="text-xs text-white font-mono w-8 text-center">{Math.round(vol * 100)}</div>
        </div>
        <button className="btn-ghost-dark p-1.5 hidden md:block">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 4h4v4H6zM14 4h4v4h-4zM6 14h4v4H6zM14 14h4v4h-4z" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Player;
