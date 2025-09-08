// Custom category mapping for simplified music genres
export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  spotifyGenres: string[];
  description?: string;
  priority?: number; // Higher priority categories are matched first
  keywords?: string[]; // Additional search keywords
}

export const CUSTOM_CATEGORIES: CustomCategory[] = [
  {
    id: 'kpop',
    name: 'K-Pop',
    color: '#ff6b9d',
    icon: '🇰🇷',
    description: 'Korean pop music and K-culture',
    priority: 10,
    spotifyGenres: [
      'k-pop', 'k-rap', 'korean pop', 'kpop', 'trot',
      'korean r&b', 'korean hip hop', 'korean indie',
      'korean rock', 'korean ballad', 'korean traditional'
    ],
    keywords: ['korean', 'k-', 'korea', 'hangul', '한국', 'bts', 'blackpink']
  },
  {
    id: 'asian-pop',
    name: 'Asian Pop',
    color: '#ff7675',
    icon: '🌏',
    description: 'Popular music from across Asia',
    priority: 9,
    spotifyGenres: [
      'mandopop', 'cantopop', 'chinese pop', 'taiwanese pop', 'hong kong pop',
      'j-pop', 'japanese pop', 'jpop', 'thai pop', 'vietnamese pop',
      'filipino pop', 'singapore pop', 'malaysian pop', 'indonesian pop',
      'chinese rock', 'japanese rock', 'city pop', 'j-rock',
      'thai indie', 'pinoy pop', 'cpop', 'enka'
    ],
    keywords: ['chinese', 'japanese', 'thai', 'filipino', 'vietnamese', 'malaysian', 'indonesian', 'mandarin', 'cantonese']
  },
  {
    id: 'pop',
    name: 'Pop',
    color: '#4ecdc4',
    icon: '🎵',
    description: 'Mainstream pop music',
    priority: 5,
    spotifyGenres: [
      'pop', 'dance pop', 'electropop', 'synth-pop', 'indie pop',
      'art pop', 'power pop', 'chamber pop', 'baroque pop', 'teen pop',
      'europop', 'latin pop', 'pop rock', 'bubblegum pop', 'new wave pop',
      'synthwave', 'retro pop', 'adult standards'
    ],
    keywords: ['mainstream', 'commercial', 'radio', 'chart', 'billboard']
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    color: '#feca57',
    icon: '🎤',
    description: 'Hip-hop, rap and urban music',
    priority: 8,
    spotifyGenres: [
      'hip hop', 'rap', 'trap', 'conscious hip hop', 'gangster rap',
      'east coast hip hop', 'west coast rap', 'southern hip hop',
      'alternative hip hop', 'old school hip hop', 'drill', 'grime',
      'mumble rap', 'boom bap', 'cloud rap', 'experimental hip hop',
      'hardcore hip hop', 'turntablism', 'crunk', 'dirty south rap'
    ],
    keywords: ['rap', 'hip-hop', 'urban', 'street', 'freestyle', 'mc']
  },
  {
    id: 'edm',
    name: 'EDM',
    color: '#ff9ff3',
    icon: '🎧',
    description: 'Electronic dance music',
    priority: 7,
    spotifyGenres: [
      'edm', 'electronic', 'house', 'techno', 'trance', 'dubstep',
      'drum and bass', 'progressive house', 'deep house', 'tech house',
      'tropical house', 'electro', 'hardcore', 'breakbeat', 'ambient',
      'downtempo', 'chillout', 'future bass', 'trap', 'hardstyle',
      'psytrance', 'minimal techno', 'acid house', 'uk garage'
    ],
    keywords: ['electronic', 'dance', 'club', 'festival', 'rave', 'dj']
  },
  {
    id: 'rock',
    name: 'Rock',
    color: '#ff6348',
    icon: '🎸',
    description: 'Rock music and its subgenres',
    priority: 6,
    spotifyGenres: [
      'rock', 'alternative rock', 'indie rock', 'classic rock',
      'hard rock', 'punk rock', 'metal', 'grunge', 'progressive rock',
      'psychedelic rock', 'garage rock', 'soft rock', 'blues rock',
      'folk rock', 'post-rock', 'math rock', 'stoner rock', 'surf rock',
      'southern rock', 'arena rock', 'glam rock', 'new wave'
    ],
    keywords: ['guitar', 'band', 'live', 'concert', 'album rock']
  },
  {
    id: 'indie',
    name: 'Indie',
    color: '#a55eea',
    icon: '🌙',
    description: 'Independent and alternative music',
    priority: 4,
    spotifyGenres: [
      'indie', 'indie folk', 'indie rock', 'indie pop', 'alternative',
      'lo-fi', 'bedroom pop', 'dream pop', 'shoegaze', 'post-rock',
      'indie r&b', 'indie electronic', 'anti-folk', 'freak folk',
      'new weird america', 'chamber pop', 'slowcore', 'sadcore'
    ],
    keywords: ['independent', 'alternative', 'underground', 'artsy', 'experimental']
  },
  {
    id: 'jazz',
    name: 'Jazz',
    color: '#26de81',
    icon: '🎺',
    description: 'Jazz and its many styles',
    priority: 3,
    spotifyGenres: [
      'jazz', 'smooth jazz', 'contemporary jazz', 'bebop', 'swing',
      'fusion', 'acid jazz', 'nu jazz', 'latin jazz', 'cool jazz',
      'free jazz', 'hard bop', 'post-bop', 'avant-garde jazz',
      'big band', 'ragtime', 'dixieland', 'jazz funk', 'jazz blues'
    ],
    keywords: ['instrumental', 'improvisation', 'standards', 'saxophone', 'trumpet']
  },
  {
    id: 'rnb',
    name: 'R&B',
    color: '#fd79a8',
    icon: '💜',
    description: 'Rhythm & blues and soul music',
    priority: 6,
    spotifyGenres: [
      'r&b', 'soul', 'neo soul', 'contemporary r&b', 'funk',
      'motown', 'northern soul', 'quiet storm', 'new jack swing',
      'gospel', 'blues', 'southern soul', 'deep soul', 'philly soul',
      'alternative r&b', 'progressive r&b'
    ],
    keywords: ['rhythm', 'blues', 'soul', 'vocals', 'groove', 'smooth']
  },
  {
    id: 'latin',
    name: 'Latin',
    color: '#e55039',
    icon: '💃',
    description: 'Latin music from around the world',
    priority: 7,
    spotifyGenres: [
      'latin', 'reggaeton', 'salsa', 'bachata', 'merengue', 'cumbia',
      'tango', 'bossa nova', 'samba', 'flamenco', 'mariachi',
      'banda', 'ranchera', 'vallenato', 'mambo', 'bolero', 'cha cha',
      'latin jazz', 'latin rock', 'latin pop', 'tropical'
    ],
    keywords: ['spanish', 'portuguese', 'latin america', 'caribbean', 'brazil', 'mexico']
  },
  {
    id: 'country',
    name: 'Country',
    color: '#f39801',
    icon: '🤠',
    description: 'Country music and americana',
    priority: 5,
    spotifyGenres: [
      'country', 'country rock', 'alt-country', 'americana', 'bluegrass',
      'folk', 'western', 'honky tonk', 'outlaw country', 'contemporary country',
      'country pop', 'nashville sound', 'bakersfield sound', 'cowpunk'
    ],
    keywords: ['folk', 'acoustic', 'americana', 'roots', 'traditional']
  },
  {
    id: 'classical',
    name: 'Classical',
    color: '#8c7ae6',
    icon: '🎼',
    description: 'Classical and orchestral music',
    priority: 2,
    spotifyGenres: [
      'classical', 'orchestral', 'opera', 'baroque', 'romantic',
      'contemporary classical', 'minimalism', 'chamber music',
      'symphony', 'concerto', 'piano', 'violin', 'cello'
    ],
    keywords: ['orchestra', 'symphony', 'conductor', 'composer', 'instrumental', 'concert hall']
  }
];

