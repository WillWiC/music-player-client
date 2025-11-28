/**
 * NavigationButton Component
 * Unified navigation arrow button used for pagination across the app
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
  // Responsive sizing using clamp - scales between min and max based on viewport
  // Small: 28px-32px, Medium: 32px-36px
  const buttonSizeMin = size === 'small' ? 28 : 30;
  const buttonSizeMax = size === 'small' ? 32 : 36;
  const iconSizeMin = size === 'small' ? 18 : 20;
  const iconSizeMax = size === 'small' ? 20 : 24;

  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      title={title}
      sx={{
        color: 'white',
        bgcolor: 'rgba(255,255,255,0.08)',
        // Responsive button size - scales with viewport width
        width: `clamp(${buttonSizeMin}px, 2.5vw, ${buttonSizeMax}px)`,
        height: `clamp(${buttonSizeMin}px, 2.5vw, ${buttonSizeMax}px)`,
        minWidth: buttonSizeMin,
        minHeight: buttonSizeMin,
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
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
        '& .MuiSvgIcon-root': {
          fontSize: `clamp(${iconSizeMin}px, 1.5vw, ${iconSizeMax}px)`,
        },
      }}
    >
      <Icon />
    </IconButton>
  );
};

export default NavigationButton;
