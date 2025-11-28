/**
 * NavigationButton Component
 * Unified navigation arrow button used for pagination across the app
 * Responsive sizing that scales with screen size
 */

import React from 'react';
import { IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface NavigationButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  title?: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  direction,
  onClick,
  disabled = false,
  size = 'medium',
  title
}) => {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      title={title}
      sx={{
        color: 'white',
        bgcolor: 'rgba(255,255,255,0.08)',
        // Responsive sizing based on screen width
        width: size === 'small' 
          ? { xs: 28, lg: 30, xl: 32 } 
          : { xs: 30, lg: 34, xl: 36 },
        height: size === 'small' 
          ? { xs: 28, lg: 30, xl: 32 } 
          : { xs: 30, lg: 34, xl: 36 },
        minWidth: 'unset',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.15)',
          borderColor: 'rgba(255,255,255,0.2)',
        },
        '&:disabled': {
          opacity: 0.3,
          bgcolor: 'rgba(255,255,255,0.03)',
        },
        '&:active': {
          transform: 'scale(0.95)',
        },
      }}
    >
      <Icon sx={{ 
        // Responsive icon sizing
        fontSize: size === 'small' 
          ? { xs: 18, lg: 19, xl: 20 } 
          : { xs: 20, lg: 22, xl: 24 } 
      }} />
    </IconButton>
  );
};

export default NavigationButton;
