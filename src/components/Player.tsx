import React from 'react';
import { usePlayer } from '../context/player';

const Player: React.FC = () => {
  const { current, playing, pause, deviceId } = usePlayer();
  if (!current) return null;

  return (
    <div className="player-bar">
      <img src={current.album.images?.[0]?.url} alt="art" className="w-14 h-14 rounded-md" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 truncate">{current.name}</div>
        <div className="text-sm text-slate-600 truncate">{current.artists?.[0]?.name}</div>
        <div className="text-xs muted">{deviceId ? 'Connected' : 'Not connected'}</div>
      </div>

      <div className="flex items-center space-x-2">
        {playing ? (
          <button onClick={pause} className="btn-primary">
            Pause
          </button>
        ) : (
          <div className="px-3 py-2 text-sm muted">Stopped</div>
        )}
      </div>
    </div>
  );
};

export default Player;