// Enhanced mapping function with better matching logic
export function mapGenreToCategory(spotifyGenre: string): string | null {
  const genre = spotifyGenre.toLowerCase().trim();
  
  // Special character detection for Asian content
  const containsNonLatin = /[^\x00-\x7F]/.test(genre);
  const containsAsianChars = /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(genre);
  
  // Enhanced Asian keywords with more comprehensive coverage
  const ASIAN_KEYWORDS = [
    'k-', 'korean', 'kpop', 'korea', 'hangul',
    'mandopop', 'cantopop', 'chinese', 'china', 'mandarin', 'cantonese', 'cpop',
    'j-', 'jpop', 'j-pop', 'japanese', 'japan', 'enka', 'city pop',
    'taiwan', 'taiwanese', 'hong kong', 'hongkong', 'singapore', 'singaporean',
    'thai', 'thailand', 'vietnamese', 'vietnam', 'filipino', 'philippines', 'pinoy',
    'malaysian', 'malaysia', 'indonesian', 'indonesia', 'trot'
  ];

  // Sort categories by priority (higher priority first)
  const sortedCategories = [...CUSTOM_CATEGORIES].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  for (const category of sortedCategories) {
    let matchStrength = 0;
    
    // Check exact genre matches (highest weight)
    for (const sg of category.spotifyGenres) {
      const searchGenre = sg.toLowerCase();
      
      if (genre === searchGenre) {
        matchStrength = 100;
        break;
      }
      
      // Partial matches with different weights
      if (searchGenre.length > 3 && genre.includes(searchGenre)) {
        matchStrength = Math.max(matchStrength, 80);
      } else if (genre.length > 3 && searchGenre.includes(genre)) {
        matchStrength = Math.max(matchStrength, 70);
      }
    }
    
    // Check keyword matches for additional context
    if (category.keywords && matchStrength < 100) {
      for (const keyword of category.keywords) {
        if (genre.includes(keyword.toLowerCase())) {
          matchStrength = Math.max(matchStrength, 60);
        }
      }
    }
    
    // Special handling for regional categories
    if (category.id === 'kpop') {
      // K-Pop gets priority for Korean content
      if (containsAsianChars || ASIAN_KEYWORDS.some(k => k.startsWith('k') && genre.includes(k))) {
        matchStrength = Math.max(matchStrength, 90);
      }
    } else if (category.id === 'asian-pop') {
      // Asian Pop for other Asian content
      if (containsAsianChars || ASIAN_KEYWORDS.some(k => !k.startsWith('k') && genre.includes(k))) {
        matchStrength = Math.max(matchStrength, 85);
      }
    } else {
      // For non-Asian categories, penalize if contains Asian characteristics
      if (containsNonLatin || ASIAN_KEYWORDS.some(k => genre.includes(k))) {
        matchStrength *= 0.3; // Reduce match strength significantly
      }
    }
    
    // Return if we have a strong enough match
    if (matchStrength >= 70) {
      return category.id;
    }
  }
  
  return null;
}

