/**
 * Category Mapping Utility
 * Maps Spotify genres to simplified, user-friendly categories
 * 
 * PURPOSE:
 * - Group hundreds of Spotify genres into ~20 main categories
 * - Provide consistent colors, icons, and descriptions
 * - Enable priority-based matching (K-Pop before general Pop)
 * - Support keyword-based category detection
 * 
 * USAGE:
 * - Category detection from artist genres
 * - UI rendering with consistent styling
 * - Browse/Discovery features
 * - Recommendation filtering
 * 
 * PRIORITY SYSTEM:
 * - Higher priority categories matched first
 * - Prevents K-Pop from matching under generic "Pop"
 * - Ensures specific genres take precedence
 * 
 * STRUCTURE:
 * Each category has:
 * - id: Unique identifier
 * - name: Display name
 * - color: Hex color for UI
 * - icon: Emoji or abbreviation
 * - spotifyGenres: List of matching Spotify genre tags
 * - keywords: Additional search keywords
 * - priority: Match priority (higher = checked first)
 */

// Custom category interface for genre organization
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

/**
 * Main category definitions
 * Organized by priority to prevent false matches
 * Priority 10: Geographic/specific genres (K-Pop, J-Pop, Mandopop)
 * Priority 8-9: Major genres (Hip-Hop, Rock, EDM)
 * Priority 5-7: Subgenres and variations
 * Priority 1-4: General/catch-all categories
 */
