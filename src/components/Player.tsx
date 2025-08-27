import React from 'react';
import { usePlayer } from '../context/player';

const Player: React.FC = () => {
  const { current, playing, pause, deviceId } = usePlayer();
  if (!current) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white shadow p-3 flex items-center rounded-lg space-x-4 md:mx-12">
      <img src={current.album.images?.[0]?.url} alt="art" className="w-14 h-14 rounded" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 truncate">{current.name}</div>
        <div className="text-sm text-gray-600 truncate">{current.artists?.[0]?.name}</div>
        <div className="text-xs text-gray-500">{deviceId ? 'Connected' : 'Not connected'}</div>
      </div>

      <div className="flex items-center space-x-2">
        {playing ? (
          <button onClick={pause} className="px-3 py-2 bg-gray-200 rounded">
            Pause
          </button>
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500">Stopped</div>
        )}
      </div>
    </div>
  );
};

export default Player;
