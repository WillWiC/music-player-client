# Category System Documentation

## Overview
Enhanced category browsing experience with optimized algorithms, improved typography, and intelligent music categorization across the FlowBeats music player.

---

## Features

### 🎵 Music Categories
- **K-pop** - Korean pop music
- **Pop** - Mainstream pop hits
- **Rock** - Rock and alternative
- **Hip-Hop** - Rap and hip-hop
- **Electronic** - EDM, house, techno
- **R&B** - R&B and soul
- **Jazz** - Jazz and blues
- **Classical** - Classical and orchestral
- **Country** - Country and folk
- **Latin** - Latin and reggaeton
- **Indie** - Independent and alternative
- **Metal** - Heavy metal and hardcore

---

## Key Improvements

### 1. Algorithm Optimization

**Enhanced Genre Detection:**
```typescript
// Multi-source genre analysis
const detectGenre = (track: Track) => {
  const sources = [
    inferFromArtistNames(track.artists),    // 40% weight
    inferFromAudioFeatures(track),          // 30% weight
    inferFromTrackName(track.name),         // 20% weight
    inferFromContext(track)                 // 10% weight
  ];
  
  return combineGenreSources(sources);
};
```

**K-pop Detection Enhancement:**
```typescript
const KPOP_ARTISTS = [
  'BTS', 'BLACKPINK', 'TWICE', 'EXO', 'Red Velvet',
  'NCT', 'SEVENTEEN', 'Stray Kids', 'ITZY', 'aespa',
  'TREASURE', 'ENHYPEN', 'IVE', 'NewJeans', 'LE SSERAFIM'
];

const isKpopArtist = (artistName: string) => {
  return KPOP_ARTISTS.some(kpop => 
    artistName.toLowerCase().includes(kpop.toLowerCase())
  );
};
```

**Pattern Matching Improvements:**
```typescript
// Electronic music detection
if (name.match(/\b(DJ|dj)\b/) || 
    name.includes('bass') || 
    name.includes('step')) {
  return 'electronic';
}

// Hip-hop detection
if (name.match(/\b(MC|Lil|Young)\b/) ||
    name.includes('gang') ||
    name.includes('crew')) {
  return 'hip-hop';
}

// Classical detection
if (name.includes('Orchestra') ||
    name.includes('Symphony') ||
    name.includes('Philharmonic')) {
  return 'classical';
}
```

### 2. Typography Updates

**Before:**
```tsx
<Typography variant="h6" sx={{ fontWeight: 500 }}>
  {category.name}
</Typography>
```

**After:**
```tsx
<Typography 
  variant="h6" 
  sx={{ 
    fontWeight: 700,  // Bolder
    fontSize: '1.1rem',
    letterSpacing: '0.02em'
  }}
>
  {category.name}
</Typography>
```

**Improvements:**
- ✅ Increased font weight (500 → 700)
- ✅ Better font size hierarchy
- ✅ Improved letter spacing for readability
- ✅ Consistent across all category cards

### 3. Category Icons

**Enhanced Visual Hierarchy:**
```tsx
const getCategoryIcon = (category: string) => {
  const icons = {
    'k-pop': '🎤',
    'pop': '🎵',
    'rock': '🎸',
    'hip-hop': '🎧',
    'electronic': '🎹',
    'r&b': '🎶',
    'jazz': '🎺',
    'classical': '🎻',
    'country': '🤠',
    'latin': '💃',
    'indie': '🎨',
    'metal': '🤘'
  };
  
  return icons[category.toLowerCase()] || '🎵';
};
```

---

## Category Mapping System

### Data Structure
```typescript
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  keywords: string[];
}

const categories: Category[] = [
  {
    id: 'kpop',
    name: 'K-pop',
    icon: '🎤',
    color: '#FF1493',
    description: 'Korean pop music',
    keywords: ['kpop', 'korean', 'k-pop', 'bts', 'blackpink']
  },
  // ... more categories
];
```

### Smart Categorization
```typescript
const categorizeTrack = (track: Track): string[] => {
  const categories: string[] = [];
  
  // Check explicit genre tags
  if (track.genres) {
    categories.push(...mapGenres(track.genres));
  }
  
  // Analyze artist name
  const artistGenre = inferFromArtist(track.artists[0].name);
  if (artistGenre) categories.push(artistGenre);
  
  // Analyze audio features
  if (track.audioFeatures) {
    const featureGenre = inferFromFeatures(track.audioFeatures);
    if (featureGenre) categories.push(featureGenre);
  }
  
  // Deduplicate and return
  return [...new Set(categories)];
};
```

---

## UI Components

### Category Card
```tsx
<div className="category-card group">
  <div className="aspect-square relative overflow-hidden rounded-lg">
    <img 
      src={category.image || '/placeholder.png'}
      alt={category.name}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
    <div className="absolute bottom-0 left-0 p-4">
      <span className="text-4xl">{category.icon}</span>
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'white', 
          fontWeight: 700,
          mt: 1
        }}
      >
        {category.name}
      </Typography>
    </div>
  </div>
</div>
```