// Enhanced mapping for multiple genres with weighted scoring
export function mapGenresToCategories(spotifyGenres: string[]): string[] {
  const categoryScores: { [categoryId: string]: number } = {};
  const categoryMatches: { [categoryId: string]: number } = {};
  
  for (const genre of spotifyGenres) {
    const categoryId = mapGenreToCategory(genre);
    if (categoryId) {
      categoryMatches[categoryId] = (categoryMatches[categoryId] || 0) + 1;
      
      // Calculate weighted score based on genre specificity
      const category = getCategoryById(categoryId);
      if (category) {
        const genreSpecificity = genre.split(' ').length; // More specific genres get higher weight
        const priorityBonus = (category.priority || 1) * 0.1;
        categoryScores[categoryId] = (categoryScores[categoryId] || 0) + genreSpecificity + priorityBonus;
      }
    }
  }
  
  // Return categories sorted by weighted score, then by match frequency
  return Object.entries(categoryScores)
    .sort(([catA, scoreA], [catB, scoreB]) => {
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (categoryMatches[catB] || 0) - (categoryMatches[catA] || 0);
    })
    .map(([categoryId]) => categoryId);
}

// Get category by ID
export function getCategoryById(categoryId: string): CustomCategory | null {
  return CUSTOM_CATEGORIES.find(cat => cat.id === categoryId) || null;
}

