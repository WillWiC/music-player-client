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
  const { current, playing, pause, positionMs, durationMs, seek, next, previous, setVolume } = usePlayer();
  const [localPos, setLocalPos] = useState(positionMs);
  const [isSeeking, setIsSeeking] = useState(false);
  const [vol, setVol] = useState(1);
  const progressRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isSeeking) setLocalPos(positionMs);
  }, [positionMs, isSeeking]);

  if (!current) return null;


  return (
    <div className="player-bar">
      <img src={current.album.images?.[0]?.url} alt="art" className="w-14 h-14 rounded-md" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 truncate">{current.name}</div>
        <div className="text-sm text-slate-600 truncate">{current.artists?.[0]?.name}</div>
        <div className="mt-2 flex items-center gap-3">
          <div className="text-xs muted">{formatTime(localPos)}</div>
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
            className="w-full"
          />
          <div className="text-xs muted">{formatTime(durationMs)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={previous} className="btn-ghost" title="Previous">
          <Icon name="prev" />
        </button>
        {playing ? (
          <button onClick={pause} className="btn-primary" title="Pause">
            <Icon name="pause" />
          </button>
        ) : (
          <button className="btn-primary" title="Play">
            <Icon name="play" />
          </button>
        )}
        <button onClick={next} className="btn-ghost" title="Next">
          <Icon name="next" />
        </button>

        <div className="flex items-center gap-2">
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
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};

export default Player;
