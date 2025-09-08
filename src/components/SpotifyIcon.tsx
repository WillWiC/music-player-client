import React from 'react';
import SpotifyImg from '../assets/2024-spotify-logo-icon/Primary_Logo_White_RGB.svg';

const SpotifyIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = 18, className, style }) => (
  <img
    src={SpotifyImg}
    width={size}
    height={size}
    alt="Spotify"
    role="img"
    aria-label="Spotify"
    className={className}
    style={Object.assign({ display: 'inline-block' }, style)}
  />
);

export default SpotifyIcon;