// Get all categories sorted by priority
export function getAllCategories(): CustomCategory[] {
  return [...CUSTOM_CATEGORIES].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

// Get categories by genre relevance for search/discovery
export function getCategoriesByRelevance(searchTerm?: string): CustomCategory[] {
  if (!searchTerm) return getAllCategories();
  
  const term = searchTerm.toLowerCase();
  const scoredCategories = CUSTOM_CATEGORIES.map(category => {
    let score = 0;
    
    // Name match
    if (category.name.toLowerCase().includes(term)) score += 100;
    
    // Description match
    if (category.description?.toLowerCase().includes(term)) score += 50;
    
    // Genre match
    if (category.spotifyGenres.some(genre => genre.toLowerCase().includes(term))) score += 75;
    
    // Keyword match
    if (category.keywords?.some(keyword => keyword.toLowerCase().includes(term))) score += 60;
    
    // Priority bonus
    score += (category.priority || 0) * 2;
    
    return { category, score };
  })
  .filter(({ score }) => score > 0)
  .sort((a, b) => b.score - a.score)
  .map(({ category }) => category);
  
  return scoredCategories.length > 0 ? scoredCategories : getAllCategories();
}

// Suggest categories based on listening history/preferences
export function suggestCategories(recentGenres: string[], maxSuggestions = 5): CustomCategory[] {
  const categoryFrequency: { [categoryId: string]: number } = {};
  
  for (const genre of recentGenres) {
    const categoryId = mapGenreToCategory(genre);
    if (categoryId) {
      categoryFrequency[categoryId] = (categoryFrequency[categoryId] || 0) + 1;
    }
  }
  
  // Get related categories (same "family" or complementary genres)
  const relatedMap: { [categoryId: string]: string[] } = {
    'kpop': ['asian-pop', 'pop'],
    'asian-pop': ['kpop', 'pop'],
    'pop': ['indie', 'rnb', 'edm'],
    'hiphop': ['rnb', 'latin'],
    'edm': ['pop', 'indie'],
    'rock': ['indie', 'country'],
    'indie': ['rock', 'pop'],
    'jazz': ['rnb', 'classical'],
    'rnb': ['hiphop', 'jazz'],
    'latin': ['pop', 'hiphop'],
    'country': ['rock', 'folk'],
    'classical': ['jazz']
  };
  
  // Add related categories with lower weight
  for (const [categoryId, frequency] of Object.entries(categoryFrequency)) {
    const related = relatedMap[categoryId] || [];
    for (const relatedId of related) {
      if (!categoryFrequency[relatedId]) {
        categoryFrequency[relatedId] = frequency * 0.3; // Lower weight for related
      }
    }
  }
  
  return Object.entries(categoryFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxSuggestions)
    .map(([categoryId]) => getCategoryById(categoryId))
    .filter(Boolean) as CustomCategory[];
}

// Get optimal search terms for a category (helps improve Spotify API results)
export function getCategorySearchTerms(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  
  const searchTerms = new Set<string>();
  
  // Add primary genres (most important)
  category.spotifyGenres.slice(0, 5).forEach(genre => searchTerms.add(genre));
  
  // Add high-value keywords
  if (category.keywords) {
    category.keywords.slice(0, 3).forEach(keyword => searchTerms.add(keyword));
  }
  
  // Add category name variations
  searchTerms.add(category.name.toLowerCase());
  if (category.name.includes(' ')) {
    searchTerms.add(category.name.replace(' ', ''));
  }
  
  return Array.from(searchTerms);
}

// Analyze genre diversity in a collection
export function analyzeGenreDiversity(genres: string[]): {
  categories: string[];
  diversity: number; // 0-1, higher = more diverse
  dominantCategory: string | null;
  suggestions: string[];
} {
  const categoryMapping = mapGenresToCategories(genres);
  const uniqueCategories = new Set(categoryMapping);
  
  // Calculate diversity score
  const diversity = Math.min(uniqueCategories.size / Math.max(CUSTOM_CATEGORIES.length * 0.7, 1), 1);
  
  // Find dominant category
  const categoryFreq: { [key: string]: number } = {};
  categoryMapping.forEach(cat => {
    categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
  });
  
  const dominantCategory = Object.entries(categoryFreq)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || null;
  
  // Suggest complementary categories
  const currentCategories = Array.from(uniqueCategories);
  const allCategories = getAllCategories().map(c => c.id);
  const suggestions = allCategories
    .filter(cat => !currentCategories.includes(cat))
    .slice(0, 3);
  
  return {
    categories: Array.from(uniqueCategories),
    diversity,
    dominantCategory,
    suggestions
  };
}

// Validate and clean genre data
export function cleanGenreData(genres: string[]): string[] {
  return genres
    .filter(genre => typeof genre === 'string' && genre.trim().length > 0)
    .map(genre => genre.toLowerCase().trim())
    .filter((genre, index, array) => array.indexOf(genre) === index) // Remove duplicates
    .filter(genre => genre.length <= 50 && genre.length >= 2) // Reasonable length
    .slice(0, 20); // Limit to prevent API overload
}
