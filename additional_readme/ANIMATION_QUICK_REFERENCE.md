# Animation Consistency - Quick Reference

## What Changed? 🎨

### Before ❌
- **Browse**: Categories appeared instantly, no loading state
- **Library**: Simple circular progress spinner
- **Other pages**: Basic loading indicators or instant content

### After ✅
- **Browse**: Skeleton grid → Staggered category cards with Grow animation
- **Library**: Skeleton cards → Staggered content with Grow animation
- **All pages**: Consistent Fade headers + smooth transitions

---

## Animation Patterns 📐

### Pattern 1: Page Headers
```tsx
<Fade in timeout={600}>
  <div className="mb-8">
    <h1>Page Title</h1>
    <p>Description</p>
  </div>
</Fade>
```
**Usage:** All main page headers  
**Timing:** 600ms fade-in

---

### Pattern 2: Loading Skeletons
```tsx
{loading && (
  <div className="grid grid-cols-6 gap-4">
    {[1,2,3,4,5,6].map((i) => (
      <Grow in timeout={300 + i * 100}>
        <Skeleton 
          variant="rectangular" 
          height={200}
          sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}
        />
      </Grow>
    ))}
  </div>
)}
```
**Usage:** Grid loading states  
**Timing:** 300ms base + 100ms stagger per item

---

### Pattern 3: Grid Items
```tsx
{items.map((item, index) => (
  <Grow in timeout={400 + index * 50} key={item.id}>
    <div className="hover:scale-105 transition-all duration-300">
      {/* Item content */}
    </div>
  </Grow>
))}
```
**Usage:** Category cards, album grids, playlist grids  
**Timing:** 400ms base + 50ms stagger  
**Hover:** Scale up to 105%

---

### Pattern 4: List Items
```tsx
{items.map((item, index) => (
  <Grow in timeout={300 + index * 30} key={item.id}>
    <div className="hover:bg-white/10 transition-all duration-300">
      {/* Item content */}
    </div>
  </Grow>
))}
```
**Usage:** Track lists, artist lists  
**Timing:** 300ms base + 30ms stagger  
**Hover:** Background highlight

---

## Timing Guide ⏱️

| Element | Base Timeout | Stagger | Total Range |
|---------|-------------|---------|-------------|
| **Headers** | 600ms | - | 600ms |
| **Tabs** | 700ms | - | 700ms |
| **Loading Skeletons** | 300ms | +100ms | 300-900ms |
| **Grid Items** | 400ms | +50ms | 400-800ms |
| **List Items** | 300ms | +30ms | 300-600ms |

---

## Color System 🎨

### Skeleton Colors
```tsx
bgcolor: 'rgba(255,255,255,0.05)'  // Semi-transparent white
borderRadius: 2 or 3                 // Rounded corners
```

### Card Background
```tsx
bgcolor: 'rgba(255,255,255,0.02)'   // Very subtle white
border: '1px solid rgba(255,255,255,0.05)'
```

### Hover States
```tsx
// Green accent
hover:border-green-500/30
hover:text-green-400
hover:bg-green-400

// White overlay
hover:bg-white/10

// Scale
hover:scale-105
```

---

## Implementation Status 📊

### ✅ Fully Implemented
1. **Browse.tsx**
   - ✅ Fade header (600ms)
   - ✅ 12 skeleton grid items
   - ✅ Staggered category cards
   - ✅ Hover effects

2. **Library.tsx**
   - ✅ Fade header (600ms)
   - ✅ Fade tabs (700ms)
   - ✅ 6 skeleton cards
   - ✅ 4 animated tabs (playlists, tracks, albums, artists)
   - ✅ Hover effects

3. **Search.tsx** (Reference)
   - ✅ Complete with 5 tabs
   - ✅ Top result card
   - ✅ Skeleton loading
   - ✅ All animations

### ⏳ Ready for Implementation
4. **Dashboard.tsx** - Imports ready
5. **Artist.tsx** - Imports ready
6. **Category.tsx** - Imports ready
7. **Recommendations.tsx** - Imports ready

---

## Quick Copy-Paste Templates 📋

### Template 1: Skeleton Grid Loading
```tsx
{loading && (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
      <Grow in key={i} timeout={300 + i * 50}>
        <div className="aspect-square">
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} 
          />
        </div>
      </Grow>
    ))}
  </div>
)}
```

### Template 2: Skeleton List Loading
```tsx
{loading && (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Grow in key={i} timeout={300 + i * 100}>
        <Card sx={{ 
          bgcolor: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.05)', 
          borderRadius: 3 
        }}>
          <CardContent sx={{ p: 3 }}>
            <div className="flex items-center gap-4">
              <Skeleton 
                variant="rectangular" 
                width={56} 
                height={56} 
                sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} 
              />
              <div className="flex-1 space-y-2">
                <Skeleton 
                  variant="text" 
                  width="60%" 
                  height={24} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} 
                />
                <Skeleton 
                  variant="text" 
                  width="40%" 
                  height={20} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </Grow>
    ))}
  </div>
)}
```

