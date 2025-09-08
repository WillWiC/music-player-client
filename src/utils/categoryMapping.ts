// Custom category mapping for simplified music genres
export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  spotifyGenres: string[];
}

export const CUSTOM_CATEGORIES: CustomCategory[] = [
  {
    id: 'kpop',
    name: 'K-Pop',
    color: '#ff6b9d',
    icon: '🇰🇷',
    spotifyGenres: [
      'k-pop', 'k-rap', 'k-indie', 'k-rock', 'korean pop',
      'girl group', 'boy band', 'kpop', 'korean'
    ]
  },
  {
    id: 'pop',
    name: 'Pop',
    color: '#4ecdc4',
    icon: '🎵',
    spotifyGenres: [
      'pop', 'dance pop', 'electropop', 'synth-pop', 'indie pop',
      'art pop', 'power pop', 'chamber pop', 'baroque pop'
    ]
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    color: '#feca57',
    icon: '🎤',
    spotifyGenres: [
      'hip hop', 'rap', 'trap', 'conscious hip hop', 'gangster rap',
      'east coast hip hop', 'west coast rap', 'southern hip hop',
      'alternative hip hop', 'old school hip hop'
    ]
  },
  {
    id: 'edm',
    name: 'EDM',
    color: '#ff9ff3',
    icon: '🎧',
    spotifyGenres: [
      'edm', 'electronic', 'house', 'techno', 'trance', 'dubstep',
      'drum and bass', 'progressive house', 'deep house',
      'tropical house', 'electro', 'hardcore'
    ]
  },
  {
    id: 'rock',
    name: 'Rock',
    color: '#ff6348',
    icon: '🎸',
    spotifyGenres: [
      'rock', 'alternative rock', 'indie rock', 'classic rock',
      'hard rock', 'punk rock', 'metal', 'grunge', 'progressive rock',
      'psychedelic rock', 'garage rock'
    ]
  },
  {
    id: 'indie',
    name: 'Indie',
    color: '#a55eea',
    icon: '🌙',
    spotifyGenres: [
      'indie', 'indie folk', 'indie rock', 'indie pop', 'alternative',
      'lo-fi', 'bedroom pop', 'dream pop', 'shoegaze', 'post-rock'
    ]
  },
  {
    id: 'jazz',
    name: 'Jazz',
    color: '#26de81',
    icon: '🎺',
    spotifyGenres: [
      'jazz', 'smooth jazz', 'contemporary jazz', 'bebop', 'swing',
      'fusion', 'acid jazz', 'nu jazz', 'latin jazz', 'cool jazz'
    ]
  },
  {
    id: 'rnb',
    name: 'R&B',
    color: '#fd79a8',
    icon: '💜',
    spotifyGenres: [
      'r&b', 'soul', 'neo soul', 'contemporary r&b', 'funk',
      'motown', 'northern soul', 'quiet storm', 'new jack swing'
    ]
  }
];

// Map Spotify genre to our custom category
export function mapGenreToCategory(spotifyGenre: string): string | null {
  const genre = spotifyGenre.toLowerCase();
  
  for (const category of CUSTOM_CATEGORIES) {
    if (category.spotifyGenres.some(sg => 
      genre.includes(sg.toLowerCase()) || sg.toLowerCase().includes(genre)
    )) {
      return category.id;
    }
  }
  
  return null;
}

// Map multiple genres to categories and return the most relevant one
export function mapGenresToCategories(spotifyGenres: string[]): string[] {
  const categoryMatches: { [categoryId: string]: number } = {};
  
  for (const genre of spotifyGenres) {
    const categoryId = mapGenreToCategory(genre);
    if (categoryId) {
      categoryMatches[categoryId] = (categoryMatches[categoryId] || 0) + 1;
    }
  }
  
  // Return categories sorted by match frequency
  return Object.entries(categoryMatches)
    .sort(([, a], [, b]) => b - a)
    .map(([categoryId]) => categoryId);
}

// Get category by ID
export function getCategoryById(categoryId: string): CustomCategory | null {
  return CUSTOM_CATEGORIES.find(cat => cat.id === categoryId) || null;
}

// Get all categories
export function getAllCategories(): CustomCategory[] {
  return CUSTOM_CATEGORIES;
}