### Category Grid
```tsx
<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
  {categories.map((category, index) => (
    <Grow in timeout={250 + index * 30} key={category.id}>
      <CategoryCard category={category} />
    </Grow>
  ))}
</div>
```

---

## Performance Optimizations

### 1. Caching
```typescript
// Cache category results for 5 minutes
const CATEGORY_CACHE_TTL = 5 * 60 * 1000;
const categoryCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

const getCategoryWithCache = (categoryId: string) => {
  const cached = categoryCache.get(categoryId);
  
  if (cached && Date.now() - cached.timestamp < CATEGORY_CACHE_TTL) {
    return cached.data;
  }
  
  const fresh = fetchCategory(categoryId);
  categoryCache.set(categoryId, { data: fresh, timestamp: Date.now() });
  return fresh;
};
```

### 2. Lazy Loading
```typescript
// Load category playlists on demand
const [playlists, setPlaylists] = useState<Playlist[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (!categoryId) return;
  
  setLoading(true);
  fetchCategoryPlaylists(categoryId)
    .then(setPlaylists)
    .finally(() => setLoading(false));
}, [categoryId]);
```

### 3. Optimized Rendering
```typescript
// Only render visible categories
const visibleCategories = useMemo(() => {
  return categories.slice(0, 12); // Show 12 at a time
}, [categories]);
```

---

## Algorithm Details

### Audio Feature Analysis
```typescript
const inferFromFeatures = (features: AudioFeatures): string | null => {
  const { 
    danceability, 
    energy, 
    acousticness, 
    instrumentalness,
    valence,
    tempo 
  } = features;
  
  // Electronic: high energy, low acousticness
  if (energy > 0.7 && acousticness < 0.3 && tempo > 120) {
    return 'electronic';
  }
  
  // Classical: high instrumentalness, low energy
  if (instrumentalness > 0.7 && acousticness > 0.5) {
    return 'classical';
  }
  
  // Hip-hop: low instrumentalness, medium tempo
  if (instrumentalness < 0.1 && tempo > 80 && tempo < 120) {
    return 'hip-hop';
  }
  
  // Pop: high danceability, high valence
  if (danceability > 0.6 && valence > 0.6) {
    return 'pop';
  }
  
  return null;
};
```

### Multi-Factor Scoring
```typescript
const calculateCategoryScore = (
  track: Track, 
  category: Category
): number => {
  let score = 0;
  
  // Artist name match (40 points)
  if (matchesArtistPattern(track.artists[0].name, category)) {
    score += 40;
  }
  
  // Genre tags (30 points)
  if (track.genres?.some(g => category.keywords.includes(g))) {
    score += 30;
  }
  
  // Audio features (20 points)
  if (matchesFeatureProfile(track.audioFeatures, category)) {
    score += 20;
  }
  
  // Track name keywords (10 points)
  if (category.keywords.some(kw => track.name.toLowerCase().includes(kw))) {
    score += 10;
  }
  
  return score;
};
```

---

## Browse Page Integration

### Category Display
```tsx
<div className="mb-8">
  <Fade in timeout={600}>
    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
      Browse Categories
    </Typography>
  </Fade>
  
  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
    {categories.map((category, index) => (
      <Grow in timeout={250 + index * 30} key={category.id}>
        <div 
          className="cursor-pointer"
          onClick={() => navigate(`/category/${category.id}`)}
        >
          <CategoryCard category={category} />
        </div>
      </Grow>
    ))}
  </div>
</div>
```

---

## Future Enhancements

### Planned
- [ ] User-customizable categories
- [ ] AI-powered category suggestions
- [ ] Dynamic category colors based on content
- [ ] Category playlist auto-generation
- [ ] Cross-category recommendations

### Possible
- [ ] Mood-based categories
- [ ] Time-of-day categories
- [ ] Activity-based categories (workout, study, etc.)
- [ ] Collaborative category curation

---

## Files Modified

- `src/pages/Browse.tsx` - Category grid display
- `src/pages/Category.tsx` - Individual category page
- `src/utils/categoryMapping.ts` - Category detection algorithms
- `src/services/musicIntelligenceService.ts` - Genre inference

---

## Summary

The category system now provides:
- ✅ **Accurate categorization** - Multi-source genre detection
- ✅ **Enhanced K-pop support** - Special handling for Korean artists
- ✅ **Better typography** - Improved readability and hierarchy
- ✅ **Smart algorithms** - Audio feature analysis
- ✅ **Professional UI** - Icons, colors, animations

**Result:** An intelligent, visually appealing category browsing experience! 🎨

---

**Last Updated:** October 2025  
**Status:** Complete ✅  
**Categories Supported:** 12+