### Template 3: Animated Grid Content
```tsx
{!loading && items.length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {items.map((item, index) => (
      <Grow in timeout={400 + index * 50} key={item.id}>
        <div 
          onClick={() => handleClick(item)}
          className="group cursor-pointer"
        >
          <div className="rounded-xl border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
            {/* Item content */}
          </div>
        </div>
      </Grow>
    ))}
  </div>
)}
```

### Template 4: Animated List Content
```tsx
{!loading && items.length > 0 && (
  <div className="space-y-2">
    {items.map((item, index) => (
      <Grow in timeout={300 + index * 30} key={item.id}>
        <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300">
          {/* Item content */}
        </div>
      </Grow>
    ))}
  </div>
)}
```

---

## Import Statement 📦

```tsx
import { Fade, Grow, Skeleton, Card, CardContent } from '@mui/material';
```

**What each does:**
- `Fade` - Opacity transition (headers, sections)
- `Grow` - Scale transition (cards, items)
- `Skeleton` - Loading placeholder (mimics content shape)
- `Card` - Container for skeleton cards
- `CardContent` - Inner content for skeleton cards

---

## Testing Checklist ✓

- [ ] Animations work on slow connection (3G)
- [ ] No flash of content on fast connection
- [ ] Smooth transitions between pages
- [ ] Hover effects work correctly
- [ ] Loading states show appropriate number of skeletons
- [ ] Content appears with stagger effect
- [ ] No layout shift during loading → content transition
- [ ] Animations respect `prefers-reduced-motion` (browser setting)

---

## Common Issues & Solutions 🔧

### Issue 1: Animations too slow
**Solution:** Reduce timeout values
```tsx
// Before: timeout={400 + index * 100}
// After:  timeout={300 + index * 50}
```

### Issue 2: Too many skeletons
**Solution:** Match content count
```tsx
// Show 6 items per row → 12 skeletons (2 rows)
{[1,2,3,4,5,6,7,8,9,10,11,12].map(...)}
```

### Issue 3: Layout shift during transition
**Solution:** Use same structure for skeleton and content
```tsx
// Both should use same grid/flex layout
<div className="grid grid-cols-6 gap-4">
  {/* Skeletons OR content, never both */}
</div>
```

### Issue 4: Stagger too fast/slow
**Solution:** Adjust stagger multiplier
```tsx
// Slow: timeout={400 + index * 100}  // 100ms between items
// Fast: timeout={400 + index * 30}   // 30ms between items
// Medium: timeout={400 + index * 50} // 50ms between items
```

---

## Visual Examples 🖼️

### Browse Page Flow:
```
1. Page loads
   ↓ 600ms
2. "Browse Categories" header fades in
   ↓ 300ms
3. 12 skeleton cards appear (staggered 50ms each)
   ↓ Data loads
4. Skeleton fades out, category cards grow in (staggered 50ms each)
   ↓ User hovers
5. Card scales to 105% and border glows green
```

### Library Page Flow:
```
1. Page loads
   ↓ 600ms
2. "Your Library" header fades in
   ↓ 700ms
3. Tabs fade in
   ↓ 300ms
4. 6 skeleton cards appear (staggered 100ms each)
   ↓ Data loads
5. Content grows in based on active tab
   - Playlists: Grid (50ms stagger)
   - Tracks: List (30ms stagger)
   - Albums: Grid (50ms stagger)
   - Artists: List (30ms stagger)
```

---

## Performance Notes ⚡

1. **Hardware Acceleration**: Material-UI uses CSS `transform` and `opacity` for animations (GPU-accelerated)

2. **No Layout Thrashing**: Animations don't cause reflows/repaints

3. **Optimized Renders**: Only animating components re-render, not entire page

4. **Lightweight**: Animation library adds ~15KB gzipped (already included in Material-UI)

---

## Accessibility ♿

Material-UI animations automatically respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations become instant transitions */
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**What this means:**
- Users with motion sensitivity won't see animations
- Screen readers work normally
- Keyboard navigation unaffected
- Content still loads in correct order

---

## Next Steps 🚀

1. **Test current implementations**
   - Browse page with various category counts
   - Library page with all 4 tabs

2. **Implement remaining pages**
   - Dashboard (greeting, recently played, top tracks)
   - Artist (header, top tracks, albums, related)
   - Category (header, playlists, artists, tracks)
   - Recommendations (header, insights, playlists)

3. **Create shared components** (optional)
   - `<AnimatedGrid>` wrapper
   - `<AnimatedList>` wrapper
   - `<SkeletonGrid>` component
   - `<SkeletonList>` component

4. **Add micro-interactions**
   - Like button pulse
   - Follow button transition
   - Play button spin
   - Track added toast

---

## Resources 📚

- [Material-UI Transitions Docs](https://mui.com/material-ui/transitions/)
- [Fade API](https://mui.com/material-ui/api/fade/)
- [Grow API](https://mui.com/material-ui/api/grow/)
- [Skeleton API](https://mui.com/material-ui/api/skeleton/)

---

**Last Updated:** October 6, 2025  
**Status:** Browse & Library complete, others ready for implementation