export const CUSTOM_CATEGORIES: CustomCategory[] = [
  // HIGHEST PRIORITY: Specific regional pop genres
  {
    id: 'kpop',
    name: 'K-Pop',
    color: '#ff6b9d',
    icon: 'KR',
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
    id: 'chinese-pop',
    name: 'Chinese Pop',
    color: '#ff7675',
    icon: 'CN',
    description: 'Popular music from China and Chinese-speaking regions',
    priority: 9,
    spotifyGenres: [
      'mandopop', 'cantopop', 'chinese pop', 'taiwanese pop', 'hong kong pop',
      'chinese rock', 'cpop', 'mandarin pop', 'cantonese pop'
    ],
    keywords: ['chinese', 'mandarin', 'cantonese', 'china', 'taiwan', 'hong kong', 'mandopop', 'cantopop']
  },
  // HIGH PRIORITY: Major genres with wide appeal
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

// Enhanced mapping function with better matching logic and performance optimization
export function mapGenreToCategory(spotifyGenre: string): string | null {
  const genre = spotifyGenre.toLowerCase().trim();
  
  // Early return for empty strings
  if (!genre) return null;
  
  // Special character detection for Asian content (cached regex)
  const containsNonLatin = /[^\x00-\x7F]/.test(genre);
  const containsAsianChars = /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(genre);
  
  // Pre-compiled keyword sets for faster lookup
  const KPOP_KEYWORDS = new Set(['k-', 'korean', 'kpop', 'korea', 'hangul', 'trot']);
  const CHINESE_KEYWORDS = new Set(['mandopop', 'cantopop', 'chinese', 'china', 'mandarin', 'cantonese', 'cpop', 'taiwan', 'taiwanese', 'hong kong', 'hongkong']);
  
  // Check for exact matches first (most common case)
  const exactMatchMap = new Map<string, string>();
  CUSTOM_CATEGORIES.forEach(category => {
    category.spotifyGenres.forEach(sg => {
      exactMatchMap.set(sg.toLowerCase(), category.id);
    });
  });
  
  if (exactMatchMap.has(genre)) {
    return exactMatchMap.get(genre)!;
  }
  
  // Sort categories by priority (higher priority first) - cached
  const sortedCategories = CUSTOM_CATEGORIES.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  for (const category of sortedCategories) {
    let matchStrength = 0;
    
    // Quick keyword-based pre-filtering for Asian categories
    if (category.id === 'kpop') {
      const hasKPopKeywords = Array.from(KPOP_KEYWORDS).some(k => genre.includes(k));
      if (!hasKPopKeywords && !containsAsianChars) continue; // Skip if no Korean indicators
    } else if (category.id === 'chinese-pop') {
      const hasChineseKeywords = Array.from(CHINESE_KEYWORDS).some(k => genre.includes(k));
      if (!hasChineseKeywords && !containsAsianChars) continue; // Skip if no Chinese indicators
    }
    
    // Check partial genre matches with optimized string operations
    for (const sg of category.spotifyGenres) {
      const searchGenre = sg.toLowerCase();
      
      // Use includes for performance - more cache-friendly than regex
      if (searchGenre.length > 3 && genre.includes(searchGenre)) {
        matchStrength = Math.max(matchStrength, 80);
        break; // First match is usually best
      } else if (genre.length > 3 && searchGenre.includes(genre)) {
        matchStrength = Math.max(matchStrength, 70);
      }
    }
    
    // Check keyword matches for additional context
    if (category.keywords && matchStrength < 80) {
      for (const keyword of category.keywords) {
        if (genre.includes(keyword.toLowerCase())) {
          matchStrength = Math.max(matchStrength, 60);
          break; // First keyword match is sufficient
        }
      }
    }
    
    // Special handling for regional categories with character detection
    if (category.id === 'kpop' && containsAsianChars) {
      matchStrength = Math.max(matchStrength, 85);
    } else if (category.id === 'chinese-pop' && containsAsianChars) {
      matchStrength = Math.max(matchStrength, 80);
    } else if (!['kpop', 'chinese-pop'].includes(category.id)) {
      // For non-Asian categories, penalize if contains Asian characteristics
      if (containsNonLatin || Array.from(KPOP_KEYWORDS).some(k => genre.includes(k)) || Array.from(CHINESE_KEYWORDS).some(k => genre.includes(k))) {
        matchStrength *= 0.4; // Reduce match strength
      }
    }
    
    // Return if we have a strong enough match
    if (matchStrength >= 70) {
      return category.id;
    }
  }
  
  return null;
}

// Enhanced mapping for multiple genres with weighted scoring and memoization
const genreMappingCache = new Map<string, string[]>();

export function mapGenresToCategories(spotifyGenres: string[]): string[] {
  // Create cache key for memoization
  const cacheKey = spotifyGenres.slice().sort().join('|');
  if (genreMappingCache.has(cacheKey)) {
    return genreMappingCache.get(cacheKey)!;
  }
  
  // Early return for empty input
  if (!spotifyGenres.length) return [];
  
  const categoryScores: { [categoryId: string]: number } = {};
  const categoryMatches: { [categoryId: string]: number } = {};
  
  // Pre-process genres to avoid duplicate work
  const processedGenres = spotifyGenres
    .filter(genre => genre && typeof genre === 'string')
    .map(genre => genre.toLowerCase().trim())
    .filter((genre, index, array) => array.indexOf(genre) === index); // Remove duplicates
  
  for (const genre of processedGenres) {
    const categoryId = mapGenreToCategory(genre);
    if (categoryId) {
      categoryMatches[categoryId] = (categoryMatches[categoryId] || 0) + 1;
      
      // Calculate weighted score based on genre specificity and category priority
      const category = getCategoryById(categoryId);
      if (category) {
        const genreSpecificity = genre.split(' ').length; // More specific genres get higher weight
        const priorityBonus = (category.priority || 1) * 0.15; // Increased priority influence
        const lengthBonus = Math.min(genre.length / 10, 2); // Longer genre names often more specific
        categoryScores[categoryId] = (categoryScores[categoryId] || 0) + genreSpecificity + priorityBonus + lengthBonus;
      }
    }
  }
  
  // Return categories sorted by weighted score, then by match frequency
  const result = Object.entries(categoryScores)
    .sort(([catA, scoreA], [catB, scoreB]) => {
      if (Math.abs(scoreB - scoreA) > 0.5) return scoreB - scoreA; // Significant score difference
      return (categoryMatches[catB] || 0) - (categoryMatches[catA] || 0); // Fall back to frequency
    })
    .map(([categoryId]) => categoryId)
    .slice(0, 8); // Limit to top 8 categories for performance
  
  // Cache the result for future lookups
  if (genreMappingCache.size > 100) {
    // Clear oldest entries to prevent memory leaks
    const firstKey = genreMappingCache.keys().next().value;
    if (firstKey) genreMappingCache.delete(firstKey);
  }
  genreMappingCache.set(cacheKey, result);
  
  return result;
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
    'kpop': ['chinese-pop', 'pop'],
    'chinese-pop': ['kpop', 'pop'],
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

// Get optimal search terms for a category (optimized for Spotify API performance)
const searchTermsCache = new Map<string, string[]>();

export function getCategorySearchTerms(categoryId: string): string[] {
  // Return cached result if available
  if (searchTermsCache.has(categoryId)) {
    return searchTermsCache.get(categoryId)!;
  }
  
  const category = getCategoryById(categoryId);
  if (!category) return [];
  
  const searchTerms = new Set<string>();
  
  // Strategy: prioritize most effective search terms based on category type
  if (categoryId === 'kpop') {
    // For K-Pop, use broader terms that work better with Spotify's search
    searchTerms.add('k-pop');
    searchTerms.add('korean');
    searchTerms.add('kpop');
    searchTerms.add('korea');
  } else if (categoryId === 'chinese-pop') {
    // For Chinese Pop, focus on terms that yield better results
    searchTerms.add('mandopop');
    searchTerms.add('cantopop');
    searchTerms.add('chinese pop');
    searchTerms.add('cpop');
  } else {
    // For other categories, use the most specific genres first
    const sortedGenres = category.spotifyGenres
      .slice(0, 6) // Limit to top 6 most relevant
      .sort((a, b) => b.length - a.length); // Longer terms usually more specific
    
    sortedGenres.forEach(genre => searchTerms.add(genre));
    
    // Add high-value keywords for broader reach
    if (category.keywords) {
      category.keywords
        .slice(0, 2) // Only top 2 keywords
        .forEach(keyword => searchTerms.add(keyword));
    }
  }
  
  // Add category name as fallback
  searchTerms.add(category.name.toLowerCase());
  
  const result = Array.from(searchTerms).slice(0, 5); // Limit to 5 terms for optimal performance
  
  // Cache the result
  searchTermsCache.set(categoryId, result);
  
  return result;
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
