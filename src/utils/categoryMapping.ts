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
      'k-pop', 'k-rap', 'korean pop',
      'kpop'
    ]
  },
  {
    id: 'asian-pop',
    name: 'Asian Pop',
    color: '#ff7675',
    icon: '🌏',
    spotifyGenres: [
      'mandopop', 'cantopop', 'chinese pop', 'taiwanese pop', 'hong kong pop',
      'j-pop', 'japanese pop', 'jpop', 'thai pop', 'vietnamese pop',
      'filipino pop', 'singapore pop', 'malaysian pop', 'indonesian pop'
    ]
  },
  {
    id: 'pop',
    name: 'Pop',
    color: '#4ecdc4',
    icon: '🎵',
    spotifyGenres: [
      'pop', 'dance pop', 'electropop', 'synth-pop', 'indie pop',
      'art pop', 'power pop', 'chamber pop', 'baroque pop', 'teen pop',
      'europop', 'latin pop'
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
  const genre = spotifyGenre.toLowerCase().trim();

  // Keywords commonly used for Asian-language genres or regional markers
  const ASIAN_KEYWORDS = [
    'k-', 'korean', 'kpop', 'mandopop', 'cantopop', 'chinese', 'j-', 'jpop', 'j-pop', 'japanese',
    'taiwan', 'taiwanese', 'hong kong', 'hongkong', 'thai', 'vietnamese', 'filipino',
    'singapore', 'malaysian', 'indonesian', 'trot'
  ];

  // Very permissive ASCII check — if genre contains non-ASCII chars we consider it non-English
  const isAscii = (s: string) => /^[\x00-\x7F]+$/.test(s);

  for (const category of CUSTOM_CATEGORIES) {
    for (const sg of category.spotifyGenres) {
      const searchGenre = sg.toLowerCase();

      // K-Pop: strict matching for k- / korean / kpop / trot
      if (category.id === 'kpop') {
        if (
          genre === searchGenre ||
          genre === 'kpop' ||
          (genre.startsWith('k-') && searchGenre.startsWith('k-')) ||
          (genre.includes('korean') && searchGenre.includes('korean')) ||
          genre === 'trot'
        ) {
          return category.id;
        }
        continue;
      }

      // Asian Pop: look for regional/Asian keywords (mandopop, cantopop, j-pop, etc.)
      if (category.id === 'asian-pop') {
        if (
          genre === searchGenre ||
          ASIAN_KEYWORDS.some(k => genre.includes(k)) ||
          searchGenre.length > 3 && genre.includes(searchGenre)
        ) {
          return category.id;
        }
        continue;
      }

      // For other categories (pop, hiphop, edm, rock, indie, jazz, rnb):
      // - require the genre string to be ASCII-only (likely English)
      // - exclude any Asian keywords to prevent misclassification
      if (!isAscii(genre)) continue;
      if (ASIAN_KEYWORDS.some(k => genre.includes(k))) continue;

      if (
        genre === searchGenre ||
        (searchGenre.length > 3 && genre.includes(searchGenre)) ||
        (genre.length > 3 && searchGenre.includes(genre))
      ) {
        return category.id;
      }
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
